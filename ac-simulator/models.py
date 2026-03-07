"""Pydantic models for the AC Simulator service."""

from typing import Optional
from pydantic import BaseModel, field_validator


class ACState(BaseModel):
    household_id: int
    room_id: str           # e.g. "living-room"
    device_id: str         # e.g. "ac-living-room-1"  (unique per AC unit)
    appliance_name: str    # e.g. "Living Room AC 1"  (human-readable label)
    is_on: bool
    temp_c: int            # current set-point (16–30°C)
    mode: str              # "cool" | "fan" | "dry"
    power_w: float         # current power draw in watts (0 when off)
    schedule_start: Optional[str] = None  # ISO8601+08:00 when timer fires ON
    schedule_end: Optional[str] = None    # ISO8601+08:00 when timer fires OFF
    last_updated: str      # ISO8601+08:00


class TurnOnRequest(BaseModel):
    temp_c: int = 25
    mode: str = "cool"

    @field_validator("temp_c")
    @classmethod
    def validate_temp(cls, v: int) -> int:
        if not 16 <= v <= 30:
            raise ValueError("temp_c must be between 16 and 30")
        return v

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v: str) -> str:
        if v not in ("cool", "fan", "dry"):
            raise ValueError("mode must be cool, fan, or dry")
        return v


class TempRequest(BaseModel):
    temp_c: int

    @field_validator("temp_c")
    @classmethod
    def validate_temp(cls, v: int) -> int:
        if not 16 <= v <= 30:
            raise ValueError("temp_c must be between 16 and 30")
        return v


class ModeRequest(BaseModel):
    mode: str

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v: str) -> str:
        if v not in ("cool", "fan", "dry"):
            raise ValueError("mode must be cool, fan, or dry")
        return v


class TimerRequest(BaseModel):
    start_time: str   # "HH:MM" in SGT
    end_time: str     # "HH:MM" in SGT
    temp_c: int = 25

    @field_validator("temp_c")
    @classmethod
    def validate_temp(cls, v: int) -> int:
        if not 16 <= v <= 30:
            raise ValueError("temp_c must be between 16 and 30")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        parts = v.split(":")
        if len(parts) != 2:
            raise ValueError("Time must be HH:MM")
        h, m = int(parts[0]), int(parts[1])
        if not (0 <= h <= 23 and 0 <= m <= 59):
            raise ValueError("Invalid time value")
        return v
