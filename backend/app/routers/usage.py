"""
Weekly electricity bill endpoint.

GET /api/usage/weekly-bill/{household_id}

Queries sp_energy_intervals (cost_sgd already populated at S$0.2911/kWh).
Filters neighborhood_id first to align with ORDER BY prefix.
Week boundaries computed in SGT (Asia/Singapore), not UTC.
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter
from pydantic import BaseModel

from app.data.households import NEIGHBORHOOD_ID
from app.db.client import get_client

router = APIRouter()

SGT = ZoneInfo("Asia/Singapore")
DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


# ── Response models ───────────────────────────────────────────────────────────

class SummaryMetric(BaseModel):
    label: str
    value: str


class WeeklyComparison(BaseModel):
    this_week_kwh: float
    last_week_kwh: float
    percent_change: float
    this_week_cost: str
    last_week_cost: str


class ChartPoint(BaseModel):
    label: str
    value: float


class DailyBreakdown(BaseModel):
    date: str
    day: str
    kwh: float
    cost_sgd: float


class WeeklyBillResponse(BaseModel):
    summary_metrics: list[SummaryMetric]
    weekly_comparison: WeeklyComparison
    chart_data: list[ChartPoint]
    daily_breakdown: list[DailyBreakdown]


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/weekly-bill/{household_id}", response_model=WeeklyBillResponse)
def weekly_bill(household_id: int) -> WeeklyBillResponse:
    """
    Return weekly electricity bill breakdown for a household.
    Always returns 200 — unknown household_id returns all zeros.
    """
    client = get_client()

    # SGT today — use for week boundaries, not ClickHouse today() which is UTC
    sgt_today = datetime.now(SGT).date()
    this_week_start = sgt_today - timedelta(days=6)   # [today-6 .. today] = 7 days
    last_week_start = sgt_today - timedelta(days=13)  # [today-13 .. today-7] = 7 days

    # Query last 14 days — neighborhood_id first to match ORDER BY prefix
    result = client.query(
        """
        SELECT
            interval_date,
            round(sum(kwh), 3)      AS day_kwh,
            round(sum(cost_sgd), 4) AS day_cost
        FROM sp_energy_intervals
        WHERE neighborhood_id = {n:String}
          AND household_id    = {hid:UInt32}
          AND interval_date  >= today() - 15
        GROUP BY interval_date
        ORDER BY interval_date
        """,
        parameters={"n": NEIGHBORHOOD_ID, "hid": household_id},
    )

    rows = list(result.named_results())

    # Split rows by SGT week boundary
    this_week_map: dict = {}  # date → {kwh, cost}
    last_week_map: dict = {}

    for r in rows:
        d = r["interval_date"]  # Python date object from ClickHouse
        kwh = float(r["day_kwh"] or 0)
        cost = float(r["day_cost"] or 0)
        if d >= this_week_start:
            this_week_map[d] = {"kwh": kwh, "cost": cost}
        elif d >= last_week_start:
            last_week_map[d] = {"kwh": kwh, "cost": cost}

    # Backfill this_week_map: ensure all 7 SGT days present (today-6 through today)
    for i in range(7):
        day = sgt_today - timedelta(days=6 - i)
        if day not in this_week_map:
            this_week_map[day] = {"kwh": 0.0, "cost": 0.0}

    # Aggregates
    this_week_kwh = round(sum(v["kwh"] for v in this_week_map.values()), 3)
    last_week_kwh = round(sum(v["kwh"] for v in last_week_map.values()), 3)
    this_week_cost = round(sum(v["cost"] for v in this_week_map.values()), 2)
    last_week_cost = round(sum(v["cost"] for v in last_week_map.values()), 2)

    # Percent change — guard division by zero
    if last_week_kwh > 0:
        percent_change = round((this_week_kwh - last_week_kwh) / last_week_kwh * 100, 1)
    else:
        percent_change = 0.0

    saved_vs_last = round(last_week_cost - this_week_cost, 2)
    projected_monthly = round(this_week_cost * 4.33, 2)

    # chart_data — 7 entries, chronological, label = day-of-week abbreviation
    sorted_days = sorted(this_week_map.keys())
    chart_data = [
        ChartPoint(label=DAY_LABELS[d.weekday()], value=round(this_week_map[d]["kwh"], 3))
        for d in sorted_days
    ]

    # daily_breakdown — same 7 days with cost
    daily_breakdown = [
        DailyBreakdown(
            date=str(d),
            day=DAY_LABELS[d.weekday()],
            kwh=round(this_week_map[d]["kwh"], 3),
            cost_sgd=round(this_week_map[d]["cost"], 2),
        )
        for d in sorted_days
    ]

    # 4 summary metric cards
    summary_metrics = [
        SummaryMetric(label="Total Usage This Week",    value=f"{this_week_kwh} kWh"),
        SummaryMetric(label="Estimated Cost This Week", value=f"S${this_week_cost:.2f}"),
        SummaryMetric(
            label="Saved vs Last Week",
            value=f"S${saved_vs_last:.2f} saved" if saved_vs_last > 0 else f"S${abs(saved_vs_last):.2f} more",
        ),
        SummaryMetric(label="Projected Monthly Cost",   value=f"S${projected_monthly:.2f}"),
    ]

    return WeeklyBillResponse(
        summary_metrics=summary_metrics,
        weekly_comparison=WeeklyComparison(
            this_week_kwh=this_week_kwh,
            last_week_kwh=last_week_kwh,
            percent_change=percent_change,
            this_week_cost=f"S${this_week_cost:.2f}",
            last_week_cost=f"S${last_week_cost:.2f}",
        ),
        chart_data=chart_data,
        daily_breakdown=daily_breakdown,
    )
