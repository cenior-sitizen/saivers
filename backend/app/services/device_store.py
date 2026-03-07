"""
Mock MCP device store — in-memory AC state for all 10 households.

Mimics what a real Xiaomi/Google Home integration would do.
All state changes are logged to ClickHouse device_actions table (buffered, not fire-and-forget).
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime
from zoneinfo import ZoneInfo

from app.data.households import HOUSEHOLDS
from app.models.device import DeviceState

SGT = ZoneInfo("Asia/Singapore")

# In-memory state — one DeviceState per household
_states: dict[int, DeviceState] = {}

# Log buffer: flushed every 60s by run_schedule_checker
_log_buffer: list[list] = []


def init_device_store() -> None:
    """Initialise all 10 households with default AC state."""
    now = datetime.now(SGT).isoformat()
    for h in HOUSEHOLDS:
        _states[h["household_id"]] = DeviceState(
            household_id=h["household_id"],
            device_id="ac-living-room",
            is_on=False,
            temp_c=25,
            mode="cool",
            schedule_start=None,
            schedule_end=None,
            last_updated=now,
        )


def get_state(household_id: int) -> DeviceState | None:
    return _states.get(household_id)


def set_schedule(household_id: int, start: str, end: str, temp_c: int = 25) -> None:
    """Schedule AC on/off. Handles overnight wrap (e.g. 22:00 → 02:00)."""
    state = _states.get(household_id)
    if state is None:
        raise ValueError(f"Unknown household_id: {household_id}")

    today = datetime.now(SGT).date().isoformat()
    _states[household_id] = state.model_copy(update={
        "schedule_start": f"{today}T{start}:00+08:00",
        "schedule_end":   f"{today}T{end}:00+08:00",
        "temp_c": temp_c,
        "is_on": True,
        "last_updated": datetime.now(SGT).isoformat(),
    })

    _log_buffer.append([
        household_id, "ac-living-room", "ac_schedule",
        json.dumps({"start": start, "end": end, "temp_c": temp_c}),
        "scheduled",
        0.8,   # projected_kwh_saved placeholder (overwritten by router)
        0.23,  # projected_sgd_saved placeholder
    ])


def set_off(household_id: int) -> None:
    """Immediately turn off AC."""
    state = _states.get(household_id)
    if state is None:
        return
    _states[household_id] = state.model_copy(update={
        "is_on": False,
        "schedule_start": None,
        "schedule_end": None,
        "last_updated": datetime.now(SGT).isoformat(),
    })
    _log_buffer.append([
        household_id, "ac-living-room", "ac_off",
        json.dumps({}), "completed", 0.0, 0.0,
    ])


def compute_savings(start_time: str, end_time: str) -> tuple[float, float]:
    """Compute projected kWh and SGD saved from an AC schedule."""
    sh, sm = map(int, start_time.split(":"))
    eh, em = map(int, end_time.split(":"))
    start_m = sh * 60 + sm
    end_m = eh * 60 + em
    if end_m <= start_m:          # overnight: e.g. 22:00 → 02:00
        end_m += 24 * 60
    duration_h = (end_m - start_m) / 60
    kwh = round(duration_h * 0.2, 3)   # ~0.2 kWh/hr saved from optimised schedule
    sgd = round(kwh * 0.2911, 2)
    return kwh, sgd


async def run_schedule_checker() -> None:
    """
    Background task (started via FastAPI lifespan):
    - Every 60s: expire schedules that have passed their end time
    - Every 60s: flush the log buffer to ClickHouse
    """
    while True:
        await asyncio.sleep(60)
        now = datetime.now(SGT)

        # Expire schedules
        for hid, state in list(_states.items()):
            if state.schedule_end:
                end_dt = datetime.fromisoformat(state.schedule_end)
                if now > end_dt and state.is_on:
                    _states[hid] = state.model_copy(update={"is_on": False})

        # Flush log buffer
        if _log_buffer:
            batch = _log_buffer.copy()
            _log_buffer.clear()
            try:
                from app.db.client import get_client
                get_client().insert(
                    "device_actions",
                    batch,
                    column_names=[
                        "household_id", "device_id", "action_type",
                        "params_json", "status",
                        "projected_kwh_saved", "projected_sgd_saved",
                    ],
                )
            except Exception:
                pass  # best-effort for demo — errors don't block UI
