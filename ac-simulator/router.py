"""
REST + SSE endpoints for the AC Simulator.

REST: CRUD-style control for each AC unit.
SSE:  GET /ac/{household_id}/stream — pushes state snapshots every 5s.
"""

import asyncio
import json
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models import ACState, ModeRequest, TempRequest, TimerRequest, TurnOnRequest
from store import (
    HOUSEHOLD_IDS,
    ROOMS,
    VALID_DEVICE_IDS,
    QUEUE_MAX,
    add_subscriber,
    cancel_timer,
    get_ac,
    list_acs,
    list_acs_by_room,
    remove_subscriber,
    set_mode,
    set_off,
    set_on,
    set_temp,
    set_timer,
)

router = APIRouter()

VALID_HOUSEHOLD_IDS = set(HOUSEHOLD_IDS)
VALID_ROOM_IDS = {r for r, _, _ in ROOMS}


def _require_ac(household_id: int, device_id: str) -> ACState:
    if household_id not in VALID_HOUSEHOLD_IDS:
        raise HTTPException(status_code=404, detail=f"Household {household_id} not found")
    if device_id not in VALID_DEVICE_IDS:
        raise HTTPException(status_code=404, detail=f"Device '{device_id}' not found. Valid IDs: {sorted(VALID_DEVICE_IDS)}")
    state = get_ac(household_id, device_id)
    if state is None:
        raise HTTPException(status_code=404, detail="AC unit not initialised")
    return state


# ── REST endpoints ────────────────────────────────────────────────────────────

@router.get("/ac/{household_id}", response_model=list[ACState])
def get_household_acs(household_id: int) -> list[ACState]:
    """List all 8 AC units for a household (2 per room, 4 rooms)."""
    if household_id not in VALID_HOUSEHOLD_IDS:
        raise HTTPException(status_code=404, detail=f"Household {household_id} not found")
    return list_acs(household_id)


@router.get("/ac/{household_id}/room/{room_id}", response_model=list[ACState])
def get_room_acs(household_id: int, room_id: str) -> list[ACState]:
    """List both AC units in a specific room (e.g. 'living-room')."""
    if household_id not in VALID_HOUSEHOLD_IDS:
        raise HTTPException(status_code=404, detail=f"Household {household_id} not found")
    if room_id not in VALID_ROOM_IDS:
        raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found. Valid: {sorted(VALID_ROOM_IDS)}")
    return list_acs_by_room(household_id, room_id)


# NOTE: SSE route is registered before /{room_id} to prevent "stream" being
# parsed as a room_id slug by FastAPI's path parameter matching.
@router.get("/ac/{household_id}/stream")
async def stream_ac(household_id: int) -> StreamingResponse:
    """
    SSE stream of AC state updates for all 4 rooms in a household.

    Events:
      data: {"1001": [{room_id, is_on, power_w, ...}, ...]}

    Heartbeat comment sent every ~15s to prevent proxy timeout.
    Client disconnects cleanly without error.
    """
    if household_id not in VALID_HOUSEHOLD_IDS:
        raise HTTPException(status_code=404, detail=f"Household {household_id} not found")

    queue: asyncio.Queue = asyncio.Queue(maxsize=QUEUE_MAX)
    add_subscriber(queue)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Send immediate snapshot so client doesn't wait 5s for first event
            rooms = list_acs(household_id)
            initial = json.dumps({str(household_id): [r.model_dump() for r in rooms]})
            yield f"data: {initial}\n\n"

            while True:
                try:
                    # Wait up to 15s for a tick event, then send heartbeat
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    full = json.loads(payload)
                    hid_str = str(household_id)
                    if hid_str in full:
                        yield f"data: {json.dumps({hid_str: full[hid_str]})}\n\n"
                except asyncio.TimeoutError:
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            remove_subscriber(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/ac/{household_id}/{device_id}", response_model=ACState)
def get_single_ac(household_id: int, device_id: str) -> ACState:
    """Get current state of one AC unit by its unique device_id."""
    return _require_ac(household_id, device_id)


@router.post("/ac/{household_id}/{device_id}/on", response_model=ACState)
def turn_on(household_id: int, device_id: str, req: TurnOnRequest = TurnOnRequest()) -> ACState:
    """Turn on an AC unit with optional temp and mode."""
    _require_ac(household_id, device_id)
    return set_on(household_id, device_id, req.temp_c, req.mode)


@router.post("/ac/{household_id}/{device_id}/off", response_model=ACState)
def turn_off(household_id: int, device_id: str) -> ACState:
    """Turn off an AC unit immediately (also cancels any active timer)."""
    _require_ac(household_id, device_id)
    return set_off(household_id, device_id)


@router.post("/ac/{household_id}/{device_id}/temp", response_model=ACState)
def update_temp(household_id: int, device_id: str, req: TempRequest) -> ACState:
    """Change the temperature set-point."""
    _require_ac(household_id, device_id)
    return set_temp(household_id, device_id, req.temp_c)


@router.post("/ac/{household_id}/{device_id}/mode", response_model=ACState)
def update_mode(household_id: int, device_id: str, req: ModeRequest) -> ACState:
    """Change the operating mode (cool / fan / dry)."""
    _require_ac(household_id, device_id)
    return set_mode(household_id, device_id, req.mode)


@router.post("/ac/{household_id}/{device_id}/timer", response_model=ACState)
def set_ac_timer(household_id: int, device_id: str, req: TimerRequest) -> ACState:
    """
    Schedule AC to turn on at start_time and off at end_time (SGT HH:MM).
    Supports overnight schedules (e.g. 22:00 → 02:00).
    """
    _require_ac(household_id, device_id)
    return set_timer(household_id, device_id, req.start_time, req.end_time, req.temp_c)


@router.delete("/ac/{household_id}/{device_id}/timer", response_model=ACState)
def cancel_ac_timer(household_id: int, device_id: str) -> ACState:
    """Cancel a pending timer without turning the AC off."""
    _require_ac(household_id, device_id)
    return cancel_timer(household_id, device_id)


