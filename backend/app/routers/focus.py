"""
Focus action endpoints.

GET /api/focus/{household_id}      — current week's single focus action
GET /api/focus/{household_id}/why  — AI-personalised "Why this works for you" explanation
"""

import json
from datetime import date
from fastapi import APIRouter, HTTPException
from app.db.client import get_client

router = APIRouter()

# Singapore seasonal context by month
_SEASONS = {
    12: ("Northeast Monsoon peak",   "Cooler, very humid, frequent heavy showers. Nights feel sticky even at lower temps."),
    1:  ("Northeast Monsoon peak",   "Cooler, very humid, frequent heavy showers. Nights feel sticky even at lower temps."),
    2:  ("Northeast Monsoon late",   "Still humid, intermittent showers. Evenings start warming toward inter-monsoon."),
    3:  ("Inter-monsoon (NE→SW)",    "Transitional — variable weather, afternoon thunderstorms, warm humid evenings."),
    4:  ("Inter-monsoon (NE→SW)",    "Warmer and more humid. AC demand rises. Afternoons can hit 34–35°C."),
    5:  ("Southwest Monsoon onset",  "Hot and humid. Haze possible. Evenings remain warm past midnight."),
    6:  ("Southwest Monsoon",        "Hot, humid, hazy. Nights stay above 28°C outdoors. AC feels essential."),
    7:  ("Southwest Monsoon peak",   "Hottest period. Haze can worsen. Indoor comfort needs careful management."),
    8:  ("Southwest Monsoon late",   "Still hot and humid. Slight cooling possible late evening."),
    9:  ("Southwest Monsoon late",   "Transitioning. Sporadic showers begin. Slightly cooler pre-dawn."),
    10: ("Inter-monsoon (SW→NE)",    "Thunderstorm season. Heavy evening showers. Rapid temperature swings."),
    11: ("Northeast Monsoon early",  "Cooling begins. Rain more frequent. Nights becoming more comfortable."),
}

_NEIGHBORHOOD_NOTES = {
    1001: ("Punggol", "Waterfront estate — good sea breeze from Strait of Johor, slightly cooler than inland areas by 0.5–1°C."),
    1002: ("Jurong West", "Inland, west-facing — one of Singapore's hottest zones. Afternoon sun heats walls until late evening."),
    1003: ("Bedok", "East-facing coast — catches northeast monsoon breeze. Cooler evenings than the west side of Singapore."),
}

_HDB_TYPES = {
    1001: "5-room HDB (~110sqm)",
    1002: "4-room HDB (~90sqm)",
    1003: "3-room HDB (~65sqm)",
}

_NAMES = {1001: "Ahmad", 1002: "Priya", 1003: "Wei Ming"}


@router.get("/{household_id}/why")
def get_why_explanation(household_id: int):
    """
    Generate a personalised 'Why this works for you' explanation using:
    - User's actual ClickHouse behaviour data
    - Singapore seasonal context
    - HDB type + neighbourhood orientation
    - The specific focus action
    """
    client = get_client()
    if client is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    # ── 1. Fetch the focus action ──────────────────────────────────────────
    action_result = client.query(
        """
        SELECT action_title, potential_saving_sgd, why_body, how_steps_json
        FROM focus_actions FINAL
        WHERE household_id = {hid:UInt32}
        ORDER BY week_start DESC LIMIT 1
        """,
        parameters={"hid": household_id},
    )
    action_rows = list(action_result.named_results())
    if not action_rows:
        raise HTTPException(status_code=404, detail="No focus action found")
    action = action_rows[0]

    # ── 2. Fetch behaviour summary from ClickHouse ────────────────────────
    beh_result = client.query(
        """
        SELECT
            round(sum(kwh) / 7, 2)              AS avg_daily_kwh,
            round(countIf(is_on) * 0.5 / 7, 1) AS avg_daily_runtime_h,
            round(avg(temp_setting_c), 1)        AS avg_temp_c,
            round(sum(kwh), 1)                   AS this_week_kwh
        FROM ac_readings
        WHERE household_id = {hid:UInt32}
          AND reading_date >= toStartOfWeek(today())
        """,
        parameters={"hid": household_id},
    )
    beh_rows = list(beh_result.named_results())
    beh = beh_rows[0] if beh_rows else {}

    # Peak hour range from SP energy data
    peak_result = client.query(
        """
        SELECT
            argMax(slot_idx, kwh) AS peak_slot
        FROM sp_energy_intervals
        WHERE household_id = {hid:UInt32}
          AND interval_date >= toStartOfWeek(today())
        """,
        parameters={"hid": household_id},
    )
    peak_rows = list(peak_result.named_results())
    peak_slot = int(peak_rows[0]["peak_slot"]) if peak_rows else None
    peak_hour_range = None
    if peak_slot is not None:
        h = peak_slot // 2
        peak_hour_range = f"{h:02d}:00–{(h+2) % 24:02d}:00"

    # vs last week
    sp_result = client.query(
        """
        SELECT
            sumIf(kwh, interval_date >= toStartOfWeek(today()))    AS this_week,
            sumIf(kwh, interval_date >= toStartOfWeek(today()) - 7
                   AND interval_date < toStartOfWeek(today()))     AS last_week
        FROM sp_energy_intervals
        WHERE household_id = {hid:UInt32}
        """,
        parameters={"hid": household_id},
    )
    sp_rows = list(sp_result.named_results())
    vs_last_week_pct = 0.0
    this_week_kwh = float(beh.get("this_week_kwh") or 0)
    if sp_rows:
        tw = float(sp_rows[0]["this_week"] or 0)
        lw = float(sp_rows[0]["last_week"] or 0)
        this_week_kwh = tw
        if lw > 0:
            vs_last_week_pct = round((tw - lw) / lw * 100, 1)

    # ── 3. Build context dict ──────────────────────────────────────────────
    month = date.today().month
    season_name, season_notes = _SEASONS.get(month, ("Tropical", "Warm and humid year-round."))
    neighborhood, neighborhood_notes = _NEIGHBORHOOD_NOTES.get(household_id, ("Singapore", "Typical HDB estate."))
    flat_type = _HDB_TYPES.get(household_id, "4-room HDB")
    name = _NAMES.get(household_id, "Resident")

    context = {
        "name": name,
        "flat_type": flat_type,
        "neighborhood": neighborhood,
        "neighborhood_notes": neighborhood_notes,
        "action_title": action["action_title"],
        "potential_saving_sgd": float(action["potential_saving_sgd"] or 0),
        "why_body": action["why_body"],
        "avg_daily_runtime_h": float(beh.get("avg_daily_runtime_h") or 0),
        "current_temp_c": float(beh.get("avg_temp_c") or 0) or None,
        "this_week_kwh": round(this_week_kwh, 1),
        "vs_last_week_pct": vs_last_week_pct,
        "peak_hour_range": peak_hour_range,
        "singapore_season": season_name,
        "season_notes": season_notes,
    }

    # ── 4. Generate AI explanation ─────────────────────────────────────────
    from app.services.ai_service import generate_why_explanation
    result = generate_why_explanation(context)
    return {
        "explanation": result["explanation"],
        "factors": result["factors"],
        "action_title": action["action_title"],
        "how_steps": json.loads(action["how_steps_json"] or "[]"),
    }


@router.get("/{household_id}")
def get_focus_action(household_id: int):
    """Return the current week's focus action for a household."""
    client = get_client()
    if client is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    result = client.query(
        """
        SELECT
            action_id, household_id, week_start,
            action_title, action_subtitle, category,
            CAST(potential_saving_sgd AS Float32) AS potential_saving_sgd,
            why_headline, why_body, how_steps_json,
            effort_level, impact_level
        FROM focus_actions FINAL
        WHERE household_id = {hid:UInt32}
        ORDER BY week_start DESC
        LIMIT 1
        """,
        parameters={"hid": household_id},
    )
    rows = list(result.named_results())
    if not rows:
        raise HTTPException(status_code=404, detail="No focus action found")

    row = rows[0]
    return {
        "action_id": row["action_id"],
        "household_id": row["household_id"],
        "week_start": str(row["week_start"]),
        "action_title": row["action_title"],
        "action_subtitle": row["action_subtitle"],
        "category": row["category"],
        "potential_saving_sgd": float(row["potential_saving_sgd"]),
        "why_headline": row["why_headline"],
        "why_body": row["why_body"],
        "how_steps": json.loads(row["how_steps_json"] or "[]"),
        "effort_level": row["effort_level"],
        "impact_level": row["impact_level"],
    }
