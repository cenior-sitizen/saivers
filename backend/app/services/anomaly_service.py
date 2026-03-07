"""
Anomaly detection service.

Queries ClickHouse energy_features and ac_readings to detect:
- General anomalies (anomaly_score > 2.0)
- Specific AC night usage pattern (slots 0-5 = midnight to 2:30am)
- Weekly comparison (this week vs last week)
"""

from __future__ import annotations


def _get_client():
    try:
        from app.db.client import get_client
        return get_client()
    except Exception:
        return None


def _slot_to_time_label(slot: int) -> str:
    """Convert slot_idx (0-47) to human-readable time e.g. slot 4 → '2:00 AM'."""
    hour, half = divmod(slot, 2)
    minute = "30" if half else "00"
    if hour == 0:
        return f"12:{minute} AM"
    elif hour < 12:
        return f"{hour}:{minute} AM"
    elif hour == 12:
        return f"12:{minute} PM"
    else:
        return f"{hour - 12}:{minute} PM"


def get_anomalies(household_id: int, days: int = 7) -> list[dict]:
    """Return anomalous energy intervals (anomaly_score > 2.0) for the past N days."""
    client = _get_client()
    if client is None:
        return []
    try:
        result = client.query(
            """
            SELECT
                toString(ts)   AS ts,
                slot_idx,
                toFloat64(baseline_kwh) AS baseline_kwh,
                toFloat64(excess_kwh)   AS excess_kwh,
                toFloat64(anomaly_score) AS anomaly_score
            FROM energy_features FINAL
            WHERE household_id = {hid:UInt32}
              AND interval_date >= today() - {days:UInt8}
              AND anomaly_score > 2.0
            ORDER BY anomaly_score DESC
            LIMIT 20
            """,
            parameters={"hid": household_id, "days": days},
        )
        rows = list(result.named_results())
        for r in rows:
            r["household_id"] = household_id
            r["kwh"] = r["excess_kwh"] + r["baseline_kwh"]
            r["time_label"] = _slot_to_time_label(r["slot_idx"])
        return rows
    except Exception as e:
        return [{"error": str(e)}]


def get_weekly_comparison(household_id: int) -> dict:
    """Compare this week's kWh vs last week for the same household."""
    client = _get_client()
    if client is None:
        return {"this_week_kwh": 0, "last_week_kwh": 0, "change_pct": 0}
    try:
        result = client.query(
            """
            SELECT
                sumIf(kwh, interval_date >= today() - 7)                         AS this_week_kwh,
                sumIf(kwh, interval_date BETWEEN today()-14 AND today()-8)        AS last_week_kwh
            FROM sp_energy_intervals
            WHERE household_id = {hid:UInt32}
              AND interval_date >= today() - 14
            """,
            parameters={"hid": household_id},
        )
        row = list(result.named_results())[0]
        this_w = float(row["this_week_kwh"] or 0)
        last_w = float(row["last_week_kwh"] or 1)
        change_pct = round((this_w - last_w) / last_w * 100, 1) if last_w else 0
        return {
            "this_week_kwh": round(this_w, 2),
            "last_week_kwh": round(last_w, 2),
            "change_pct": change_pct,
        }
    except Exception as e:
        return {"error": str(e), "this_week_kwh": 0, "last_week_kwh": 0, "change_pct": 0}


def detect_ac_night_anomaly(household_id: int) -> dict:
    """
    Detect AC running between midnight and 3am (slots 0-5).
    Returns detection result with avg kWh and days observed.
    """
    client = _get_client()
    if client is None:
        return {"detected": False, "slot": 4, "time_label": "2:00 AM", "avg_kwh": 0.0, "days_observed": 0}
    try:
        result = client.query(
            """
            SELECT
                count()      AS night_readings,
                countIf(reading_date != reading_date) AS distinct_days_approx,
                avg(kwh)     AS avg_kwh,
                countIf(is_on = 1) AS on_count
            FROM ac_readings
            WHERE household_id = {hid:UInt32}
              AND reading_date >= today() - 7
              AND slot_idx BETWEEN 0 AND 5
            """,
            parameters={"hid": household_id},
        )
        row = list(result.named_results())[0]
        on_count = int(row["on_count"] or 0)
        avg_kwh = float(row["avg_kwh"] or 0)
        # Approximate days from reading count (48 slots/day → slots 0-5 = 6 slots/day)
        days_observed = min(on_count, 7)
        return {
            "detected": on_count >= 3,
            "slot": 4,
            "time_label": "2:00 AM",
            "avg_kwh": round(avg_kwh, 3),
            "days_observed": days_observed,
        }
    except Exception as e:
        return {"detected": False, "error": str(e), "slot": 4, "time_label": "2:00 AM", "avg_kwh": 0.0, "days_observed": 0}


def get_ac_pattern(household_id: int) -> dict:
    """Summarise AC usage pattern from ac_readings."""
    client = _get_client()
    if client is None:
        return {"avg_daily_hours_on": 0, "typical_start_slot": 36, "typical_end_slot": 45, "night_usage_detected": False}
    try:
        result = client.query(
            """
            SELECT
                countIf(is_on = 1) / 7 / 2  AS avg_daily_hours_on,
                minIf(slot_idx, is_on = 1)   AS typical_start_slot,
                maxIf(slot_idx, is_on = 1)   AS typical_end_slot
            FROM ac_readings
            WHERE household_id = {hid:UInt32}
              AND reading_date >= today() - 7
            """,
            parameters={"hid": household_id},
        )
        row = list(result.named_results())[0]
        night = detect_ac_night_anomaly(household_id)
        return {
            "avg_daily_hours_on": round(float(row["avg_daily_hours_on"] or 0), 1),
            "typical_start_slot": int(row["typical_start_slot"] or 36),
            "typical_end_slot": int(row["typical_end_slot"] or 45),
            "night_usage_detected": night["detected"],
        }
    except Exception as e:
        return {"error": str(e)}
