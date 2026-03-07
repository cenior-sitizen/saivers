"""Pydantic models for habit tracking and rewards."""

from pydantic import BaseModel


class HabitEntry(BaseModel):
    streak_days: int
    today_achieved: bool
    this_week_rate: float


class HabitStatus(BaseModel):
    offpeak_ac: HabitEntry
    weekly_reduction: HabitEntry


class ImpactSummary(BaseModel):
    kwh_saved: float
    sgd_saved: float
    co2_saved: float
    reduction_pct: float
    ai_summary: str


class RewardHistoryItem(BaseModel):
    date: str
    points: int
    reason: str


class RewardBalance(BaseModel):
    points_balance: int
    points_to_next_voucher: int
    vouchers_available: int
    history: list[RewardHistoryItem]
