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

import os

from fastapi import APIRouter, HTTPException
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
    try:
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
            household_count=int(row[0] or 0),
            total_kwh=float(row[1] or 0),
            total_cost_sgd=float(row[2] or 0),
            total_carbon_kg=float(row[3] or 0),
            peak_kwh=float(row[4] or 0),
            offpeak_kwh=float(row[5] or 0),
        )
    except Exception:
        return RegionSummary(
            neighborhood_id=NEIGHBORHOOD_ID,
            period_days=7,
            household_count=0,
            total_kwh=0,
            total_cost_sgd=0,
            total_carbon_kg=0,
            peak_kwh=0,
            offpeak_kwh=0,
        )


@router.get("/peak-heatmap", response_model=list[HeatmapSlot])
def peak_heatmap() -> list[HeatmapSlot]:
    """
    Query pre-aggregated neighborhood_rollup MV (AggregatingMergeTree).
    Uses sumMerge/uniqMerge to merge partial aggregate states.
    Filters neighborhood_id first — ORDER BY prefix column.
    """
    try:
        client = get_client()
        result = client.query(
            """
            SELECT
                toString(interval_date)           AS date_str,
                slot_idx,
                round(sumMerge(total_kwh), 3)     AS total_kwh,
                toUInt32(uniqMerge(active_homes)) AS active_homes
            FROM neighborhood_rollup
            WHERE neighborhood_id = {neighborhood_id:String}
              AND interval_date >= today() - 7
            GROUP BY date_str, slot_idx
            ORDER BY date_str, slot_idx
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
    except Exception:
        return []


@router.get("/grid-contribution", response_model=GridContribution)
def grid_contribution() -> GridContribution:
    """
    Compare this week vs 4-week baseline peak kWh per household.
    Filters neighborhood_id (ORDER BY prefix) before grouping.
    """
    try:
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
    except Exception:
        return GridContribution(
            period="last_7_days_vs_4week_baseline",
            neighborhood_total_reduction_pct=0,
            households=[],
        )


@router.get("/households", response_model=list[HouseholdSummary])
def households_summary() -> list[HouseholdSummary]:
    """
    Today's kWh, baseline, and anomaly count per household.
    Uses LEFT JOIN so households without energy_features still appear.
    """
    try:
        client = get_client()
        result = client.query(
            """
            SELECT
                r.household_id,
                round(sum(r.kwh), 3)                                AS today_kwh,
                round(sum(f.baseline_kwh), 3)                       AS today_baseline_kwh,
                countIf(f.anomaly_score > 2.0)                      AS anomaly_count
            FROM sp_energy_intervals r
            LEFT JOIN energy_features f
                ON r.household_id = f.household_id
               AND r.ts = f.ts
               AND r.interval_date = f.interval_date
               AND r.slot_idx = f.slot_idx
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
                    today_kwh=float(row[1] or 0),
                    today_baseline_kwh=float(row[2] or 0),
                    anomaly_count=int(row[3] or 0),
                )
            )
        if not summaries:
            return [
                HouseholdSummary(
                    household_id=h["household_id"],
                    name=h.get("name", "Unknown"),
                    flat_type=h.get("flat_type", "Unknown"),
                    today_kwh=0,
                    today_baseline_kwh=0,
                    anomaly_count=0,
                )
                for h in HOUSEHOLDS
            ]
        return summaries
    except Exception:
        return [
            HouseholdSummary(
                household_id=h["household_id"],
                name=h.get("name", "Unknown"),
                flat_type=h.get("flat_type", "Unknown"),
                today_kwh=0,
                today_baseline_kwh=0,
                anomaly_count=0,
            )
            for h in HOUSEHOLDS
        ]


# --- Incidents & Recommendations ---

class IncidentEvent(BaseModel):
    id: str
    event_type: str
    household_id: int | None
    neighborhood_id: str
    ts: str
    severity: str
    title: str
    description: str
    anomaly_score: float | None
    excess_kwh: float | None = None


class AdminRecommendation(BaseModel):
    id: str
    priority: str
    action: str
    region: str
    reason: str
    household_id: int | None


@router.get("/incidents", response_model=list[IncidentEvent])
def get_incidents(days: int = 7) -> list[IncidentEvent]:
    """Chronological timeline of anomaly events from energy_features."""
    try:
        client = get_client()
        result = client.query(
            """
            SELECT
                household_id,
                toString(ts) AS ts,
                toFloat64(anomaly_score) AS anomaly_score,
                toFloat64(excess_kwh) AS excess_kwh
            FROM energy_features FINAL
            WHERE interval_date >= today() - {days:UInt8}
              AND anomaly_score > 2.0
            ORDER BY ts DESC
            LIMIT 50
            """,
            parameters={"days": days},
        )
        events = []
        for i, row in enumerate(result.result_rows):
            hid = int(row[0])
            ts = str(row[1])
            score = float(row[2])
            excess = float(row[3] or 0)
            severity = "high" if score > 3.5 else ("medium" if score > 2.5 else "low")
            events.append(
                IncidentEvent(
                    id=f"inc-{i}-{hid}-{ts[:10]}",
                    event_type="anomaly",
                    household_id=hid,
                    neighborhood_id=NEIGHBORHOOD_ID,
                    ts=ts,
                    severity=severity,
                    title=f"Anomaly detected — Household {hid}",
                    description=f"Excess {excess:.2f} kWh (score {score:.1f})",
                    anomaly_score=score,
                    excess_kwh=excess,
                )
            )
        return events
    except Exception:
        return []


@router.get("/recommendations", response_model=list[AdminRecommendation])
def get_recommendations() -> list[AdminRecommendation]:
    """AI-generated operational recommendations based on anomalies."""
    try:
        from app.services.ai_service import generate_admin_recommendations

        summaries = households_summary()
        anomaly_households = [
            {
                "household_id": s.household_id,
                "name": s.name,
                "anomaly_count": s.anomaly_count,
            }
            for s in summaries if s.anomaly_count > 0
        ]
        anomalies_summary = _get_anomalies_summary(7)

        if os.getenv("OPENAI_API_KEY") and (anomaly_households or anomalies_summary.get("total_anomalies", 0) > 0):
            ai_recs = generate_admin_recommendations(
                anomaly_households, anomalies_summary, NEIGHBORHOOD_ID
            )
            if ai_recs:
                return [
                    AdminRecommendation(
                        id=f"rec-{i+1}",
                        priority=r["priority"],
                        action=r["action"],
                        region=r["region"],
                        reason=r["reason"],
                        household_id=r.get("household_id"),
                    )
                    for i, r in enumerate(ai_recs)
                ]
        # Fallback: rule-based
        recs: list[AdminRecommendation] = []
        if anomaly_households:
            top = anomaly_households[0]
            recs.append(
                AdminRecommendation(
                    id="rec-1",
                    priority="high",
                    action="Investigate region",
                    region=NEIGHBORHOOD_ID,
                    reason=f"Household {top['household_id']} ({top['name']}) has {top['anomaly_count']} anomaly events today",
                    household_id=top["household_id"],
                )
            )
        recs.append(
            AdminRecommendation(
                id="rec-2",
                priority="medium",
                action="Verify telemetry",
                region=NEIGHBORHOOD_ID,
                reason="Ensure SP meter and AC readings are syncing correctly",
                household_id=None,
            )
        )
        recs.append(
            AdminRecommendation(
                id="rec-3",
                priority="low",
                action="Review demand changes",
                region=NEIGHBORHOOD_ID,
                reason="Compare this week vs 4-week baseline for peak reduction",
                household_id=None,
            )
        )
        return recs
    except Exception:
        return [
            AdminRecommendation(
                id="rec-fallback",
                priority="medium",
                action="Connect to ClickHouse",
                region=NEIGHBORHOOD_ID,
                reason="Ensure data pipeline is running and energy_features are populated",
                household_id=None,
            ),
        ]


def _get_anomalies_summary(days: int = 7) -> dict:
    """Internal helper: aggregate anomaly stats."""
    try:
        client = get_client()
        result = client.query(
            """
            SELECT
                count() AS total_anomalies,
                uniq(household_id) AS affected_households,
                max(anomaly_score) AS max_score
            FROM energy_features FINAL
            WHERE interval_date >= today() - {days:UInt8}
              AND anomaly_score > 2.0
            """,
            parameters={"days": days},
        )
        row = result.first_row
        return {
            "total_anomalies": int(row[0] or 0),
            "affected_households": int(row[1] or 0),
            "max_score": float(row[2] or 0),
        }
    except Exception:
        return {"total_anomalies": 0, "affected_households": 0, "max_score": 0}


@router.get("/anomalies-summary")
def anomalies_summary(days: int = 7) -> dict:
    """Aggregate anomaly stats for observability dashboard."""
    return _get_anomalies_summary(days)


# --- AI Summary Endpoints ---


@router.get("/dashboard-summary")
def dashboard_summary() -> dict:
    """
    AI-generated 2-3 sentence summary of the admin dashboard.
    Requires OPENAI_API_KEY. Returns empty string if AI unavailable.
    """
    try:
        from app.services.ai_service import generate_dashboard_summary

        if not os.getenv("OPENAI_API_KEY"):
            return {"summary": "", "ai_available": False}
        region = region_summary()
        grid = grid_contribution()
        anomalies = _get_anomalies_summary(7)
        summary = generate_dashboard_summary(
            region.model_dump(),
            grid.model_dump(),
            anomalies,
        )
        return {"summary": summary or "", "ai_available": True}
    except Exception:
        return {"summary": "", "ai_available": False}


@router.get("/observability-summary")
def observability_summary() -> dict:
    """
    AI-generated aggregate health summary for observability dashboard.
    Requires OPENAI_API_KEY. Returns empty string if AI unavailable.
    """
    try:
        from app.services.ai_service import generate_observability_summary

        if not os.getenv("OPENAI_API_KEY"):
            return {"summary": "", "ai_available": False}
        anomalies = _get_anomalies_summary(7)
        households = households_summary()
        summary = generate_observability_summary(
            anomalies,
            [h.model_dump() for h in households],
        )
        return {"summary": summary or "", "ai_available": True}
    except Exception:
        return {"summary": "", "ai_available": False}


@router.get("/incidents-summary")
def incidents_summary(days: int = 7) -> dict:
    """
    AI-generated batch briefing of all incidents for the last N days.
    Requires OPENAI_API_KEY. Returns empty string if AI unavailable.
    """
    try:
        from app.services.ai_service import generate_incidents_summary

        if not os.getenv("OPENAI_API_KEY"):
            return {"summary": "", "ai_available": False}
        events = get_incidents(days)
        summary = generate_incidents_summary([e.model_dump() for e in events])
        return {"summary": summary or "", "ai_available": True}
    except Exception:
        return {"summary": "", "ai_available": False}


class ExplainAnomalyRequest(BaseModel):
    household_id: int
    ts: str
    anomaly_score: float
    excess_kwh: float


@router.post("/explain-anomaly")
def explain_anomaly_endpoint(req: ExplainAnomalyRequest) -> dict:
    """
    AI-generated explanation of why an energy anomaly occurred.
    Uses OpenAI to produce a 2-4 sentence ops-focused explanation.
    """
    try:
        from app.services.ai_service import explain_anomaly

        extra_context = None
        try:
            client = get_client()
            row = client.query(
                """
                SELECT baseline_kwh, slot_idx, interval_date
                FROM energy_features FINAL
                WHERE household_id = {hid:UInt32}
                  AND ts = toDateTime({ts_str:String})
                LIMIT 1
                """,
                parameters={"hid": req.household_id, "ts_str": req.ts},
            ).first_row
            if row:
                extra_context = (
                    f"baseline {float(row[0] or 0):.2f} kWh, "
                    f"slot {row[1]}, date {row[2]}"
                )
        except Exception:
            pass

        explanation = explain_anomaly(
            household_id=req.household_id,
            ts=req.ts,
            anomaly_score=req.anomaly_score,
            excess_kwh=req.excess_kwh,
            extra_context=extra_context,
        )
        return {"explanation": explanation}
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY not set. Add it to backend/.env to enable AI explanations.",
        ) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
