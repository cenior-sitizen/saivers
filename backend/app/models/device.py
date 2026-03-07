"""Pydantic models for AC device control."""

from pydantic import BaseModel, field_validator
from typing import Optional


class DeviceState(BaseModel):
    household_id: int
    device_id: str
    is_on: bool
    temp_c: int
    mode: str
    schedule_start: Optional[str] = None
    schedule_end: Optional[str] = None
    last_updated: str


class ACScheduleRequest(BaseModel):
    household_id: int
    start_time: str   # 'HH:MM' in SGT
    end_time: str     # 'HH:MM' in SGT
    temp_c: int = 25

    @field_validator("temp_c")
    @classmethod
    def validate_temp(cls, v: int) -> int:
        if not 16 <= v <= 30:
            raise ValueError("temp_c must be between 16 and 30°C")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time(cls, v: str) -> str:
        parts = v.split(":")
        if len(parts) != 2:
            raise ValueError("Time must be HH:MM format")
        h, m = int(parts[0]), int(parts[1])
        if not (0 <= h <= 23 and m in (0, 30)):
            raise ValueError("Time must be HH:00 or HH:30")
        return v


class ApplyRecommendationRequest(BaseModel):
    household_id: int
    insight_id: str


class DeviceActionResponse(BaseModel):
    action_id: str
    status: str
    message: str
    projected_kwh_saved: float
    projected_sgd_saved: float
