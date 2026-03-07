"""
Seed ac_readings for the 3 missing room device IDs.

ac-living-room is already seeded by seed_clickhouse.py.
This script adds: ac-master-room, ac-room-1, ac-room-2.

Each room has a distinct usage pattern (slot ranges + kwh fraction):
  ac-master-room : slots 40-47  (8pm-midnight)  — kwh * 0.65
  ac-room-1      : slots 42-47  (9pm-midnight)  — kwh * 0.50
  ac-room-2      : slots 38-47  (7pm-midnight)  — kwh * 0.60

10 households x 3 rooms x 90 days x 48 slots = 129,600 rows total.
Inserted in batches of 10,000 (per ClickHouse insert-batch-size best practice).

Usage:
    PYTHONPATH=. uv run python scripts/seed_ac_multiroom.py
"""

import random
from datetime import datetime, timedelta, timezone

from app.data.households import HOUSEHOLDS
from app.db.client import get_client

_SGT = timezone(timedelta(hours=8))
_ANOMALY_HOUSEHOLD = 1001
_ANOMALY_SLOTS = {4, 5}

# Per-room config: (device_id, on_slots, kwh_fraction)
ROOM_CONFIGS = [
    ("ac-master-room", set(range(40, 48)), 0.65),
    ("ac-room-1",      set(range(42, 48)), 0.50),
    ("ac-room-2",      set(range(38, 48)), 0.60),
]

# Approx sp kwh per slot (mirrors generate_sp_data.py medians)
_PEAK_KWH = 0.80   # rough average for peak slots
_BASE_KWH = 0.05


def _approx_sp_kwh(slot: int, day_offset: int, hid: int) -> float:
    """Approximate SP kwh for a given slot (avoids re-generating full SP dataset)."""
    random.seed(hid * 10000 + day_offset * 100 + slot)
    if slot in range(36, 46):
        return random.uniform(0.50, 1.40)
    elif slot in range(14, 36):
        return random.uniform(0.10, 0.30)
    else:
        return random.uniform(0.03, 0.08)


def generate_multiroom_rows() -> list[dict]:
    random.seed(77)

    today = datetime.now(_SGT).replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = today - timedelta(days=89)

    rows: list[dict] = []
    for device_id, on_slots, kwh_fraction in ROOM_CONFIGS:
        for household in HOUSEHOLDS:
            hid = household["household_id"]
            for day_offset in range(90):
                day = start_date + timedelta(days=day_offset)
                is_anomaly_period = day_offset >= 69  # last 21 days
                for slot in range(48):
                    hours, mins = divmod(slot * 30, 60)
                    ts = day.replace(hour=hours, minute=mins)

                    sp_kwh = _approx_sp_kwh(slot, day_offset, hid)
                    normal_on = slot in on_slots and sp_kwh > 0.4
                    anomaly_on = (
                        is_anomaly_period
                        and hid == _ANOMALY_HOUSEHOLD
                        and slot in _ANOMALY_SLOTS
                    )
                    is_on = normal_on or anomaly_on

                    temp_setting_c = random.randint(23, 26) if is_on else 0
                    kwh_val = round(sp_kwh * kwh_fraction, 3) if is_on else 0.0
                    power_w = round(kwh_val * 2000, 1)

                    rows.append(
                        {
                            "household_id":  hid,
                            "device_id":     device_id,
                            "ts":            ts,
                            "power_w":       power_w,
                            "kwh":           kwh_val,
                            "temp_setting_c": temp_setting_c,
                            "is_on":         is_on,
                            "mode":          "cool",
                        }
                    )
    return rows


_COLUMNS = ["household_id", "device_id", "ts", "power_w", "kwh", "temp_setting_c", "is_on", "mode"]


def insert_rows(rows: list[dict], batch_size: int = 10_000) -> None:
    client = get_client()
    total = len(rows)
    inserted = 0
    for start in range(0, total, batch_size):
        batch = rows[start : start + batch_size]
        data = [[row[col] for col in _COLUMNS] for row in batch]
        client.insert("ac_readings", data, column_names=_COLUMNS)
        inserted += len(batch)
        print(f"  Inserted {inserted:,}/{total:,} rows...")


if __name__ == "__main__":
    print("Generating multi-room AC rows...")
    rows = generate_multiroom_rows()
    print(f"Generated {len(rows):,} rows for {len(ROOM_CONFIGS)} device IDs")

    print("Inserting into ClickHouse...")
    insert_rows(rows)
    print("Done.")

    # Quick verification
    client = get_client()
    result = client.query(
        "SELECT device_id, count() AS cnt FROM ac_readings "
        "WHERE device_id != 'ac-living-room' "
        "GROUP BY device_id ORDER BY device_id"
    )
    print("\nVerification (new device_ids):")
    for row in result.named_results():
        print(f"  {row['device_id']}: {row['cnt']:,} rows")
