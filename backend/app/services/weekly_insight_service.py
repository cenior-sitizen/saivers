"""
Weekly insight service.

Insights are generated once per week (manual trigger or seed script).
Status lifecycle: unread → read → approved | dismissed
ReplacingMergeTree(updated_at): update status by re-inserting full row with newer updated_at.
Always query with FINAL to get latest version per insight.
"""

from __future__ import annotations

import json
from datetime import datetime
from zoneinfo import ZoneInfo

SGT = ZoneInfo("Asia/Singapore")

COLUMN_NAMES = [
    "insight_id", "household_id", "week_start", "generated_at",
    "signal_type", "ac_night_anomaly", "nights_observed", "weekly_increase",
    "this_week_kwh", "last_week_kwh", "change_pct",
    "weekly_cost_sgd", "weekly_carbon_kg",
    "ai_summary", "recommendation_type", "recommendation_json",
    "notification_title", "notification_body",
    "status", "updated_at",
]


def _get_client():
    try:
        from app.db.client import get_client
        return get_client()
    except Exception:
        return None


def _row_to_dict(r: dict) -> dict:
    return {
        **r,
        "this_week_kwh": float(r.get("this_week_kwh") or 0),
        "last_week_kwh": float(r.get("last_week_kwh") or 0),
        "change_pct": float(r.get("change_pct") or 0),
        "weekly_cost_sgd": float(r.get("weekly_cost_sgd") or 0),
        "weekly_carbon_kg": float(r.get("weekly_carbon_kg") or 0),
        "ac_night_anomaly": bool(r.get("ac_night_anomaly")),
        "weekly_increase": bool(r.get("weekly_increase")),
        "nights_observed": int(r.get("nights_observed") or 0),
        "recommendation": json.loads(r.get("recommendation_json") or "{}"),
    }


def get_weekly_insights(household_id: int) -> list[dict]:
    """Return all weekly insights for a household, newest first."""
    client = _get_client()
    if client is None:
        return []
    try:
        result = client.query(
            """
            SELECT
                insight_id,
                household_id,
                toString(week_start)        AS week_start,
                toString(generated_at)      AS generated_at,
                signal_type,
                ac_night_anomaly,
                nights_observed,
                weekly_increase,
                toFloat64(this_week_kwh)    AS this_week_kwh,
                toFloat64(last_week_kwh)    AS last_week_kwh,
                toFloat32(change_pct)       AS change_pct,
                toFloat64(weekly_cost_sgd)  AS weekly_cost_sgd,
                toFloat64(weekly_carbon_kg) AS weekly_carbon_kg,
                ai_summary,
                recommendation_type,
                recommendation_json,
                notification_title,
                notification_body,
                status
            FROM weekly_insights FINAL
            WHERE household_id = {hid:UInt32}
            ORDER BY week_start DESC
            """,
            parameters={"hid": household_id},
        )
        return [_row_to_dict(dict(r)) for r in result.named_results()]
    except Exception as e:
        return [{"error": str(e)}]


def get_unread_count(household_id: int) -> int:
    """Return count of unread insights for the bell badge."""
    client = _get_client()
    if client is None:
        return 0
    try:
        result = client.query(
            """
            SELECT count() AS cnt
            FROM weekly_insights FINAL
            WHERE household_id = {hid:UInt32}
              AND status = 'unread'
            """,
            parameters={"hid": household_id},
        )
        return int(list(result.named_results())[0]["cnt"])
    except Exception:
        return 0


def update_insight_status(insight_id: str, new_status: str) -> bool:
    """
    Update insight status by fetching the current row and re-inserting with new status.
    ReplacingMergeTree(updated_at) keeps the latest version on FINAL queries.
    """
    client = _get_client()
    if client is None:
        return False
    try:
        result = client.query(
            """
            SELECT
                insight_id, household_id,
                toString(week_start)    AS week_start,
                toString(generated_at)  AS generated_at,
                signal_type, ac_night_anomaly, nights_observed, weekly_increase,
                toFloat64(this_week_kwh)    AS this_week_kwh,
                toFloat64(last_week_kwh)    AS last_week_kwh,
                toFloat32(change_pct)       AS change_pct,
                toFloat64(weekly_cost_sgd)  AS weekly_cost_sgd,
                toFloat64(weekly_carbon_kg) AS weekly_carbon_kg,
                ai_summary, recommendation_type, recommendation_json,
                notification_title, notification_body, status
            FROM weekly_insights FINAL
            WHERE insight_id = {iid:String}
            LIMIT 1
            """,
            parameters={"iid": insight_id},
        )
        rows = list(result.named_results())
        if not rows:
            return False
        r = rows[0]
        now = datetime.now(SGT).strftime("%Y-%m-%d %H:%M:%S")
        client.insert(
            "weekly_insights",
            [[
                r["insight_id"],
                int(r["household_id"]),
                r["week_start"],
                r["generated_at"],
                r["signal_type"],
                bool(r["ac_night_anomaly"]),
                int(r["nights_observed"]),
                bool(r["weekly_increase"]),
                float(r["this_week_kwh"]),
                float(r["last_week_kwh"]),
                float(r["change_pct"]),
                float(r["weekly_cost_sgd"]),
                float(r["weekly_carbon_kg"]),
                r["ai_summary"],
                r["recommendation_type"],
                r["recommendation_json"],
                r["notification_title"],
                r["notification_body"],
                new_status,
                now,
            ]],
            column_names=COLUMN_NAMES,
        )
        return True
    except Exception:
        return False


def approve_insight(insight_id: str, household_id: int) -> dict:
    """
    Approve an insight: apply the AC recommendation, log to device_actions,
    update insight status to 'approved'.
    """
    client = _get_client()
    if client is None:
        return {"success": False, "message": "Database unavailable"}

    # Get the insight
    try:
        result = client.query(
            """
            SELECT recommendation_json
            FROM weekly_insights FINAL
            WHERE insight_id = {iid:String} AND household_id = {hid:UInt32}
            LIMIT 1
            """,
            parameters={"iid": insight_id, "hid": household_id},
        )
        rows = list(result.named_results())
        if not rows:
            return {"success": False, "message": "Insight not found"}
        rec = json.loads(rows[0]["recommendation_json"] or "{}")
    except Exception as e:
        return {"success": False, "message": str(e)}

    # Apply AC recommendation if action is ac_schedule
    action = rec.get("action", "")
    applied = {}
    if action == "ac_schedule":
        start_time = rec.get("start_time", "22:00")
        end_time = rec.get("end_time", "02:00")
        temp_c = rec.get("temp_c", 25)
        try:
            from app.services.device_store import compute_savings, set_schedule
            set_schedule(household_id, start_time, end_time, temp_c)
            kwh_saved, sgd_saved = compute_savings(start_time, end_time)
            applied = {
                "start_time": start_time,
                "end_time": end_time,
                "temp_c": temp_c,
                "projected_kwh_saved": kwh_saved,
                "projected_sgd_saved": sgd_saved,
            }
        except Exception as e:
            applied = {"error": str(e)}

    # Update status
    update_insight_status(insight_id, "approved")

    return {
        "success": True,
        "insight_id": insight_id,
        "action_applied": action,
        "schedule": applied,
        "message": f"Recommendation approved. AC scheduled: {applied.get('start_time', '')}–{applied.get('end_time', '')} at {applied.get('temp_c', 25)}°C",
    }
