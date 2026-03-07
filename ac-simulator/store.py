"""
In-memory AC state store + background simulation tick.

- 10 households x 4 rooms x 2 ACs = 80 AC units
- Each AC has a unique device_id (e.g. "ac-living-room-1", "ac-living-room-2")
- Store key: (household_id, device_id) — device_id is globally unique per unit
- Background tick runs every 5s:
    1. Fire pending timers (midnight-crossing aware)
    2. Jitter power_w +/-5% for realism
    3. Push state snapshot to all SSE subscriber queues
- SSE queues: maxsize=10, drop oldest on overflow (backpressure protection)
- State resets on process restart (expected for demo)
"""

import asyncio
import random
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from models import ACState

SGT = ZoneInfo("Asia/Singapore")

HOUSEHOLD_IDS = list(range(1001, 1011))  # 1001–1010

# (room_id, device_id, appliance_name) — 2 AC units per room
ROOMS = [
    ("living-room", "ac-living-room-1", "Living Room AC 1"),
    ("living-room", "ac-living-room-2", "Living Room AC 2"),
    ("master-room", "ac-master-room-1", "Master Room AC 1"),
    ("master-room", "ac-master-room-2", "Master Room AC 2"),
    ("room-1",      "ac-room-1-unit-1", "Room 1 AC 1"),
    ("room-1",      "ac-room-1-unit-2", "Room 1 AC 2"),
    ("room-2",      "ac-room-2-unit-1", "Room 2 AC 1"),
    ("room-2",      "ac-room-2-unit-2", "Room 2 AC 2"),
]

VALID_DEVICE_IDS = {device_id for _, device_id, _ in ROOMS}

# Primary state store: (household_id, device_id) → ACState
# device_id is the unique key — each AC unit has exactly one entry
_store: dict[tuple[int, str], ACState] = {}

# SSE subscribers: set of asyncio.Queue — each connected client gets one
_subscribers: set[asyncio.Queue] = set()

TICK_INTERVAL = 5   # seconds between simulation ticks
QUEUE_MAX = 10      # max buffered events per slow subscriber


# ── Power formula ─────────────────────────────────────────────────────────────

def _calc_power(temp_c: int) -> float:
    """Cooler set-point = more power. Range: 400–1100W."""
    base_w = (30 - temp_c) * 50 + 400
    return round(base_w * random.uniform(0.9, 1.1), 1)


def _jitter_power(current_w: float) -> float:
    """Small ±5% fluctuation each tick while AC is on."""
    return round(current_w * random.uniform(0.95, 1.05), 1)


# ── Timer helpers ─────────────────────────────────────────────────────────────

def _parse_timer_dt(time_str: str, reference: datetime) -> datetime:
    """
    Parse 'HH:MM' as an SGT datetime on the same day as `reference`.
    If the result is in the past, advance by one day (handles midnight crossing).
    """
    h, m = map(int, time_str.split(":"))
    dt = reference.replace(hour=h, minute=m, second=0, microsecond=0)
    if dt <= reference:
        dt += timedelta(days=1)
    return dt


def _make_schedule_iso(time_str: str, reference: datetime) -> str:
    """Return ISO8601+08:00 string for a HH:MM schedule relative to now."""
    h, m = map(int, time_str.split(":"))
    today = reference.date()
    dt = datetime(today.year, today.month, today.day, h, m, tzinfo=SGT)
    return dt.isoformat()


# ── State initialisation ──────────────────────────────────────────────────────

def init_store() -> None:
    """Seed all 80 AC units (10 households x 4 rooms x 2 units) with default off state."""
    now_iso = datetime.now(SGT).isoformat()
    for hid in HOUSEHOLD_IDS:
        for room_id, device_id, appliance_name in ROOMS:
            _store[(hid, device_id)] = ACState(
                household_id=hid,
                room_id=room_id,
                device_id=device_id,
                appliance_name=appliance_name,
                is_on=False,
                temp_c=25,
                mode="cool",
                power_w=0.0,
                schedule_start=None,
                schedule_end=None,
                last_updated=now_iso,
            )
    print(f"[store] Initialised {len(_store)} AC units")


# ── State accessors ───────────────────────────────────────────────────────────

def get_ac(household_id: int, device_id: str) -> ACState | None:
    return _store.get((household_id, device_id))


def list_acs(household_id: int) -> list[ACState]:
    """Return all AC units for a household, in ROOMS definition order."""
    return [_store[(household_id, d)] for _, d, _ in ROOMS if (household_id, d) in _store]


def list_acs_by_room(household_id: int, room_id: str) -> list[ACState]:
    """Return only the AC units in a specific room."""
    return [_store[(household_id, d)] for r, d, _ in ROOMS
            if r == room_id and (household_id, d) in _store]


# ── State mutations ───────────────────────────────────────────────────────────

def _update(household_id: int, device_id: str, **kwargs) -> ACState:
    state = _store[(household_id, device_id)]
    updated = state.model_copy(update={**kwargs, "last_updated": datetime.now(SGT).isoformat()})
    _store[(household_id, device_id)] = updated
    return updated


def set_on(household_id: int, device_id: str, temp_c: int = 25, mode: str = "cool") -> ACState:
    return _update(household_id, device_id, is_on=True, temp_c=temp_c, mode=mode,
                   power_w=_calc_power(temp_c))


def set_off(household_id: int, device_id: str) -> ACState:
    return _update(household_id, device_id, is_on=False, power_w=0.0,
                   schedule_start=None, schedule_end=None)


def set_temp(household_id: int, device_id: str, temp_c: int) -> ACState:
    state = _store[(household_id, device_id)]
    power = _calc_power(temp_c) if state.is_on else 0.0
    return _update(household_id, device_id, temp_c=temp_c, power_w=power)


def set_mode(household_id: int, device_id: str, mode: str) -> ACState:
    return _update(household_id, device_id, mode=mode)


def set_timer(household_id: int, device_id: str, start_time: str, end_time: str, temp_c: int = 25) -> ACState:
    now = datetime.now(SGT)
    start_iso = _make_schedule_iso(start_time, now)
    sh, sm = map(int, start_time.split(":"))
    eh, em = map(int, end_time.split(":"))
    start_mins = sh * 60 + sm
    end_mins   = eh * 60 + em
    end_dt = datetime(now.year, now.month, now.day, eh, em, tzinfo=SGT)
    if end_mins <= start_mins:          # overnight schedule e.g. 22:00 → 02:00
        end_dt += timedelta(days=1)
    end_iso = end_dt.isoformat()
    return _update(household_id, device_id, schedule_start=start_iso, schedule_end=end_iso,
                   temp_c=temp_c)


def cancel_timer(household_id: int, device_id: str) -> ACState:
    return _update(household_id, device_id, schedule_start=None, schedule_end=None)


# ── SSE subscriber management ─────────────────────────────────────────────────

def add_subscriber(q: asyncio.Queue) -> None:
    _subscribers.add(q)


def remove_subscriber(q: asyncio.Queue) -> None:
    _subscribers.discard(q)


def _broadcast(payload: str) -> None:
    """Push payload to all subscriber queues. Drop oldest if queue is full."""
    for q in list(_subscribers):
        if q.full():
            try:
                q.get_nowait()   # drop oldest stale event
            except asyncio.QueueEmpty:
                pass
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            pass  # still full after drain — skip this subscriber tick


# ── Background simulation tick ────────────────────────────────────────────────

async def tick_loop() -> None:
    """
    Runs every TICK_INTERVAL seconds:
      1. Fire timers (turn on at schedule_start, off at schedule_end)
      2. Jitter power_w for running units
      3. Broadcast snapshot to SSE subscribers
    """
    import json

    while True:
        await asyncio.sleep(TICK_INTERVAL)
        now = datetime.now(SGT)

        for (hid, device_id), state in list(_store.items()):
            changed = False

            # --- Timer: turn ON ---
            if state.schedule_start and not state.is_on:
                try:
                    start_dt = datetime.fromisoformat(state.schedule_start)
                    if now >= start_dt:
                        _update(hid, device_id, is_on=True,
                                power_w=_calc_power(state.temp_c))
                        state = _store[(hid, device_id)]
                        changed = True
                except ValueError:
                    pass

            # --- Timer: turn OFF ---
            if state.schedule_end and state.is_on:
                try:
                    end_dt = datetime.fromisoformat(state.schedule_end)
                    if now >= end_dt:
                        _update(hid, device_id, is_on=False, power_w=0.0,
                                schedule_start=None, schedule_end=None)
                        state = _store[(hid, device_id)]
                        changed = True
                except ValueError:
                    pass

            # --- Power jitter for running units ---
            if state.is_on and not changed:
                new_power = _jitter_power(state.power_w)
                _store[(hid, device_id)] = state.model_copy(
                    update={"power_w": new_power,
                            "last_updated": now.isoformat()}
                )

        # Broadcast only if there are subscribers
        if _subscribers:
            # Build a snapshot grouped by household_id
            snapshot: dict[int, list] = {}
            for (hid, _), state in _store.items():
                snapshot.setdefault(hid, []).append(state.model_dump())
            payload = json.dumps(snapshot)
            _broadcast(payload)
