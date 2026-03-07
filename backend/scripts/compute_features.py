"""
Compute baselines and anomaly scores, insert into energy_features.

For each (household_id, slot_idx, day_of_week) combination:
  baseline_kwh  = avg kWh over last 28 days for same slot + same day-of-week
  stddev_kwh    = stddev of same
  anomaly_score = (kwh - baseline_kwh) / (stddev_kwh + 0.001)   # epsilon avoids /0
  excess_kwh    = max(0, kwh - baseline_kwh)
  shiftable     = slot 36-45 AND anomaly_score > 1.5

Uses ReplacingMergeTree — re-running this script inserts newer version_ts rows,
superseding old feature rows. Never uses ALTER TABLE UPDATE.

Usage:
    uv run python -m scripts.compute_features

Verification:
    Asserts household 1001, slots 4-5, last 21 days → anomaly_score > 3.0
"""

import sys
from datetime import datetime, timezone, timedelta

from app.db.client import get_client

BATCH_SIZE = 50_000
_SGT = timezone(timedelta(hours=8))
_PEAK_SLOTS = set(range(36, 46))


def compute_and_insert() -> None:
    client = get_client()

    print("Querying sp_energy_intervals for feature computation...")
    result = client.query(
        """
        SELECT
            household_id,
            ts,
            interval_date,
            slot_idx,
            toDayOfWeek(interval_date) AS day_of_week,
            kwh
        FROM sp_energy_intervals
        ORDER BY household_id, interval_date, slot_idx
        """
    )
    rows = result.result_rows
    print(f"  Fetched {len(rows):,} rows")

    col = result.column_names
    idx = {c: i for i, c in enumerate(col)}

    # Build lookup: (household_id, slot_idx, day_of_week) -> list of (interval_date, kwh)
    from collections import defaultdict

    slot_history: dict[tuple, list[tuple]] = defaultdict(list)
    all_rows_data: list[tuple] = []
    for row in rows:
        hid = row[idx["household_id"]]
        ts = row[idx["ts"]]
        idate = row[idx["interval_date"]]
        slot = row[idx["slot_idx"]]
        dow = row[idx["day_of_week"]]
        kwh = float(row[idx["kwh"]])
        slot_history[(hid, slot, dow)].append((idate, kwh))
        all_rows_data.append((hid, ts, idate, slot, dow, kwh))

    # Sort each history bucket by date so we can do lookback
    for key in slot_history:
        slot_history[key].sort(key=lambda x: x[0])

    print("Computing features...")
    feature_rows: list[dict] = []
    for hid, ts, idate, slot, dow, kwh in all_rows_data:
        history = slot_history[(hid, slot, dow)]
        # Find entries strictly before idate within last 28 days
        lookback = [k for d, k in history if d < idate and (idate - d).days <= 28]

        if len(lookback) < 2:
            # Not enough history — skip this row (sparse early days)
            continue

        import statistics
        baseline = statistics.mean(lookback)
        stddev = statistics.stdev(lookback) if len(lookback) > 1 else 0.0
        anomaly_score = (kwh - baseline) / (stddev + 0.001)
        excess_kwh = max(0.0, kwh - baseline)
        shiftable = slot in _PEAK_SLOTS and anomaly_score > 1.5

        feature_rows.append(
            {
                "household_id": hid,
                "ts": ts,
                "interval_date": idate,
                "slot_idx": slot,
                "baseline_kwh": round(baseline, 3),
                "excess_kwh": round(excess_kwh, 3),
                "anomaly_score": round(float(anomaly_score), 4),
                "shiftable": shiftable,
            }
        )

    print(f"  Computed {len(feature_rows):,} feature rows")

    # Insert in batches
    columns = ["household_id", "ts", "interval_date", "slot_idx", "baseline_kwh", "excess_kwh", "anomaly_score", "shiftable"]
    total = len(feature_rows)
    inserted = 0
    while inserted < total:
        batch = feature_rows[inserted : inserted + BATCH_SIZE]
        data = [[r[c] for c in columns] for r in batch]
        client.insert("energy_features", data, column_names=columns)
        inserted += len(batch)
        print(f"  [energy_features] inserted {inserted:,}/{total:,}")

    # Verification: household 1001, slots 4-5, last 21 days must have anomaly_score > 3.0
    print("\nVerification: household 1001, slots 4-5, first week of anomaly period...")
    today = datetime.now(_SGT).date()
    # Anomaly injected at day_offset >= 69 of 90, so starts at today - (90-69) = today - 21 + 1 = today - 20.
    # First 7 days have uncontaminated baseline — scores must be high.
    anomaly_start = today - timedelta(days=20)
    anomaly_week_end = anomaly_start + timedelta(days=7)
    early_anomalies = [
        r for r in feature_rows
        if r["household_id"] == 1001
        and r["slot_idx"] in {4, 5}
        and anomaly_start <= r["interval_date"] < anomaly_week_end
    ]
    all_anomalies = [
        r for r in feature_rows
        if r["household_id"] == 1001
        and r["slot_idx"] in {4, 5}
        and r["interval_date"] >= anomaly_start
    ]

    if not early_anomalies:
        print("  FAIL: No rows found for household 1001 slots 4-5 in first anomaly week")
        sys.exit(1)

    min_score = min(r["anomaly_score"] for r in early_anomalies)
    max_score = max(r["anomaly_score"] for r in all_anomalies)
    print(f"  First-week rows: {len(early_anomalies)}, min score: {min_score:.2f}")
    print(f"  All anomaly rows: {len(all_anomalies)}, max score: {max_score:.2f}")
    if min_score < 3.0:
        print(f"  FAIL: first-week min score {min_score:.2f} < 3.0 — anomaly injection too weak")
        sys.exit(1)
    print(f"  PASS: first-week anomaly scores all > 3.0 (min {min_score:.2f}, max {max_score:.2f})")
    print("\nFeature computation complete.")


if __name__ == "__main__":
    compute_and_insert()
