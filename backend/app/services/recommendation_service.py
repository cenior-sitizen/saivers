"""
Weekly recommendation service.

Flow:
  get_or_generate_weekly_recs(household_id):
    1. Check weekly_recommendations for this ISO week (idempotent — no re-generation)
    2. If empty: query ac_readings this_week vs last_week per room device_id
    3. Call OpenAI with structured JSON prompt → parse per-device recommendations
    4. OpenAI failure fallback: rule-based (usage up >10% → raise temp 1°C)
    5. INSERT into weekly_recommendations
    6. Enrich with already_applied status from applied_recommendations

  apply_recommendation(household_id, rec_id):
    1. Check applied_recommendations (idempotency guard)
    2. Lookup rec settings from weekly_recommendations
    3. Call MCPClient.apply_settings()
    4. On success: INSERT applied_recommendations
    5. Partial fan-out failure: {success: True, partial: True}
"""

from __future__ import annotations

import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

SGT = ZoneInfo("Asia/Singapore")

DEVICE_NAMES: dict[str, str] = {
    "ac-living-room": "Living Room AC",
    "ac-master-room": "Master Room AC",
    "ac-room-1":      "Room 1 AC",
    "ac-room-2":      "Room 2 AC",
}


def _get_client():
    try:
        from app.db.client import get_client
        return get_client()
    except Exception:
        return None


def _current_iso_week() -> str:
    """Return ISO week string for today in SGT, e.g. '2026-W10'."""
    today = datetime.now(SGT)
    iso = today.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def _query_device_usage(client, household_id: int) -> dict[str, dict]:
    """
    Query ac_readings for this-week vs last-week usage per room device_id.
    Returns {device_id: {kwh_this, kwh_last, avg_temp_this, avg_temp_last, runtime_this_h}}
    """
    from datetime import timedelta
    today = datetime.now(SGT).date()
    week_start = today - timedelta(days=6)
    last_week_start = today - timedelta(days=13)

    r = client.query(
        """
        SELECT
            device_id,
            toFloat64(sumIf(kwh, reading_date >= {ws:Date}))                           AS kwh_this,
            toFloat64(sumIf(kwh, reading_date >= {lws:Date} AND reading_date < {ws:Date})) AS kwh_last,
            toFloat64(avgIf(temp_setting_c, is_on = 1 AND reading_date >= {ws:Date}))  AS avg_temp_this,
            toFloat64(avgIf(temp_setting_c, is_on = 1 AND reading_date >= {lws:Date}
                              AND reading_date < {ws:Date}))                            AS avg_temp_last,
            countIf(is_on = 1 AND reading_date >= {ws:Date}) / 2.0                    AS runtime_this_h
        FROM ac_readings
        WHERE household_id = {hid:UInt32}
          AND reading_date >= {lws:Date}
        GROUP BY device_id
        """,
        parameters={"hid": household_id, "ws": str(week_start), "lws": str(last_week_start)},
    )
    result: dict[str, dict] = {}
    for row in list(r.named_results()):
        result[row["device_id"]] = {
            "kwh_this": float(row["kwh_this"] or 0),
            "kwh_last": float(row["kwh_last"] or 0),
            "avg_temp_this": float(row["avg_temp_this"] or 25),
            "avg_temp_last": float(row["avg_temp_last"] or 25),
            "runtime_this_h": float(row["runtime_this_h"] or 0),
        }
    return result


def _rule_based_recs(usage: dict[str, dict]) -> list[dict]:
    """
    Fallback rule: if this-week kWh > last-week * 1.1, recommend +1°C.
    Otherwise keep current settings (no meaningful change to suggest).
    """
    recs = []
    for device_id, u in usage.items():
        current_temp = max(16, int(round(u["avg_temp_this"]))) or 25
        if u["kwh_last"] > 0 and u["kwh_this"] > u["kwh_last"] * 1.1:
            rec_temp = min(30, current_temp + 1)
            reason = (
                f"Usage up {round((u['kwh_this'] / u['kwh_last'] - 1) * 100, 1)}% "
                f"vs last week. Raising set-point by 1°C reduces power draw ~5%."
            )
        else:
            rec_temp = current_temp
            reason = "Usage is on track. No change recommended this week."
        recs.append({
            "device_id": device_id,
            "rec_temp": rec_temp,
            "rec_mode": "cool",
            "reason": reason,
        })
    return recs


def _openai_recs(usage: dict[str, dict]) -> list[dict]:
    """
    Call OpenAI GPT-4o with structured JSON output to generate recommendations.
    Returns list of {device_id, rec_temp, rec_mode, reason} dicts.
    Raises on failure — caller handles fallback.
    """
    from app.services.ai_service import get_openai_client
    client = get_openai_client()

    usage_lines = []
    for device_id, u in usage.items():
        name = DEVICE_NAMES.get(device_id, device_id)
        pct = round((u["kwh_this"] / u["kwh_last"] - 1) * 100, 1) if u["kwh_last"] > 0 else 0
        usage_lines.append(
            f"- {name} ({device_id}): this_week={u['kwh_this']:.2f}kWh, "
            f"last_week={u['kwh_last']:.2f}kWh, change={pct:+.1f}%, "
            f"avg_temp={u['avg_temp_this']:.0f}°C, runtime={u['runtime_this_h']:.1f}h"
        )

    prompt = (
        "You are WattCoach, a Singapore HDB energy advisor. "
        "Based on this week's AC usage vs last week, recommend temperature "
        "and mode settings for each room. Prioritise energy savings.\n\n"
        "Usage data:\n" + "\n".join(usage_lines) + "\n\n"
        "Return ONLY a valid JSON array. Each element must have exactly these keys: "
        "device_id (string), rec_temp (integer 16-30), rec_mode (string: cool|fan|dry), "
        "reason (string, max 100 chars). No explanation outside the JSON."
    )

    import json
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=500,
        temperature=0.2,
    )
    raw = response.choices[0].message.content.strip()
    parsed = json.loads(raw)

    # Handle both {"recommendations": [...]} and direct [...]
    if isinstance(parsed, dict):
        recs = next(iter(parsed.values()))
    else:
        recs = parsed

    # Validate and clamp
    result = []
    for rec in recs:
        result.append({
            "device_id": str(rec["device_id"]),
            "rec_temp": max(16, min(30, int(rec["rec_temp"]))),
            "rec_mode": rec["rec_mode"] if rec["rec_mode"] in ("cool", "fan", "dry") else "cool",
            "reason": str(rec["reason"])[:200],
        })
    return result


def get_or_generate_weekly_recs(household_id: int) -> list[dict]:
    """
    Return this ISO week's recommendations for household.
    Generates via OpenAI (or rule-based fallback) if not yet in DB.
    Always idempotent — never double-generates for the same iso_week.
    """
    client = _get_client()
    iso_week = _current_iso_week()

    # 1. Check if already generated for this week
    if client:
        r = client.query(
            """
            SELECT rec_id, device_id, current_temp, rec_temp,
                   current_mode, rec_mode, reason, ai_summary
            FROM weekly_recommendations
            WHERE household_id = {hid:UInt32} AND iso_week = {wk:String}
            ORDER BY device_id
            """,
            parameters={"hid": household_id, "wk": iso_week},
        )
        existing = list(r.named_results())
        if existing:
            return _enrich_with_applied(client, household_id, existing, iso_week)

    # 2. Query usage data
    usage: dict[str, dict] = {}
    if client:
        try:
            usage = _query_device_usage(client, household_id)
        except Exception:
            pass

    if not usage:
        # No data — return empty (nothing to recommend)
        return []

    # 3. Generate recommendations (OpenAI with rule-based fallback)
    try:
        raw_recs = _openai_recs(usage)
    except Exception:
        raw_recs = _rule_based_recs(usage)

    # 4. Build rows for INSERT
    now_str = datetime.now(SGT).isoformat()
    rows: list[list] = []
    rec_dicts: list[dict] = []

    for rec in raw_recs:
        device_id = rec["device_id"]
        u = usage.get(device_id, {})
        rec_id = str(uuid.uuid4())
        current_temp = max(16, int(round(u.get("avg_temp_this", 25))))
        current_mode = "cool"

        rows.append([
            household_id, iso_week, rec_id, device_id,
            current_temp, rec["rec_temp"],
            current_mode, rec["rec_mode"],
            rec["reason"], "",
        ])
        rec_dicts.append({
            "rec_id": rec_id,
            "device_id": device_id,
            "device_name": DEVICE_NAMES.get(device_id, device_id),
            "current_temp": current_temp,
            "rec_temp": rec["rec_temp"],
            "current_mode": current_mode,
            "rec_mode": rec["rec_mode"],
            "reason": rec["reason"],
            "already_applied": False,
        })

    # 5. INSERT into weekly_recommendations
    if client and rows:
        try:
            client.insert(
                "weekly_recommendations",
                rows,
                column_names=[
                    "household_id", "iso_week", "rec_id", "device_id",
                    "current_temp", "rec_temp", "current_mode", "rec_mode",
                    "reason", "ai_summary",
                ],
            )
        except Exception:
            pass

    return rec_dicts


def _enrich_with_applied(client, household_id: int, rows: list[dict], iso_week: str) -> list[dict]:
    """
    Enrich recommendation rows with already_applied flag.
    Checks applied_recommendations for matching rec_ids.
    """
    try:
        rec_ids = [row["rec_id"] for row in rows]
        ids_str = ", ".join(f"'{r}'" for r in rec_ids)
        r = client.query(
            f"""
            SELECT DISTINCT rec_id
            FROM applied_recommendations
            WHERE household_id = {{hid:UInt32}}
              AND rec_id IN ({ids_str})
            """,
            parameters={"hid": household_id},
        )
        applied_ids = {row["rec_id"] for row in list(r.named_results())}
    except Exception:
        applied_ids = set()

    result = []
    for row in rows:
        result.append({
            "rec_id": row["rec_id"],
            "device_id": row["device_id"],
            "device_name": DEVICE_NAMES.get(row["device_id"], row["device_id"]),
            "current_temp": int(row["current_temp"]),
            "rec_temp": int(row["rec_temp"]),
            "current_mode": row["current_mode"],
            "rec_mode": row["rec_mode"],
            "reason": row["reason"],
            "already_applied": row["rec_id"] in applied_ids,
        })
    return result


def apply_recommendation(household_id: int, rec_id: str) -> dict:
    """
    Apply a single recommendation via MCPClient.
    Idempotent: returns {already_applied: True} if already done.
    Partial success: if some simulator units fail, still marks as applied.
    """
    client = _get_client()

    # 1. Idempotency check
    if client:
        r = client.query(
            """
            SELECT count() AS cnt
            FROM applied_recommendations
            WHERE household_id = {hid:UInt32} AND rec_id = {rid:String}
            """,
            parameters={"hid": household_id, "rid": rec_id},
        )
        cnt = int(list(r.named_results())[0]["cnt"] or 0)
        if cnt > 0:
            return {"already_applied": True, "rec_id": rec_id}

    # 2. Lookup recommendation
    if client is None:
        return {"success": False, "rec_id": rec_id, "error": "Database unavailable"}

    r = client.query(
        """
        SELECT device_id, rec_temp, rec_mode
        FROM weekly_recommendations
        WHERE household_id = {hid:UInt32} AND rec_id = {rid:String}
        LIMIT 1
        """,
        parameters={"hid": household_id, "rid": rec_id},
    )
    rows = list(r.named_results())
    if not rows:
        return {"success": False, "rec_id": rec_id, "error": "Recommendation not found"}

    rec = rows[0]
    device_id = rec["device_id"]
    rec_temp = int(rec["rec_temp"])
    rec_mode = str(rec["rec_mode"])

    # 3. Call MCPClient
    from app.services.mcp_client import MCPClient
    mcp = MCPClient(household_id)
    result = mcp.apply_settings(device_id, rec_temp, rec_mode)

    action_id = f"ACT-{household_id}-{rec_id[:8]}"

    # 4. Record in applied_recommendations (even on partial success)
    if result["success"] and client:
        try:
            client.insert(
                "applied_recommendations",
                [[household_id, rec_id, action_id, rec_temp, rec_mode]],
                column_names=["household_id", "rec_id", "action_id", "new_temp", "new_mode"],
            )
        except Exception:
            pass

    return {
        "success": result["success"],
        "partial": result.get("partial", False),
        "rec_id": rec_id,
        "device_id": device_id,
        "action_id": action_id,
        "new_temp": rec_temp,
        "new_mode": rec_mode,
        "units": result.get("units", []),
    }


def get_recommendation_history(household_id: int, weeks: int = 4) -> list[dict]:
    """
    Return last N ISO weeks of recommendations with applied counts.
    """
    client = _get_client()
    if client is None:
        return []

    try:
        r = client.query(
            """
            SELECT
                iso_week,
                count() AS total_count
            FROM weekly_recommendations
            WHERE household_id = {hid:UInt32}
            GROUP BY iso_week
            ORDER BY iso_week DESC
            LIMIT {lim:UInt8}
            """,
            parameters={"hid": household_id, "lim": weeks},
        )
        week_rows = list(r.named_results())

        result = []
        for wrow in week_rows:
            wk = wrow["iso_week"]
            # Get recommendations for this week
            r2 = client.query(
                """
                SELECT rec_id, device_id, current_temp, rec_temp,
                       current_mode, rec_mode, reason
                FROM weekly_recommendations
                WHERE household_id = {hid:UInt32} AND iso_week = {wk:String}
                ORDER BY device_id
                """,
                parameters={"hid": household_id, "wk": wk},
            )
            recs = list(r2.named_results())
            enriched = _enrich_with_applied(client, household_id, recs, wk)
            applied_count = sum(1 for e in enriched if e["already_applied"])
            result.append({
                "iso_week": wk,
                "recommendations": enriched,
                "applied_count": applied_count,
                "total_count": int(wrow["total_count"]),
            })
        return result
    except Exception:
        return []
