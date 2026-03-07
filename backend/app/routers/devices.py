"""AC device control endpoints — Mock MCP layer."""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.data.rooms import ROOM_MAP, ROOM_ORDER
from app.db.client import get_client
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


# ── Response model ────────────────────────────────────────────────────────────

class RoomDeviceStatus(BaseModel):
    room_id: str
    room_name: str
    slug: str
    appliance: str
    device_id: str
    status: str                   # "On" | "Off"
    temp_setting_c: int
    runtime_today_hours: float
    kwh_today: float
    kwh_this_week: float
    percent_of_total: float       # share of household weekly kWh; 0 if no data
    runtime_week_hours: float
    avg_temp_c: float
    trend_vs_last_week_pct: float  # negative = improved, positive = increased


# ── Rooms endpoint ────────────────────────────────────────────────────────────

@router.get("/rooms/{household_id}", response_model=list[RoomDeviceStatus])
def get_rooms(household_id: int) -> list[RoomDeviceStatus]:
    """
    Return per-room AC appliance status and weekly usage for a household.
    Always returns 200 with 4 rooms — missing data returns zeros.
    """
    client = get_client()

    # SGT date boundaries (not ClickHouse today() which is UTC)
    sgt_today = datetime.now(SGT).date()
    this_week_start = sgt_today - timedelta(days=6)
    last_week_start = sgt_today - timedelta(days=13)

    result = client.query(
        """
        SELECT
            device_id,
            argMax(is_on, ts)                                                      AS current_on,
            argMax(temp_setting_c, ts)                                             AS current_temp,
            countIf(is_on = 1 AND reading_date = {today:Date}) / 2.0             AS runtime_today_h,
            toFloat64(sumIf(kwh, reading_date = {today:Date}))                    AS kwh_today,
            toFloat64(sumIf(kwh, reading_date >= {week_start:Date}))              AS kwh_this_week,
            toFloat64(sumIf(kwh, reading_date >= {lw_start:Date}
                                AND reading_date < {week_start:Date}))            AS kwh_last_week,
            countIf(is_on = 1 AND reading_date >= {week_start:Date}) / 2.0       AS runtime_week_h,
            avgIf(toFloat64(temp_setting_c),
                  is_on = 1 AND reading_date >= {week_start:Date})                AS avg_temp
        FROM ac_readings
        WHERE household_id = {hid:UInt32}
          AND reading_date >= {lw_start:Date}
        GROUP BY device_id
        """,
        parameters={
            "hid":        household_id,
            "today":      str(sgt_today),
            "week_start": str(this_week_start),
            "lw_start":   str(last_week_start),
        },
    )

    # Build lookup: device_id → query row
    row_map: dict[str, dict] = {}
    for row in result.named_results():
        row_map[row["device_id"]] = row

    # Compute total weekly kWh across all rooms for percent_of_total
    total_week_kwh = sum(
        float(r.get("kwh_this_week") or 0) for r in row_map.values()
    )

    rooms: list[RoomDeviceStatus] = []
    for device_id in ROOM_ORDER:
        meta = ROOM_MAP[device_id]
        r = row_map.get(device_id, {})

        kwh_week = float(r.get("kwh_this_week") or 0)
        kwh_last = float(r.get("kwh_last_week") or 0)

        pct_of_total = round(kwh_week / total_week_kwh * 100, 1) if total_week_kwh > 0 else 0.0
        trend = round((kwh_week - kwh_last) / kwh_last * 100, 1) if kwh_last > 0 else 0.0

        rooms.append(
            RoomDeviceStatus(
                room_id=meta["room_id"],
                room_name=meta["room_name"],
                slug=meta["slug"],
                appliance=meta["appliance"],
                device_id=device_id,
                status="On" if r.get("current_on") else "Off",
                temp_setting_c=int(r.get("current_temp") or 0),
                runtime_today_hours=round(float(r.get("runtime_today_h") or 0), 1),
                kwh_today=round(float(r.get("kwh_today") or 0), 3),
                kwh_this_week=round(kwh_week, 3),
                percent_of_total=pct_of_total,
                runtime_week_hours=round(float(r.get("runtime_week_h") or 0), 1),
                avg_temp_c=round(float(r.get("avg_temp") or 0), 1),
                trend_vs_last_week_pct=trend,
            )
        )

    return rooms

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


# ── Daily snapshot endpoint ────────────────────────────────────────────────────

@router.get("/daily-snapshot/{household_id}")
def get_daily_snapshot(household_id: int) -> list[dict]:
    """
    Return today's per-device AC usage snapshot (8am fetch pattern).

    Always returns 4 room entries — zeros if no data for a device today.
    Frontend calls once on page load; no push required.

    Response per device:
      device_id, device_name, kwh_today, runtime_hours, avg_temp_c,
      is_on_now, power_w (live from simulator if available)
    """
    from app.data.rooms import ROOM_MAP, ROOM_ORDER
    sgt_today = datetime.now(SGT).date()
    client = get_client()

    result = client.query(
        """
        SELECT
            device_id,
            toFloat64(sum(kwh))                                  AS kwh_today,
            countIf(is_on = 1) / 2.0                            AS runtime_hours,
            toFloat64(avgIf(temp_setting_c, is_on = 1))         AS avg_temp_c,
            argMax(is_on, ts)                                    AS is_on_now
        FROM ac_readings
        WHERE household_id = {hid:UInt32}
          AND reading_date  = {today:Date}
        GROUP BY device_id
        """,
        parameters={"hid": household_id, "today": str(sgt_today)},
    )

    row_map: dict[str, dict] = {}
    for row in result.named_results():
        row_map[row["device_id"]] = row

    # Build live power from MCP client (best-effort)
    live_power: dict[str, float] = {}
    try:
        from app.services.mcp_client import MCPClient, SIMULATOR_DEVICE_MAP
        mcp = MCPClient(household_id)
        for room_device_id in ROOM_ORDER:
            units = mcp.get_status(room_device_id)
            live_power[room_device_id] = sum(u.get("power_w", 0.0) for u in units)
    except Exception:
        pass

    snapshot = []
    for device_id in ROOM_ORDER:
        meta = ROOM_MAP[device_id]
        r = row_map.get(device_id, {})
        snapshot.append({
            "device_id": device_id,
            "device_name": meta["room_name"] + " AC",
            "kwh_today": round(float(r.get("kwh_today") or 0), 3),
            "runtime_hours": round(float(r.get("runtime_hours") or 0), 1),
            "avg_temp_c": round(float(r.get("avg_temp_c") or 0), 1),
            "is_on_now": bool(r.get("is_on_now", False)),
            "power_w": round(live_power.get(device_id, 0.0), 1),
        })

    return snapshot
