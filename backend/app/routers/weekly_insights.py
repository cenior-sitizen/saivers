"""
Weekly insights endpoints.

GET  /api/insights/weekly/{household_id}          — all weekly insights (newest first)
GET  /api/insights/weekly/{household_id}/unread   — unread count for bell badge
POST /api/insights/weekly/{insight_id}/read       — mark as read
POST /api/insights/weekly/{insight_id}/approve    — approve + apply AC recommendation
POST /api/insights/weekly/{insight_id}/dismiss    — dismiss insight
POST /api/admin/run-weekly-insights               — manual trigger for demo
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.weekly_insight_service import (
    approve_insight,
    get_unread_count,
    get_weekly_insights,
    update_insight_status,
)

router = APIRouter()


class ActionRequest(BaseModel):
    household_id: int


# ── Read endpoints ─────────────────────────────────────────────────────────────

@router.get("/weekly/{household_id}")
def list_weekly_insights(household_id: int):
    """All weekly insights for a household, newest first."""
    return get_weekly_insights(household_id)


@router.get("/weekly/{household_id}/unread")
def unread_count(household_id: int):
    """Unread insight count for bell badge."""
    return {"household_id": household_id, "unread": get_unread_count(household_id)}


# ── Action endpoints ───────────────────────────────────────────────────────────

@router.post("/weekly/{insight_id}/read")
def mark_read(insight_id: str):
    ok = update_insight_status(insight_id, "read")
    if not ok:
        raise HTTPException(status_code=404, detail="Insight not found")
    return {"insight_id": insight_id, "status": "read"}


@router.post("/weekly/{insight_id}/approve")
def approve(insight_id: str, body: ActionRequest):
    result = approve_insight(insight_id, body.household_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result.get("message", "Failed"))
    return result


@router.post("/weekly/{insight_id}/dismiss")
def dismiss(insight_id: str):
    ok = update_insight_status(insight_id, "dismissed")
    if not ok:
        raise HTTPException(status_code=404, detail="Insight not found")
    return {"insight_id": insight_id, "status": "dismissed"}


# ── Admin trigger ──────────────────────────────────────────────────────────────

@router.post("/admin/run-weekly-insights")
def run_weekly_insights():
    """
    Manual trigger for demo: regenerate weekly insights for all 3 demo households.
    In production this would be a scheduled job at 2am SGT every Monday.
    """
    try:
        from scripts.generate_weekly_insights import seed
        seed()
        return {"status": "ok", "message": "Weekly insights regenerated for households 1001, 1002, 1003"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
