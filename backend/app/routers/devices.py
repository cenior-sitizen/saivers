"""AC device control endpoints — Mock MCP layer."""

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException

from app.models.device import (
    ACScheduleRequest,
    ApplyRecommendationRequest,
    DeviceActionResponse,
    DeviceState,
)
from app.services.device_store import (
    compute_savings,
    get_state,
    set_off,
    set_schedule,
)

router = APIRouter()
SGT = ZoneInfo("Asia/Singapore")

# Preset actions per insight type (for apply-recommendation)
INSIGHT_PRESETS: dict[str, dict] = {
    "ac_night_anomaly": {"start_time": "22:00", "end_time": "02:00", "temp_c": 25},
    "weekly_increase":  {"start_time": "19:00", "end_time": "23:00", "temp_c": 26},
}


@router.get("/ac/status/{household_id}", response_model=DeviceState)
def get_ac_status(household_id: int):
    state = get_state(household_id)
    if state is None:
        raise HTTPException(status_code=404, detail=f"Household {household_id} not found")
    return state


@router.post("/ac/schedule", response_model=DeviceActionResponse)
def schedule_ac(req: ACScheduleRequest):
    if get_state(req.household_id) is None:
        raise HTTPException(status_code=404, detail=f"Household {req.household_id} not found")

    kwh_saved, sgd_saved = compute_savings(req.start_time, req.end_time)
    set_schedule(req.household_id, req.start_time, req.end_time, req.temp_c)

    action_id = f"ACT-{req.household_id}-{int(datetime.now(SGT).timestamp())}"
    return DeviceActionResponse(
        action_id=action_id,
        status="scheduled",
        message=f"AC scheduled: {req.start_time}–{req.end_time} at {req.temp_c}°C",
        projected_kwh_saved=kwh_saved,
        projected_sgd_saved=sgd_saved,
    )


@router.post("/ac/apply-recommendation", response_model=DeviceActionResponse)
def apply_recommendation(req: ApplyRecommendationRequest):
    if get_state(req.household_id) is None:
        raise HTTPException(status_code=404, detail=f"Household {req.household_id} not found")

    # Extract insight type from id (e.g. 'insight_1001_001' → look up preset)
    preset = None
    for insight_type, params in INSIGHT_PRESETS.items():
        if insight_type in req.insight_id or req.insight_id.endswith("_001"):
            preset = params
            break

    if preset is None:
        preset = INSIGHT_PRESETS["ac_night_anomaly"]  # fallback default

    kwh_saved, sgd_saved = compute_savings(preset["start_time"], preset["end_time"])
    set_schedule(req.household_id, preset["start_time"], preset["end_time"], preset["temp_c"])

    action_id = f"ACT-{req.household_id}-{int(datetime.now(SGT).timestamp())}"
    return DeviceActionResponse(
        action_id=action_id,
        status="scheduled",
        message=f"Applied recommendation: AC {preset['start_time']}–{preset['end_time']} at {preset['temp_c']}°C",
        projected_kwh_saved=kwh_saved,
        projected_sgd_saved=sgd_saved,
    )


@router.post("/ac/off/{household_id}")
def turn_off_ac(household_id: int):
    if get_state(household_id) is None:
        raise HTTPException(status_code=404, detail=f"Household {household_id} not found")
    set_off(household_id)
    return {"status": "off", "household_id": household_id}
