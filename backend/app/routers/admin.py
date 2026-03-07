"""
Admin / region analytics endpoints.

All queries filter on ORDER BY prefix columns first (schema-pk-filter-on-orderby).
neighborhood_rollup MV queried with sumMerge/uniqMerge (query-mv-incremental).
ANY INNER JOIN used where one feature row per interval row (query-join-use-any).

Endpoints:
  GET /api/admin/region-summary
  GET /api/admin/peak-heatmap
  GET /api/admin/grid-contribution
  GET /api/admin/households
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.data.households import HOUSEHOLDS, HOUSEHOLD_MAP, NEIGHBORHOOD_ID
from app.db.client import get_client

router = APIRouter()


# --- Response models ---

class RegionSummary(BaseModel):
    neighborhood_id: str
    period_days: int
    household_count: int
    total_kwh: float
    total_cost_sgd: float
    total_carbon_kg: float
    peak_kwh: float
    offpeak_kwh: float


class HeatmapSlot(BaseModel):
    interval_date: str
    slot_idx: int
    total_kwh: float
    active_homes: int


class HouseholdContribution(BaseModel):
    household_id: int
    this_week_peak_kwh: float
    baseline_peak_kwh: float
    reduction_pct: float


class GridContribution(BaseModel):
    period: str
    neighborhood_total_reduction_pct: float
    households: list[HouseholdContribution]


class HouseholdSummary(BaseModel):
    household_id: int
    name: str
    flat_type: str
    today_kwh: float
    today_baseline_kwh: float
    anomaly_count: int


# --- Endpoints ---

@router.get("/region-summary", response_model=RegionSummary)
def region_summary() -> RegionSummary:
    client = get_client()
    row = client.query(
        """
        SELECT
            countDistinct(household_id)         AS household_count,
            round(sum(kwh), 3)                  AS total_kwh,
            round(sum(cost_sgd), 4)             AS total_cost_sgd,
            round(sum(carbon_kg), 4)            AS total_carbon_kg,
            round(sumIf(kwh, peak_flag = 1), 3) AS peak_kwh,
            round(sumIf(kwh, peak_flag = 0), 3) AS offpeak_kwh
        FROM sp_energy_intervals
        WHERE neighborhood_id = {neighborhood_id:String}
          AND interval_date >= today() - 7
        """,
        parameters={"neighborhood_id": NEIGHBORHOOD_ID},
    ).first_row

    return RegionSummary(
        neighborhood_id=NEIGHBORHOOD_ID,
        period_days=7,
        household_count=int(row[0]),
        total_kwh=float(row[1]),
        total_cost_sgd=float(row[2]),
        total_carbon_kg=float(row[3]),
        peak_kwh=float(row[4]),
        offpeak_kwh=float(row[5]),
    )


@router.get("/peak-heatmap", response_model=list[HeatmapSlot])
def peak_heatmap() -> list[HeatmapSlot]:
    """
    Query pre-aggregated neighborhood_rollup MV (AggregatingMergeTree).
    Uses sumMerge/uniqMerge to merge partial aggregate states.
    Filters neighborhood_id first — ORDER BY prefix column.
    """
    client = get_client()
    result = client.query(
        """
        SELECT
            toString(interval_date)           AS interval_date,
            slot_idx,
            round(sumMerge(total_kwh), 3)     AS total_kwh,
            toUInt32(uniqMerge(active_homes)) AS active_homes
        FROM neighborhood_rollup
        WHERE neighborhood_id = {neighborhood_id:String}
          AND interval_date >= today() - 7
        GROUP BY interval_date, slot_idx
        ORDER BY interval_date, slot_idx
        """,
        parameters={"neighborhood_id": NEIGHBORHOOD_ID},
    )
    return [
        HeatmapSlot(
            interval_date=str(r[0]),
            slot_idx=int(r[1]),
            total_kwh=float(r[2]),
            active_homes=int(r[3]),
        )
        for r in result.result_rows
    ]


@router.get("/grid-contribution", response_model=GridContribution)
def grid_contribution() -> GridContribution:
    """
    Compare this week vs 4-week baseline peak kWh per household.
    Filters neighborhood_id (ORDER BY prefix) before grouping.
    """
    client = get_client()
    result = client.query(
        """
        WITH
            this_week AS (
                SELECT
                    household_id,
                    round(sum(kwh), 3) AS peak_kwh
                FROM sp_energy_intervals
                WHERE neighborhood_id = {neighborhood_id:String}
                  AND peak_flag = 1
                  AND interval_date >= today() - 7
                GROUP BY household_id
            ),
            baseline AS (
                SELECT
                    household_id,
                    round(avg(day_peak), 3) AS baseline_peak_kwh
                FROM (
                    SELECT
                        household_id,
                        interval_date,
                        sum(kwh) AS day_peak
                    FROM sp_energy_intervals
                    WHERE neighborhood_id = {neighborhood_id:String}
                      AND peak_flag = 1
                      AND interval_date >= today() - 35
                      AND interval_date < today() - 7
                    GROUP BY household_id, interval_date
                )
                GROUP BY household_id
            )
        SELECT
            tw.household_id,
            tw.peak_kwh                 AS this_week_peak_kwh,
            b.baseline_peak_kwh,
            round(
                (b.baseline_peak_kwh - tw.peak_kwh) / (b.baseline_peak_kwh + 0.001) * 100,
                2
            )                           AS reduction_pct
        FROM this_week tw
        ANY INNER JOIN baseline b USING (household_id)
        ORDER BY tw.household_id
        """,
        parameters={"neighborhood_id": NEIGHBORHOOD_ID},
    )

    households_data = [
        HouseholdContribution(
            household_id=int(r[0]),
            this_week_peak_kwh=float(r[1]),
            baseline_peak_kwh=float(r[2]),
            reduction_pct=float(r[3]),
        )
        for r in result.result_rows
    ]

    avg_reduction = (
        round(sum(h.reduction_pct for h in households_data) / len(households_data), 2)
        if households_data else 0.0
    )

    return GridContribution(
        period="last_7_days_vs_4week_baseline",
        neighborhood_total_reduction_pct=avg_reduction,
        households=households_data,
    )


@router.get("/households", response_model=list[HouseholdSummary])
def households_summary() -> list[HouseholdSummary]:
    """
    Today's kWh, baseline, and anomaly count per household.
    Uses ANY INNER JOIN between sp_energy_intervals and energy_features.
    """
    client = get_client()
    result = client.query(
        """
        SELECT
            r.household_id,
            round(sum(r.kwh), 3)                                AS today_kwh,
            round(sum(f.baseline_kwh), 3)                       AS today_baseline_kwh,
            countIf(f.anomaly_score > 2.0)                      AS anomaly_count
        FROM sp_energy_intervals r
        ANY INNER JOIN energy_features f
            USING (household_id, ts, interval_date, slot_idx)
        WHERE r.neighborhood_id = {neighborhood_id:String}
          AND r.interval_date = today()
        GROUP BY r.household_id
        ORDER BY r.household_id
        """,
        parameters={"neighborhood_id": NEIGHBORHOOD_ID},
    )

    summaries = []
    for row in result.result_rows:
        hid = int(row[0])
        meta = HOUSEHOLD_MAP.get(hid, {})
        summaries.append(
            HouseholdSummary(
                household_id=hid,
                name=meta.get("name", "Unknown"),
                flat_type=meta.get("flat_type", "Unknown"),
                today_kwh=float(row[1]),
                today_baseline_kwh=float(row[2]),
                anomaly_count=int(row[3]),
            )
        )
    return summaries
