"""
Aircon endpoints for frontend integration.

GET /api/aircon/impact — aggregates AC usage across households
GET /api/aircon/room/{slug} — per-room data for room detail page
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter

from app.db.client import get_client

router = APIRouter()

ROOM_TO_HOUSEHOLD: dict[str, int] = {
    "master-room": 1001,
    "room-1": 1002,
    "room-2": 1003,
    "living-room": 1004,
}

# Frontend mapping: household_id → room slug (4 households = 4 rooms in UI)
HOUSEHOLD_TO_ROOM: dict[int, str] = {
    1001: "master-room",
    1002: "room-1",
    1003: "room-2",
    1004: "living-room",
}
ROOM_NAMES: dict[str, str] = {
    "master-room": "Master Bedroom",
    "room-1": "Bedroom 2",
    "room-2": "Bedroom 3",
    "living-room": "Living Room",
}
HOUSEHOLD_IDS = [1001, 1002, 1003, 1004]
TARIFF = 0.2911


@router.get("/impact")
def get_aircon_impact():
    """
    Aggregate AC usage across households 1001–1004 for the aircon-impact page.
    Returns same shape as frontend expects.
    """
    try:
        client = get_client()
    except Exception:
        return _empty_response()

    SGT = ZoneInfo("Asia/Singapore")
    sgt_today = datetime.now(SGT).date()
    this_week_start = sgt_today - timedelta(days=6)
    last_week_start = sgt_today - timedelta(days=13)

    try:
        # 1. This week vs last week totals (all households)
        result = client.query(
            """
            SELECT
                sumIf(kwh, reading_date >= {week_start:Date} AND reading_date <= {today:Date}) AS this_week,
                sumIf(kwh, reading_date >= {lw_start:Date} AND reading_date < {week_start:Date}) AS last_week
            FROM ac_readings
            WHERE household_id IN (1001, 1002, 1003, 1004)
              AND reading_date >= {lw_start:Date}
            """,
            parameters={
                "today": str(sgt_today),
                "week_start": str(this_week_start),
                "lw_start": str(last_week_start),
            },
        )
        row = list(result.named_results())[0]
        this_week = round(float(row.get("this_week") or 0), 2)
        last_week = round(float(row.get("last_week") or 0), 2)
        percent_change = (
            round((this_week - last_week) / last_week * 100, 1) if last_week > 0 else 0.0
        )
        this_week_cost = this_week * TARIFF
        last_week_cost = last_week * TARIFF

        # 2. Daily breakdown for chart (last 7 days)
        chart_result = client.query(
            """
            SELECT
                reading_date,
                round(sum(kwh), 2) AS kwh
            FROM ac_readings
            WHERE household_id IN (1001, 1002, 1003, 1004)
              AND reading_date >= {week_start:Date}
              AND reading_date <= {today:Date}
            GROUP BY reading_date
            ORDER BY reading_date
            """,
            parameters={
                "today": str(sgt_today),
                "week_start": str(this_week_start),
            },
        )
        day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        chart_data = []
        for r in chart_result.named_results():
            d = r["reading_date"]
            label = day_labels[d.weekday()] if hasattr(d, "weekday") else str(d)[:3]
            chart_data.append({"label": label, "value": float(r.get("kwh") or 0)})

        # 3. Per-household (room) breakdown
        room_result = client.query(
            """
            SELECT
                household_id,
                round(sum(kwh), 2) AS total_kwh,
                countIf(is_on = 1) * 0.5 AS runtime_hours,
                avgIf(temp_setting_c, is_on = 1) AS avg_temp
            FROM ac_readings
            WHERE household_id IN (1001, 1002, 1003, 1004)
              AND reading_date >= {week_start:Date}
              AND reading_date <= {today:Date}
            GROUP BY household_id
            """,
            parameters={
                "today": str(sgt_today),
                "week_start": str(this_week_start),
            },
        )
        room_rows = list(room_result.named_results())
        total_kwh = sum(float(r.get("total_kwh") or 0) for r in room_rows)
        room_usage_data = []
        for r in room_rows:
            hid = r["household_id"]
            slug = HOUSEHOLD_TO_ROOM.get(hid, f"hh-{hid}")
            kwh = float(r.get("total_kwh") or 0)
            pct = round(kwh / total_kwh * 100, 1) if total_kwh > 0 else 0.0
            runtime = float(r.get("runtime_hours") or 0)
            status = "Running" if runtime > 0 else "Idle"
            room_usage_data.append(
                {
                    "id": slug,
                    "name": ROOM_NAMES.get(slug, f"Household {hid}"),
                    "status": status,
                    "usageKwh": round(kwh, 2),
                    "percentOfTotal": pct,
                    "runtimeHours": round(runtime, 1),
                    "avgTempC": int(r.get("avg_temp") or 24),
                    "trendNote": "From backend",
                }
            )

        saved_vs_last = max(0, last_week_cost - this_week_cost)

        return {
            "summary": {
                "totalKwhThisWeek": this_week,
                "costThisWeek": f"S${this_week_cost:.2f}",
                "savedVsLastWeek": round(saved_vs_last, 2),
            },
            "weeklyComparison": {
                "thisWeek": this_week,
                "lastWeek": last_week,
                "percentChange": percent_change,
                "thisWeekCost": f"S${this_week_cost:.2f}",
                "lastWeekCost": f"S${last_week_cost:.2f}",
            },
            "chartData": chart_data,
            "roomUsageData": room_usage_data,
        }
    except Exception as e:
        return _empty_response(error=str(e))


@router.get("/room/{slug}")
def get_room_data(slug: str):
    """
    Return room-level AC data for the given room slug.
    Slug: master-room, room-1, room-2, living-room.
    """
    if slug not in ROOM_TO_HOUSEHOLD:
        return {"error": "Invalid room"}
    household_id = ROOM_TO_HOUSEHOLD[slug]

    try:
        client = get_client()
    except Exception:
        return {"error": "Backend unavailable", "room": slug}

    SGT = ZoneInfo("Asia/Singapore")
    sgt_today = datetime.now(SGT).date()
    this_week_start = sgt_today - timedelta(days=6)
    last_week_start = sgt_today - timedelta(days=13)

    try:
        # 1. Today's summary
        today_result = client.query(
            """
            SELECT
                sum(kwh) AS energy_today_kwh,
                countIf(is_on = 1) * 0.5 AS runtime_today_hours,
                argMax(is_on, ts) AS is_on_now,
                argMax(temp_setting_c, ts) AS temp_setting
            FROM ac_readings
            WHERE household_id = {hid:UInt32}
              AND reading_date = {today:Date}
            """,
            parameters={"hid": household_id, "today": str(sgt_today)},
        )
        today_row = list(today_result.named_results())
        today = today_row[0] if today_row else {}

        # 2. Usage by day (last 7 days)
        week_result = client.query(
            """
            SELECT
                reading_date,
                toDayOfWeek(reading_date) AS dow,
                round(sum(kwh), 2) AS kwh
            FROM ac_readings
            WHERE household_id = {hid:UInt32}
              AND reading_date >= {week_start:Date}
              AND reading_date <= {today:Date}
            GROUP BY reading_date
            ORDER BY reading_date
            """,
            parameters={
                "hid": household_id,
                "today": str(sgt_today),
                "week_start": str(this_week_start),
            },
        )
        day_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        week_data = []
        for r in week_result.named_results():
            d = r["reading_date"]
            label = day_labels[d.weekday()] if hasattr(d, "weekday") else str(d)[:3]
            week_data.append(
                {"time": label, "value": float(r.get("kwh") or 0), "isOn": True}
            )

        # 3. Usage by hour (today)
        day_result = client.query(
            """
            SELECT
                toHour(ts) AS hour,
                round(sum(kwh), 2) AS kwh,
                countIf(is_on = 1) > 0 AS is_on
            FROM ac_readings
            WHERE household_id = {hid:UInt32}
              AND reading_date = {today:Date}
            GROUP BY toHour(ts)
            ORDER BY toHour(ts)
            """,
            parameters={"hid": household_id, "today": str(sgt_today)},
        )
        day_data = []
        for r in day_result.named_results():
            h = int(r.get("hour") or 0)
            day_data.append(
                {
                    "time": f"{h:02d}:00",
                    "value": float(r.get("kwh") or 0),
                    "isOn": bool(r.get("is_on")),
                }
            )

        # 4. Last week total
        lw_result = client.query(
            """
            SELECT round(sum(kwh), 2) AS total
            FROM ac_readings
            WHERE household_id = {hid:UInt32}
              AND reading_date >= {lw_start:Date}
              AND reading_date < {week_start:Date}
            """,
            parameters={
                "hid": household_id,
                "lw_start": str(last_week_start),
                "week_start": str(this_week_start),
            },
        )
        lw_row = list(lw_result.named_results())
        last_week_kwh = float(lw_row[0].get("total") or 0) if lw_row else 0
        this_week_kwh = sum(d["value"] for d in week_data)
        vs_pct = (
            round((this_week_kwh - last_week_kwh) / last_week_kwh * 100, 1)
            if last_week_kwh > 0
            else 0
        )

        return {
            "room": slug,
            "householdId": household_id,
            "today": {
                "energyKwh": float(today.get("energy_today_kwh") or 0),
                "runtimeHours": float(today.get("runtime_today_hours") or 0),
                "status": "On" if today.get("is_on_now") else "Off",
                "temperature": int(today.get("temp_setting") or 24),
            },
            "usageDay": day_data,
            "usageWeek": week_data,
            "vsLastWeek": {
                "thisWeekKwh": this_week_kwh,
                "lastWeekKwh": last_week_kwh,
                "percentChange": vs_pct,
            },
        }
    except Exception as e:
        return {"error": str(e), "room": slug}


def _empty_response(error: str | None = None) -> dict:
    return {
        "summary": {
            "totalKwhThisWeek": 0,
            "costThisWeek": "S$0.00",
            "savedVsLastWeek": 0,
        },
        "weeklyComparison": {
            "thisWeek": 0,
            "lastWeek": 0,
            "percentChange": 0,
            "thisWeekCost": "S$0.00",
            "lastWeekCost": "S$0.00",
        },
        "chartData": [],
        "roomUsageData": [],
        "error": error,
    }
