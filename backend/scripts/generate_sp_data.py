"""
Generate 43,200 SP half-hourly energy interval rows.

10 households x 90 days x 48 slots/day = 43,200 rows

Slot patterns (SGT):
  Slots  0-13  (00:00-07:00): 0.03-0.08 kWh  fridge baseline
  Slots 14-35  (07:00-18:00): 0.10-0.30 kWh  daytime
  Slots 36-45  (18:00-23:00): 0.50-1.40 kWh  PEAK — AC + appliances
  Slots 46-47  (23:00-00:00): 0.10-0.20 kWh  wind-down

Weekend modifier: +20% daytime; AC starts at slot 28 (14:00).

ANOMALY for household 1001, last 21 days:
  Slots 4-5 (02:00-03:00): +0.9 kWh above normal baseline
"""

import random
from datetime import datetime, timedelta, timezone

from app.data.households import HOUSEHOLDS, NEIGHBORHOOD_ID

_SGT = timezone(timedelta(hours=8))
_TARIFF = 0.2911
_CARBON = 0.402
_PEAK_SLOTS = range(36, 46)  # slots 36-45 inclusive
_ANOMALY_HOUSEHOLD = 1001
_ANOMALY_SLOTS = {4, 5}


def _kwh_for_slot(slot_idx: int, is_weekend: bool, household_id: int, is_anomaly_period: bool) -> float:
    if slot_idx <= 13:
        base = random.uniform(0.03, 0.08)
    elif slot_idx <= 35:
        base = random.uniform(0.10, 0.30)
        if is_weekend:
            base *= 1.20
    elif slot_idx <= 45:
        base = random.uniform(0.50, 1.40)
        if is_weekend and slot_idx >= 28:
            base *= 1.10
    else:
        base = random.uniform(0.10, 0.20)

    if is_anomaly_period and household_id == _ANOMALY_HOUSEHOLD and slot_idx in _ANOMALY_SLOTS:
        base += 0.9

    return round(base, 3)


def generate_sp_data() -> list[dict]:
    random.seed(42)
    today = datetime.now(_SGT).replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = today - timedelta(days=89)

    rows: list[dict] = []
    for household in HOUSEHOLDS:
        hid = household["household_id"]
        flat_type = household["flat_type"]
        for day_offset in range(90):
            day = start_date + timedelta(days=day_offset)
            is_weekend = day.weekday() >= 5
            is_anomaly_period = day_offset >= 69  # last 21 days of 90
            for slot in range(48):
                hours, mins = divmod(slot * 30, 60)
                ts = day.replace(hour=hours, minute=mins)
                kwh = _kwh_for_slot(slot, is_weekend, hid, is_anomaly_period)
                rows.append(
                    {
                        "household_id": hid,
                        "neighborhood_id": NEIGHBORHOOD_ID,
                        "flat_type": flat_type,
                        "ts": ts,
                        "kwh": kwh,
                        "cost_sgd": round(kwh * _TARIFF, 4),
                        "carbon_kg": round(kwh * _CARBON, 4),
                        "peak_flag": slot in _PEAK_SLOTS and not is_weekend,
                        "dr_event_flag": False,
                    }
                )
    return rows


if __name__ == "__main__":
    rows = generate_sp_data()
    print(f"Generated {len(rows):,} SP interval rows")
    sample = rows[0]
    print(f"Sample row: {sample}")
