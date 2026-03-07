"""
Habit tracking service.

Evaluates daily habits against thresholds, tracks streaks,
and computes weekly energy impact.
All ClickHouse writes are append-only (no UPDATE/DELETE).
"""

from __future__ import annotations

HABITS: dict[str, dict] = {
    "offpeak_ac": {
        "label": "Off-peak AC",
        "description": "AC usage below 0.3 kWh during 7pm–11pm peak window (slots 36–45)",
        "threshold_kwh": 0.3,
        "daily_points": 20,
    },
    "weekly_reduction": {
        "label": "Weekly reduction",
        "description": "This week's total kWh < 95% of last week's",
        "threshold_pct": 0.95,
        "weekly_points": 50,
        "daily_points": 50,  # alias so evaluate router can use .get("daily_points", 0)
    },
}

STREAK_MILESTONES: dict[int, int] = {7: 100, 14: 250, 30: 500}
VOUCHER_THRESHOLD = 500


def _get_client():
    try:
        from app.db.client import get_client
        return get_client()
    except Exception:
        return None


def evaluate_daily_habits(household_id: int) -> dict:
    """
    Evaluate today's habits for a household.
    Returns dict of habit_type → {achieved, actual_kwh, threshold_kwh}.
    """
    client = _get_client()
    results: dict[str, dict] = {}

    # --- offpeak_ac: AC kWh during peak slots (36-45) today ---
    if client:
        try:
            r = client.query(
                """
                SELECT sum(kwh) AS peak_kwh
                FROM ac_readings
                WHERE household_id = {hid:UInt32}
                  AND reading_date = today()
                  AND slot_idx BETWEEN 36 AND 45
                  AND is_on = 1
                """,
                parameters={"hid": household_id},
            )

            peak_kwh = float(next(iter(r.named_results()))["peak_kwh"] or 0)
        except Exception:
            peak_kwh = 0.0
    else:
        peak_kwh = 0.0

    threshold = HABITS["offpeak_ac"]["threshold_kwh"]
    achieved = peak_kwh < threshold
    results["offpeak_ac"] = {
        "achieved": achieved,
        "actual_kwh": round(peak_kwh, 3),
        "threshold_kwh": threshold,
    }

    # --- weekly_reduction: this week < 95% of last week ---
    if client:
        try:
            r = client.query(
                """
                SELECT
                    sumIf(kwh, interval_date >= today()-7)                    AS this_week,
                    sumIf(kwh, interval_date BETWEEN today()-14 AND today()-8) AS last_week
                FROM sp_energy_intervals
                WHERE household_id = {hid:UInt32}
                """,
                parameters={"hid": household_id},
            )

            row = next(iter(r.named_results()))
            this_w = float(row["this_week"] or 0)
            last_w = float(row["last_week"] or 1)
            on_track = this_w < last_w * HABITS["weekly_reduction"]["threshold_pct"]
        except Exception:
            this_w, last_w, on_track = 0, 0, False
    else:
        this_w, last_w, on_track = 0, 0, False

    results["weekly_reduction"] = {
        "achieved": on_track,
        "this_week_kwh": round(this_w, 2),
        "last_week_kwh": round(last_w, 2),
    }

    return results


def get_streak(household_id: int, habit_type: str) -> int:
    """Return current streak day count from the latest habit_events row."""
    client = _get_client()
    if client is None:
        return 0
    try:
        r = client.query(
            """
            SELECT streak_day
            FROM habit_events
            WHERE household_id = {hid:UInt32}
              AND habit_type = {ht:String}
              AND achieved = 1
            ORDER BY event_date DESC
            LIMIT 1
            """,
            parameters={"hid": household_id, "ht": habit_type},
        )
        rows = list(r.named_results())
        return int(rows[0]["streak_day"]) if rows else 0
    except Exception:
        return 0


def get_week_rate(household_id: int, habit_type: str) -> float:
    """Return fraction of days this week where the habit was achieved."""
    client = _get_client()
    if client is None:
        return 0.0
    try:
        r = client.query(
            """
            SELECT countIf(achieved = 1) AS achieved_days, count() AS total_days
            FROM habit_events
            WHERE household_id = {hid:UInt32}
              AND habit_type = {ht:String}
              AND event_date >= today() - 7
            """,
            parameters={"hid": household_id, "ht": habit_type},
        )

        row = next(iter(r.named_results()))
        total = int(row["total_days"] or 0)
        achieved = int(row["achieved_days"] or 0)
        return round(achieved / total, 2) if total else 0.0
    except Exception:
        return 0.0


def compute_weekly_impact(household_id: int) -> dict:
    """Compute kWh/SGD/CO2 saved this week vs 4-week rolling baseline."""
    client = _get_client()
    if client is None:
        return {"kwh_saved": 0, "sgd_saved": 0, "co2_saved": 0, "reduction_pct": 0}
    try:
        r = client.query(
            """
            SELECT
                sumIf(kwh, interval_date >= today()-7)                       AS this_week,
                sumIf(kwh, interval_date BETWEEN today()-35 AND today()-8) / 4 AS baseline_week
            FROM sp_energy_intervals
            WHERE household_id = {hid:UInt32}
            """,
            parameters={"hid": household_id},
        )

        row = next(iter(r.named_results()))
        this_w = float(row["this_week"] or 0)
        baseline = float(row["baseline_week"] or 1)
        saved = max(0.0, baseline - this_w)
        return {
            "kwh_saved": round(saved, 2),
            "sgd_saved": round(saved * 0.2911, 2),
            "co2_saved": round(saved * 0.402, 2),
            "reduction_pct": round(saved / baseline * 100, 1) if baseline else 0,
        }
    except Exception as e:
        return {"error": str(e), "kwh_saved": 0, "sgd_saved": 0, "co2_saved": 0, "reduction_pct": 0}


def record_habit_event(household_id: int, habit_type: str, achieved: bool,
                        actual_kwh: float, threshold_kwh: float, streak_day: int) -> None:
    """Append a habit evaluation event to ClickHouse (append-only, no UPDATE)."""
    client = _get_client()
    if client is None:
        return
    from datetime import date
    try:
        client.insert(
            "habit_events",
            [[household_id, habit_type, date.today().isoformat(),
              achieved, threshold_kwh, actual_kwh, streak_day]],
            column_names=["household_id", "habit_type", "event_date",
                          "achieved", "threshold_kwh", "actual_kwh", "streak_day"],
        )
    except Exception:
        pass
