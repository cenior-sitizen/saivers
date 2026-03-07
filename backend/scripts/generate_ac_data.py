"""
Generate 43,200 AC appliance sensor rows correlated with SP data.

10 households x 90 days x 48 slots/day = 43,200 rows

is_on = True when slot 36-47 AND sp_kwh > 0.5
ANOMALY for household 1001, last 21 days: is_on=True at slots 4-5
"""

import random
from datetime import datetime, timedelta, timezone

from app.data.households import DEVICE_ID, HOUSEHOLDS

_SGT = timezone(timedelta(hours=8))
_ANOMALY_HOUSEHOLD = 1001
_ANOMALY_SLOTS = {4, 5}
_AC_ON_SLOTS = set(range(36, 48))


def generate_ac_data(sp_rows: list[dict]) -> list[dict]:
    random.seed(43)
    sp_lookup: dict[tuple, float] = {
        (r["household_id"], r["ts"]): float(r["kwh"]) for r in sp_rows
    }

    today = datetime.now(_SGT).replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = today - timedelta(days=89)

    rows: list[dict] = []
    for household in HOUSEHOLDS:
        hid = household["household_id"]
        for day_offset in range(90):
            day = start_date + timedelta(days=day_offset)
            is_anomaly_period = day_offset >= 69
            for slot in range(48):
                hours, mins = divmod(slot * 30, 60)
                ts = day.replace(hour=hours, minute=mins)
                sp_kwh = sp_lookup.get((hid, ts), 0.0)

                normal_on = slot in _AC_ON_SLOTS and sp_kwh > 0.5
                anomaly_on = is_anomaly_period and hid == _ANOMALY_HOUSEHOLD and slot in _ANOMALY_SLOTS
                is_on = normal_on or anomaly_on

                temp_setting_c = random.randint(23, 26) if is_on else 0
                power_w = round(sp_kwh * 2000, 1) if is_on else 0.0
                kwh_val = round(sp_kwh * 0.75, 3) if is_on else 0.0

                rows.append(
                    {
                        "household_id": hid,
                        "device_id": DEVICE_ID,
                        "ts": ts,
                        "power_w": power_w,
                        "kwh": kwh_val,
                        "temp_setting_c": temp_setting_c,
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
    anomaly_rows = [r for r in ac_rows if r["household_id"] == 1001 and r["is_on"] and r["ts"].hour < 4]
    print(f"Anomaly rows (hh=1001, is_on, hour<4): {len(anomaly_rows)}")
