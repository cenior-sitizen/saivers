"""
Generate SP half-hourly energy interval rows.

10 households x 90 days x 48 slots/day = 43,200 rows

Slot patterns (SGT):
  Slots  0-13  (00:00-07:00): 0.03-0.08 kWh  fridge baseline
  Slots 14-35  (07:00-18:00): 0.10-0.30 kWh  daytime
  Slots 36-45  (18:00-23:00): 0.50-1.40 kWh  PEAK — AC + appliances
  Slots 46-47  (23:00-00:00): 0.10-0.20 kWh  wind-down

Demo personas (all 90 days):
  1001 Ahmad  — The Waster:   +40% baseline, AC runs midnight–4:30am every night
  1002 Priya  — The Moderate: +5% baseline, normal AC usage
  1003 Wei Ming — The Champion: -12% baseline, efficient AC (off by 10pm)
  1004-1010   — Background households: default pattern
"""

import random
from datetime import datetime, timedelta, timezone

from app.data.households import HOUSEHOLDS, NEIGHBORHOOD_ID

_SGT = timezone(timedelta(hours=8))
_TARIFF = 0.2911
_CARBON = 0.402
_PEAK_SLOTS = range(36, 46)

# Persona multipliers (overall kWh scaling)
_PERSONA_MULTIPLIER: dict[int, float] = {
    1001: 1.40,   # Waster — heavy usage
    1002: 1.05,   # Moderate — slightly above average
    1003: 0.88,   # Champion — efficient
}

# 1001 runs AC midnight–4:30am (slots 0–9) adding significant kWh
_WASTER_NIGHT_SLOTS: set[int] = set(range(0, 10))
_WASTER_NIGHT_BOOST = 1.1   # extra kWh per night slot (heavy AC)


def _kwh_for_slot(slot_idx: int, is_weekend: bool, household_id: int) -> float:
    # Base consumption by time-of-day
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

    # Waster: heavy AC running at night
    if household_id == 1001 and slot_idx in _WASTER_NIGHT_SLOTS:
        base += _WASTER_NIGHT_BOOST

    # Apply persona multiplier
    multiplier = _PERSONA_MULTIPLIER.get(household_id, 1.0)
    return round(base * multiplier, 3)


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
            for slot in range(48):
                hours, mins = divmod(slot * 30, 60)
                ts = day.replace(hour=hours, minute=mins)
                kwh = _kwh_for_slot(slot, is_weekend, hid)
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
