"""
Simulate real-time AC readings for household 1001 by replaying last 48 slots.

POSTs each reading to /api/ingest/ac-reading with 0.5s delay.
Prints live output showing anomaly detection.

Usage:
    uv run python -m scripts.simulate_realtime [--host http://localhost:8000]
"""

import argparse
import sys
import time
from datetime import datetime, timedelta, timezone

import httpx

_SGT = timezone(timedelta(hours=8))
_ANOMALY_SLOTS = {4, 5}
_ANOMALY_KWH_THRESHOLD = 0.5


def _slot_label(slot: int) -> str:
    h, m = divmod(slot * 30, 60)
    return f"{h:02d}:{m:02d}"


def _is_anomaly(slot: int, kwh: float, is_on: bool) -> bool:
    return slot in _ANOMALY_SLOTS and is_on and kwh > _ANOMALY_KWH_THRESHOLD


def simulate(host: str = "http://localhost:8000") -> None:
    from scripts.generate_sp_data import generate_sp_data
    from scripts.generate_ac_data import generate_ac_data

    print("Generating data for simulation...")
    sp_rows = generate_sp_data()
    ac_rows = generate_ac_data(sp_rows)

    today = datetime.now(_SGT).replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(days=1)

    # Filter to yesterday's 48 slots for household 1001
    target_rows = [
        r for r in ac_rows
        if r["household_id"] == 1001 and r["ts"].date() == yesterday.date()
    ]
    target_rows.sort(key=lambda r: r["ts"])

    print(f"Replaying {len(target_rows)} slots for household 1001 ({yesterday.date()})...")
    print("-" * 60)

    url = f"{host}/api/ingest/ac-reading"
    with httpx.Client(timeout=5.0) as client:
        for row in target_rows:
            slot = row["ts"].hour * 2 + row["ts"].minute // 30
            label = _slot_label(slot)
            state = "ON " if row["is_on"] else "OFF"
            anomaly_flag = " ANOMALY" if _is_anomaly(slot, float(row["kwh"]), row["is_on"]) else ""

            payload = {
                "household_id": row["household_id"],
                "device_id": row["device_id"],
                "ts": row["ts"].isoformat(),
                "power_w": row["power_w"],
                "kwh": float(row["kwh"]),
                "temp_setting_c": row["temp_setting_c"],
                "is_on": row["is_on"],
                "mode": row["mode"],
            }

            try:
                resp = client.post(url, json=payload)
                resp.raise_for_status()
                result = resp.json()
                flush_note = " [FLUSHED]" if result.get("flushed") else f" [buf={result.get('buffered')}]"
            except httpx.HTTPError as e:
                print(f"[{label}] HTTP error: {e}", file=sys.stderr)
                flush_note = " [ERROR]"

            kwh_str = f"{float(row['kwh']):.3f} kWh"
            print(f"[{label}] AC: {state}, {kwh_str}{anomaly_flag}{flush_note}")
            time.sleep(0.5)

    print("-" * 60)
    print("Simulation complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulate real-time AC readings")
    parser.add_argument("--host", default="http://localhost:8000", help="API base URL")
    args = parser.parse_args()
    simulate(args.host)
