"""
Monthly performance report endpoint.

GET /api/reports/monthly/{household_id}?year=2026&month=3
  - Returns comprehensive monthly report: energy, habits, recommendations,
    neighbourhood comparison, green grid contribution, AI narrative.
  - Defaults to current SGT year/month if params omitted.
  - Always returns 200 with zero defaults for missing data.
"""

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Query

from app.services.monthly_report_service import generate_monthly_report

router = APIRouter()
SGT = ZoneInfo("Asia/Singapore")


def _validate_household(household_id: int) -> None:
    from app.data.households import HOUSEHOLD_MAP
    if household_id not in HOUSEHOLD_MAP:
        raise HTTPException(status_code=404, detail=f"Household {household_id} not found")


@router.get("/monthly/{household_id}")
def get_monthly_report(
    household_id: int,
    year: int = Query(default=None, ge=2020, le=2030, description="Report year (defaults to current SGT year)"),
    month: int = Query(default=None, ge=1, le=12, description="Report month 1-12 (defaults to current SGT month)"),
) -> dict:
    """
    Return a comprehensive monthly energy performance report.

    Includes:
    - Energy usage (kWh, cost, carbon) vs previous month
    - Habit achievements for the month
    - Recommendations applied vs generated
    - Neighbourhood comparison and green grid CO2 contribution
    - AI-generated narrative summary (GPT-4o, with template fallback)

    Query params year/month default to current SGT month if not provided.
    """
    _validate_household(household_id)

    now_sgt = datetime.now(SGT)
    resolved_year = year if year is not None else now_sgt.year
    resolved_month = month if month is not None else now_sgt.month

    return generate_monthly_report(household_id, resolved_year, resolved_month)
