"""
Insights, anomaly detection, coach chat, and data ingestion endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.models.insight import ACReadingIn, SPIntervalIn
from app.services.anomaly_service import (
    detect_ac_night_anomaly,
    get_ac_pattern,
    get_anomalies,
    get_weekly_comparison,
)
from app.services.insight_service import get_insights

router = APIRouter()

# ── Ingest buffers ────────────────────────────────────────────────────────────
_ac_buffer: list[list] = []
_sp_buffer: list[list] = []
FLUSH_THRESHOLD = 100  # flush when buffer reaches this size


def _flush_ac() -> None:
    if not _ac_buffer:
        return
    batch = _ac_buffer.copy()
    _ac_buffer.clear()
    try:
        from app.db.client import get_client
        get_client().insert(
            "ac_readings",
            batch,
            column_names=["household_id", "device_id", "ts", "power_w", "kwh",
                          "temp_setting_c", "is_on", "mode"],
        )
    except Exception:
        pass  # best-effort for demo


def _flush_sp() -> None:
    if not _sp_buffer:
        return
    batch = _sp_buffer.copy()
    _sp_buffer.clear()
    try:
        from app.db.client import get_client
        get_client().insert(
            "sp_energy_intervals",
            batch,
            column_names=["household_id", "neighborhood_id", "flat_type",
                          "ts", "kwh", "cost_sgd", "carbon_kg",
                          "peak_flag", "dr_event_flag"],
        )
    except Exception:
        pass


# ── Ingest endpoints ──────────────────────────────────────────────────────────

@router.post("/ingest/ac-reading")
def ingest_ac_reading(reading: ACReadingIn):
    _ac_buffer.append([
        reading.household_id, reading.device_id, reading.ts,
        reading.power_w, reading.kwh, reading.temp_setting_c,
        reading.is_on, reading.mode,
    ])
    if len(_ac_buffer) >= FLUSH_THRESHOLD:
        _flush_ac()
    return {"status": "received", "buffered": len(_ac_buffer)}


@router.post("/ingest/sp-interval")
def ingest_sp_interval(interval: SPIntervalIn):
    cost_sgd = round(interval.kwh * 0.2911, 4)
    carbon_kg = round(interval.kwh * 0.402, 4)
    _sp_buffer.append([
        interval.household_id, interval.neighborhood_id, interval.flat_type,
        interval.ts, interval.kwh, cost_sgd, carbon_kg,
        interval.peak_flag, interval.dr_event_flag,
    ])
    if len(_sp_buffer) >= FLUSH_THRESHOLD:
        _flush_sp()
    return {"status": "received", "buffered": len(_sp_buffer)}


# ── Anomaly endpoints ─────────────────────────────────────────────────────────

@router.get("/anomalies/{household_id}")
def anomalies(household_id: int, days: int = 7):
    return get_anomalies(household_id, days)


@router.get("/weekly-comparison/{household_id}")
def weekly_comparison(household_id: int):
    return get_weekly_comparison(household_id)


@router.get("/ac-pattern/{household_id}")
def ac_pattern(household_id: int):
    return get_ac_pattern(household_id)


@router.get("/ac-night-anomaly/{household_id}")
def ac_night_anomaly(household_id: int):
    return detect_ac_night_anomaly(household_id)


# ── Main insights endpoint ────────────────────────────────────────────────────

@router.get("/{household_id}")
def insights(household_id: int):
    """
    Return top AI-powered insights for a household.
    Numbers are computed deterministically; OpenAI only generates plain-language text.
    Results cached for 5 minutes.
    """
    return get_insights(household_id)


# ── Coach chat ────────────────────────────────────────────────────────────────

@router.post("/coach/chat")
def coach_chat(payload: dict):
    """Conversational AI coach. Accepts {household_id, message}."""
    household_id = payload.get("household_id", 1001)
    user_message = payload.get("message", "")

    from app.data.households import HOUSEHOLD_MAP
    from app.services.ai_service import generate_chat_response
    from app.services.anomaly_service import get_weekly_comparison, detect_ac_night_anomaly

    h = HOUSEHOLD_MAP.get(household_id, {"name": "Resident", "flat_type": "4-room HDB"})
    weekly = get_weekly_comparison(household_id)
    night = detect_ac_night_anomaly(household_id)

    context = {
        **h,
        "this_week_kwh": weekly.get("this_week_kwh", "N/A"),
        "change_pct": weekly.get("change_pct", 0),
        "anomaly_summary": f"AC at 2am detected ({night['days_observed']} nights)" if night["detected"] else "none",
    }

    return {
        "household_id": household_id,
        "response": generate_chat_response(context, user_message),
    }
