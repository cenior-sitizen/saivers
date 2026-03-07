"""
Recommendations endpoints — weekly AI per-device recommendations with user-approve-then-apply flow.

GET  /api/recommendations/weekly/{household_id}   — get this week's recommendations
POST /api/recommendations/apply/{household_id}    — apply selected recs via MCP
GET  /api/recommendations/history/{household_id}  — last 4 weeks history
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.recommendation_service import (
    apply_recommendation,
    get_or_generate_weekly_recs,
    get_recommendation_history,
)

router = APIRouter()


class ApplyRequest(BaseModel):
    rec_ids: list[str]


@router.get("/weekly/{household_id}")
def get_weekly_recommendations(household_id: int) -> list[dict]:
    """
    Return this ISO week's per-device recommendations for a household.

    Idempotent — calling multiple times returns the same recommendations.
    Generated on first call (OpenAI or rule-based fallback).

    Response shape per item:
      rec_id, device_id, device_name, current_temp, rec_temp,
      current_mode, rec_mode, reason, already_applied
    """
    _validate_household(household_id)
    return get_or_generate_weekly_recs(household_id)


@router.post("/apply/{household_id}")
def apply_recommendations(household_id: int, req: ApplyRequest) -> list[dict]:
    """
    Apply selected recommendations via MCP layer to AC devices.

    Accepts a list of rec_ids. Each is applied independently:
    - Idempotent: already-applied recs return {already_applied: true}
    - Partial success: one failure does not block others
    - Fan-out: one room rec commands both simulator units for that room

    Response: per-rec result array.
    """
    _validate_household(household_id)

    if not req.rec_ids:
        raise HTTPException(status_code=422, detail="rec_ids cannot be empty")

    results = []
    for rec_id in req.rec_ids:
        result = apply_recommendation(household_id, rec_id.strip())
        results.append(result)

    return results


@router.get("/history/{household_id}")
def get_history(household_id: int) -> list[dict]:
    """
    Return last 4 ISO weeks of recommendations with applied counts.

    Response shape per week:
      iso_week, recommendations[], applied_count, total_count
    """
    _validate_household(household_id)
    return get_recommendation_history(household_id, weeks=4)


def _validate_household(household_id: int) -> None:
    from app.data.households import HOUSEHOLD_MAP
    if household_id not in HOUSEHOLD_MAP:
        raise HTTPException(status_code=404, detail=f"Household {household_id} not found")
