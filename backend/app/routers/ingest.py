"""
Real-time ingestion endpoints with 30-row in-memory buffer.

Flush to ClickHouse when buffer reaches 30 rows (per insert-batch-size rule).
Never inserts single rows to avoid part explosion.

Endpoints:
  POST /api/ingest/ac-reading
  POST /api/ingest/sp-interval
"""

import time
from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.db.client import get_client

router = APIRouter()

_FLUSH_THRESHOLD = 30
_FLUSH_TIMEOUT_S = 10.0  # flush if last flush was > 10s ago

# --- Immutable buffer state replaced on flush (no in-place mutation) ---
_ac_buffer: list[dict] = []
_ac_last_flush: float = time.monotonic()

_sp_buffer: list[dict] = []
_sp_last_flush: float = time.monotonic()

_AC_COLUMNS = ["household_id", "device_id", "ts", "power_w", "kwh", "temp_setting_c", "is_on", "mode"]
_SP_COLUMNS = ["household_id", "neighborhood_id", "flat_type", "ts", "kwh", "cost_sgd", "carbon_kg", "peak_flag", "dr_event_flag"]


class ACReadingRequest(BaseModel):
    household_id: int
    device_id: str = "ac-living-room"
    ts: datetime
    power_w: float
    kwh: float
    temp_setting_c: int = Field(ge=0, le=30)
    is_on: bool
    mode: str = "cool"


class SPIntervalRequest(BaseModel):
    household_id: int
    neighborhood_id: str
    flat_type: str
    ts: datetime
    kwh: float = Field(ge=0)
    cost_sgd: float = Field(ge=0)
    carbon_kg: float = Field(ge=0)
    peak_flag: bool = False
    dr_event_flag: bool = False


class IngestResponse(BaseModel):
    buffered: int
    flushed: bool


def _should_flush(buffer: list, last_flush: float) -> bool:
    return len(buffer) >= _FLUSH_THRESHOLD or (time.monotonic() - last_flush) > _FLUSH_TIMEOUT_S


def _flush_to_clickhouse(table: str, columns: list[str], buffer: list[dict]) -> None:
    if not buffer:
        return
    client = get_client()
    data = [[row[col] for col in columns] for row in buffer]
    client.insert(table, data, column_names=columns)


@router.post("/ac-reading", response_model=IngestResponse)
def ingest_ac_reading(body: ACReadingRequest) -> IngestResponse:
    global _ac_buffer, _ac_last_flush

    new_row = body.model_dump()
    new_buffer = _ac_buffer + [new_row]
    flushed = False

    if _should_flush(new_buffer, _ac_last_flush):
        _flush_to_clickhouse("ac_readings", _AC_COLUMNS, new_buffer)
        _ac_buffer = []
        _ac_last_flush = time.monotonic()
        flushed = True
    else:
        _ac_buffer = new_buffer

    return IngestResponse(buffered=len(_ac_buffer), flushed=flushed)


@router.post("/sp-interval", response_model=IngestResponse)
def ingest_sp_interval(body: SPIntervalRequest) -> IngestResponse:
    global _sp_buffer, _sp_last_flush

    new_row = body.model_dump()
    new_buffer = _sp_buffer + [new_row]
    flushed = False

    if _should_flush(new_buffer, _sp_last_flush):
        _flush_to_clickhouse("sp_energy_intervals", _SP_COLUMNS, new_buffer)
        _sp_buffer = []
        _sp_last_flush = time.monotonic()
        flushed = True
    else:
        _sp_buffer = new_buffer

    return IngestResponse(buffered=len(_sp_buffer), flushed=flushed)
