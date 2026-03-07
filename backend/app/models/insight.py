"""Pydantic models for insights and anomalies."""

from pydantic import BaseModel
from typing import Optional


class AnomalyItem(BaseModel):
    household_id: int
    ts: str
    slot_idx: int
    time_label: str
    kwh: float
    baseline_kwh: float
    excess_kwh: float
    anomaly_score: float


class ProjectedSavings(BaseModel):
    kwh: float
    sgd: float
    co2_kg: float
    per: str  # 'night' | 'week' | 'month'


class Recommendation(BaseModel):
    action: str
    appliance: str


class InsightEvidence(BaseModel):
    baseline_kwh: float
    actual_kwh: float
    anomaly_score: float
    days_observed: int


class InsightResponse(BaseModel):
    id: str
    type: str
    title: str
    plain_language: str
    evidence: InsightEvidence
    recommendation: Recommendation
    projected_savings: ProjectedSavings
    can_automate: bool


class WeeklyComparison(BaseModel):
    this_week_kwh: float
    last_week_kwh: float
    change_pct: float


class ACPattern(BaseModel):
    avg_daily_hours_on: float
    typical_start_slot: int
    typical_end_slot: int
    night_usage_detected: bool


class ACReadingIn(BaseModel):
    household_id: int
    device_id: str = "ac-living-room"
    ts: str              # ISO datetime string SGT
    power_w: float
    kwh: float
    temp_setting_c: int = 25
    is_on: bool
    mode: str = "cool"


class SPIntervalIn(BaseModel):
    household_id: int
    neighborhood_id: str = "punggol"
    flat_type: str = "4-room HDB"
    ts: str
    kwh: float
    cost_sgd: float
    carbon_kg: float
    peak_flag: bool = False
    dr_event_flag: bool = False
