"""
Generate AC appliance sensor rows matched to household personas.

10 households x 90 days x 48 slots/day = 43,200 rows

Demo personas:
  1001 Ahmad   — Waster:   AC on 6pm–5am at 20°C  (aggressive overnight cooling)
  1002 Priya   — Moderate: AC on 6pm–midnight at 24°C  (reasonable but no auto-off)
  1003 Wei Ming — Champion: AC on 6pm–10pm at 26°C  (responsible, off before bed)
  1004-1010    — Default:   AC on 6pm–midnight at 24°C  (same as Moderate)

Power formula (from AC simulator): base_w = (30 - temp_c) * 50 + 400
  20°C → ~900W  |  24°C → ~700W  |  26°C → ~600W
"""

import random
from datetime import datetime, timedelta, timezone

from app.data.households import DEVICE_ID, HOUSEHOLDS

_SGT = timezone(timedelta(hours=8))

# Persona AC profiles: which slots the AC is on, and at what temperature
_PERSONA_AC: dict[int, dict] = {
    1001: {
        # Waster: 6pm–midnight (slots 36-47) + midnight–4:30am (slots 0-9) = all night
        "on_slots": set(range(36, 48)) | set(range(0, 10)),
        "temp_c": 20,
    },
    1002: {
        # Moderate: 6pm–midnight only (slots 36-47)
        "on_slots": set(range(36, 48)),
        "temp_c": 24,
    },
    1003: {
        # Champion: 6pm–10pm only (slots 36-43), off before bed
        "on_slots": set(range(36, 44)),
        "temp_c": 26,
    },
}
_DEFAULT_AC = {
    "on_slots": set(range(36, 48)),
    "temp_c": 24,
}


def _power_kwh(temp_c: int) -> tuple[float, float]:
    """Compute realistic power draw and kWh for a 30-min slot at given temperature."""
    base_w = (30 - temp_c) * 50 + 400
    power_w = round(base_w * random.uniform(0.95, 1.05), 1)
    kwh = round(power_w / 1000 * 0.5, 3)  # 30-min slot
    return power_w, kwh


def generate_ac_data(sp_rows: list[dict]) -> list[dict]:
    random.seed(43)

    today = datetime.now(_SGT).replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = today - timedelta(days=89)

    rows: list[dict] = []
    for household in HOUSEHOLDS:
        hid = household["household_id"]
        profile = _PERSONA_AC.get(hid, _DEFAULT_AC)
        on_slots = profile["on_slots"]
        temp_c = profile["temp_c"]

        for day_offset in range(90):
            day = start_date + timedelta(days=day_offset)
            for slot in range(48):
                hours, mins = divmod(slot * 30, 60)
                ts = day.replace(hour=hours, minute=mins)
                is_on = slot in on_slots

                if is_on:
                    power_w, kwh_val = _power_kwh(temp_c)
                    t = temp_c + random.randint(-1, 1)  # ±1°C variation
                else:
                    power_w = 0.0
                    kwh_val = 0.0
                    t = 0

                rows.append(
                    {
                        "household_id": hid,
                        "device_id": DEVICE_ID,
                        "ts": ts,
                        "power_w": power_w,
                        "kwh": kwh_val,
                        "temp_setting_c": t,
                        "is_on": is_on,
                        "mode": "cool",
                    }
                )
    return rows


if __name__ == "__main__":
    from scripts.generate_sp_data import generate_sp_data

    sp_rows = generate_sp_data()
    ac_rows = generate_ac_data(sp_rows)
    print(f"Generated {len(ac_rows):,} AC reading rows")

    for hid, label in [(1001, "Waster"), (1002, "Moderate"), (1003, "Champion")]:
        night_on = [r for r in ac_rows if r["household_id"] == hid and r["is_on"] and r["ts"].hour < 5]
        week_on = [r for r in ac_rows if r["household_id"] == hid and r["is_on"]]
        print(f"  {hid} ({label}): {len(night_on)} night slots ON, {len(week_on)} total ON slots")
