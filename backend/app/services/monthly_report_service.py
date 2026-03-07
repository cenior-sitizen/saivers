"""
Monthly performance report service.

Flow:
  generate_monthly_report(household_id, year, month):
    1. Compute month boundaries (SGT)
    2. Query sp_energy_intervals → this-month and prev-month kWh/cost/carbon
    3. Query habit_events → achieved count this month
    4. Query applied_recommendations → applied count this month
    5. Query weekly_recommendations → total generated this month
    6. Query neighborhood_rollup MV → neighbourhood avg kWh (sumMerge / uniqMerge)
    7. Query sp_energy_intervals per household → percentile rank in neighbourhood
    8. Compute green_grid_co2_kg = max(0, (avg - this_hh) * 0.402)
    9. Call OpenAI GPT-4o for narrative (template fallback on error)
   10. Return structured dict
"""

from __future__ import annotations

import calendar
from datetime import date, datetime
from zoneinfo import ZoneInfo

SGT = ZoneInfo("Asia/Singapore")
CO2_KG_PER_KWH = 0.402  # Singapore grid emission factor


def _get_client():
    try:
        from app.db.client import get_client
        return get_client()
    except Exception:
        return None


def _month_boundaries(year: int, month: int) -> tuple[date, date]:
    first = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    last = date(year, month, last_day)
    return first, last


def _prev_month_boundaries(year: int, month: int) -> tuple[date, date]:
    if month == 1:
        return _month_boundaries(year - 1, 12)
    return _month_boundaries(year, month - 1)


def _query_energy(client, household_id: int, neighborhood_id: str, start: date, end: date) -> dict:
    r = client.query(
        """
        SELECT
            toFloat64(sum(kwh))       AS kwh,
            toFloat64(sum(cost_sgd))  AS cost_sgd,
            toFloat64(sum(carbon_kg)) AS carbon_kg
        FROM sp_energy_intervals
        WHERE neighborhood_id = {nb:String}
          AND household_id = {hid:UInt32}
          AND interval_date >= {start:Date}
          AND interval_date <= {end:Date}
        """,
        parameters={"nb": neighborhood_id, "hid": household_id, "start": str(start), "end": str(end)},
    )
    rows = list(r.named_results())
    if not rows:
        return {"kwh": 0.0, "cost_sgd": 0.0, "carbon_kg": 0.0}
    row = rows[0]
    return {
        "kwh": float(row["kwh"] or 0),
        "cost_sgd": float(row["cost_sgd"] or 0),
        "carbon_kg": float(row["carbon_kg"] or 0),
    }


def _query_habits(client, household_id: int, start: date, end: date) -> int:
    """Return count of achieved habit events for the month."""
    r = client.query(
        """
        SELECT countIf(achieved = 1) AS cnt
        FROM habit_events
        WHERE household_id = {hid:UInt32}
          AND event_date >= {start:Date}
          AND event_date <= {end:Date}
        """,
        parameters={"hid": household_id, "start": str(start), "end": str(end)},
    )
    rows = list(r.named_results())
    return int(rows[0]["cnt"] or 0) if rows else 0


def _query_applied_count(client, household_id: int, start: date, end: date) -> int:
    """Count distinct rec_ids applied during the month (idempotency-safe)."""
    r = client.query(
        """
        SELECT countDistinct(rec_id) AS cnt
        FROM applied_recommendations
        WHERE household_id = {hid:UInt32}
          AND toDate(applied_at) >= {start:Date}
          AND toDate(applied_at) <= {end:Date}
        """,
        parameters={"hid": household_id, "start": str(start), "end": str(end)},
    )
    rows = list(r.named_results())
    return int(rows[0]["cnt"] or 0) if rows else 0


def _query_generated_count(client, household_id: int, start: date, end: date) -> int:
    """Count total recommendations generated for the month (by created_at)."""
    r = client.query(
        """
        SELECT count() AS cnt
        FROM weekly_recommendations
        WHERE household_id = {hid:UInt32}
          AND toDate(created_at) >= {start:Date}
          AND toDate(created_at) <= {end:Date}
        """,
        parameters={"hid": household_id, "start": str(start), "end": str(end)},
    )
    rows = list(r.named_results())
    return int(rows[0]["cnt"] or 0) if rows else 0


def _query_neighbourhood(
    client, neighborhood_id: str, start: date, end: date
) -> dict:
    """
    Query neighborhood_rollup MV (AggregatingMergeTree).
    Returns avg_kwh per home and household count for percentile.
    Uses sumMerge / uniqMerge to correctly read aggregate states.
    """
    if not neighborhood_id:
        return {"avg_kwh": 0.0, "num_homes": 0}

    r = client.query(
        """
        SELECT
            toFloat64(sumMerge(total_kwh))  AS total_kwh_all,
            uniqMerge(active_homes)         AS num_homes
        FROM neighborhood_rollup
        WHERE neighborhood_id = {nb:String}
          AND interval_date >= {start:Date}
          AND interval_date <= {end:Date}
        """,
        parameters={"nb": neighborhood_id, "start": str(start), "end": str(end)},
    )
    rows = list(r.named_results())
    if not rows or not rows[0]["num_homes"]:
        return {"avg_kwh": 0.0, "num_homes": 0}

    total_kwh = float(rows[0]["total_kwh_all"] or 0)
    num_homes = int(rows[0]["num_homes"] or 1)
    return {"avg_kwh": total_kwh / num_homes, "num_homes": num_homes}


def _compute_percentile(
    client, neighborhood_id: str, this_kwh: float, start: date, end: date
) -> int:
    """
    Rank this household's monthly kWh vs other households in the same neighbourhood.
    Returns percentile (0 = best, 100 = worst). Lower kWh = better.
    Falls back to 50 if data is unavailable.
    Filter includes leading neighborhood_id for primary-key index alignment.
    """
    if not neighborhood_id:
        return 50
    try:
        r = client.query(
            """
            SELECT household_id, toFloat64(sum(kwh)) AS hh_kwh
            FROM sp_energy_intervals
            WHERE neighborhood_id = {nb:String}
              AND interval_date >= {start:Date}
              AND interval_date <= {end:Date}
            GROUP BY household_id
            ORDER BY hh_kwh ASC
            """,
            parameters={"nb": neighborhood_id, "start": str(start), "end": str(end)},
        )
        rows = list(r.named_results())
        if not rows:
            return 50

        kwh_values = [float(row["hh_kwh"]) for row in rows]
        rank = sum(1 for v in kwh_values if v <= this_kwh)
        return round(rank / len(kwh_values) * 100)
    except Exception:
        return 50


def _build_narrative(data: dict) -> str:
    """Call OpenAI GPT-4o for a 2-3 sentence narrative. Falls back to a template."""
    try:
        from app.services.ai_service import get_openai_client
        client = get_openai_client()

        energy = data["energy"]
        habits = data["habits"]
        recs = data["recommendations"]
        nb = data["neighbourhood"]

        change_dir = "less" if energy["change_pct"] <= 0 else "more"
        change_abs = abs(energy["change_pct"])

        prompt = (
            f"You are WattCoach, a Singapore HDB energy advisor. "
            f"Write a 2-3 sentence encouraging monthly performance summary for a household. "
            f"Be specific with numbers. Tone: positive and motivational.\n\n"
            f"Data:\n"
            f"- Used {energy['kwh_this_month']:.1f} kWh this month "
            f"({change_abs:.1f}% {change_dir} than last month)\n"
            f"- Spent S${energy['cost_sgd_this_month']:.2f} (vs S${energy['cost_sgd_prev_month']:.2f} last month)\n"
            f"- Carbon footprint: {energy['carbon_kg_this_month']:.1f} kg CO₂\n"
            f"- Habits achieved: {habits['achieved_count']} days\n"
            f"- Recommendations applied: {recs['applied_count']} of {recs['total_generated']}\n"
            f"- Neighbourhood average: {nb['avg_kwh_this_month']:.1f} kWh "
            f"(you are at the {nb['percentile']}th percentile)\n"
            f"- Green grid contribution: {nb['green_grid_co2_kg']:.1f} kg CO₂ offset\n"
        )

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.5,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return _fallback_narrative(data)


def _fallback_narrative(data: dict) -> str:
    energy = data["energy"]
    habits = data["habits"]
    recs = data["recommendations"]
    change_pct = energy["change_pct"]
    direction = "down" if change_pct <= 0 else "up"
    return (
        f"This month your household used {energy['kwh_this_month']:.1f} kWh, "
        f"{abs(change_pct):.1f}% {direction} from last month, "
        f"costing S${energy['cost_sgd_this_month']:.2f}. "
        f"You maintained good habits for {habits['achieved_count']} days and "
        f"applied {recs['applied_count']} of {recs['total_generated']} AI recommendations. "
        f"Keep it up to reduce your carbon footprint!"
    )


def generate_monthly_report(household_id: int, year: int, month: int) -> dict:
    """
    Generate a comprehensive monthly performance report for a household.
    Returns structured dict with energy, habits, recommendations, neighbourhood, and AI narrative.
    Always returns a complete response — missing data sections use zero defaults.
    """
    client = _get_client()

    start, end = _month_boundaries(year, month)
    prev_start, prev_end = _prev_month_boundaries(year, month)
    days_in_month = calendar.monthrange(year, month)[1]

    # Resolve neighborhood_id once (used by energy queries and neighbourhood comparison)
    neighborhood_id = ""
    if client:
        r_nb = client.query(
            "SELECT neighborhood_id FROM sp_energy_intervals WHERE household_id = {hid:UInt32} LIMIT 1",
            parameters={"hid": household_id},
        )
        nb_rows = list(r_nb.named_results())
        neighborhood_id = nb_rows[0]["neighborhood_id"] if nb_rows else ""

    # Energy (this month + prev month) — filter includes leading neighborhood_id for index alignment
    _zero_energy = {"kwh": 0.0, "cost_sgd": 0.0, "carbon_kg": 0.0}
    this_energy = _query_energy(client, household_id, neighborhood_id, start, end) if client and neighborhood_id else _zero_energy
    prev_energy = _query_energy(client, household_id, neighborhood_id, prev_start, prev_end) if client and neighborhood_id else _zero_energy

    kwh_this = round(this_energy["kwh"], 2)
    kwh_prev = round(prev_energy["kwh"], 2)
    change_pct = round((kwh_this - kwh_prev) / kwh_prev * 100, 1) if kwh_prev > 0 else 0.0

    # Habits
    achieved = _query_habits(client, household_id, start, end) if client else 0
    achievement_rate = round(achieved / days_in_month * 100, 1) if days_in_month > 0 else 0.0

    # Recommendations
    applied_count = _query_applied_count(client, household_id, start, end) if client else 0
    generated_count = _query_generated_count(client, household_id, start, end) if client else 0

    # Neighbourhood comparison
    nb = _query_neighbourhood(client, neighborhood_id, start, end) if client else {"avg_kwh": 0.0, "num_homes": 0}
    avg_kwh = round(nb["avg_kwh"], 2)
    green_co2 = round(max(0.0, (avg_kwh - kwh_this) * CO2_KG_PER_KWH), 2)
    percentile = _compute_percentile(client, neighborhood_id, kwh_this, start, end) if client else 50

    result = {
        "household_id": household_id,
        "year": year,
        "month": month,
        "energy": {
            "kwh_this_month": kwh_this,
            "kwh_prev_month": kwh_prev,
            "cost_sgd_this_month": round(this_energy["cost_sgd"], 2),
            "cost_sgd_prev_month": round(prev_energy["cost_sgd"], 2),
            "carbon_kg_this_month": round(this_energy["carbon_kg"], 2),
            "carbon_kg_prev_month": round(prev_energy["carbon_kg"], 2),
            "change_pct": change_pct,
        },
        "habits": {
            "achieved_count": achieved,
            "total_days_in_month": days_in_month,
            "achievement_rate_pct": achievement_rate,
        },
        "recommendations": {
            "applied_count": applied_count,
            "total_generated": generated_count,
        },
        "neighbourhood": {
            "avg_kwh_this_month": avg_kwh,
            "your_kwh_this_month": kwh_this,
            "percentile": percentile,
            "green_grid_co2_kg": green_co2,
        },
        "ai_narrative": "",  # filled below
    }

    result["ai_narrative"] = _build_narrative(result)
    return result
