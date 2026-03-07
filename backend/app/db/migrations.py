"""
Run all DDL statements to create ClickHouse tables.

Usage:
    uv run python -m app.db.migrations

Tables created in dependency order:
  1. sp_energy_intervals      MergeTree          — raw SP half-hourly data
  2. ac_readings              MergeTree          — AC appliance readings
  3. energy_features          ReplacingMergeTree — computed baselines (no ALTER UPDATE)
  4. habit_events             MergeTree          — habit tracking (append-only)
  5. reward_transactions      MergeTree          — reward ledger (append-only)
  6. device_actions           MergeTree          — device action log (append-only)
  7. neighborhood_rollup      AggregatingMergeTree — pre-aggregated MV target
  8. neighborhood_rollup_mv   Materialized View  — auto-updates on sp_energy_intervals insert

ClickHouse best practices applied:
  - ORDER BY: low → high cardinality on all tables
  - LowCardinality(String) for all low-unique-count string columns
  - UInt8/UInt16/UInt32 minimum bitwidth
  - No Nullable columns — DEFAULT values used throughout
  - Monthly PARTITION BY toYYYYMM(...) — bounded partition count
  - ReplacingMergeTree(version_ts) for energy_features — no ALTER TABLE UPDATE
"""

from app.db.client import get_client

_DDLS: list[tuple[str, str]] = [
    (
        "sp_energy_intervals",
        """
        CREATE TABLE IF NOT EXISTS sp_energy_intervals
        (
            household_id    UInt32,
            neighborhood_id LowCardinality(String),
            flat_type       LowCardinality(String),
            ts              DateTime('Asia/Singapore'),
            interval_date   Date     MATERIALIZED toDate(ts),
            slot_idx        UInt8    MATERIALIZED (toHour(ts) * 2 + intDiv(toMinute(ts), 30)),
            kwh             Decimal(8,3),
            cost_sgd        Decimal(8,4),
            carbon_kg       Decimal(8,4),
            peak_flag       Bool     DEFAULT 0,
            dr_event_flag   Bool     DEFAULT 0,
            ingestion_ts    DateTime DEFAULT now()
        )
        ENGINE = MergeTree
        PARTITION BY toYYYYMM(interval_date)
        ORDER BY (neighborhood_id, household_id, interval_date, ts)
        """,
    ),
    (
        "ac_readings",
        """
        CREATE TABLE IF NOT EXISTS ac_readings
        (
            household_id  UInt32,
            device_id     LowCardinality(String),
            ts            DateTime('Asia/Singapore'),
            reading_date  Date     MATERIALIZED toDate(ts),
            slot_idx      UInt8    MATERIALIZED (toHour(ts) * 2 + intDiv(toMinute(ts), 30)),
            power_w       Float32,
            kwh           Decimal(8,3),
            temp_setting_c UInt8,
            is_on         Bool,
            mode          LowCardinality(String) DEFAULT 'cool',
            ingestion_ts  DateTime               DEFAULT now()
        )
        ENGINE = MergeTree
        PARTITION BY toYYYYMM(reading_date)
        ORDER BY (household_id, device_id, reading_date, ts)
        """,
    ),
    (
        "energy_features",
        """
        CREATE TABLE IF NOT EXISTS energy_features
        (
            household_id  UInt32,
            ts            DateTime('Asia/Singapore'),
            interval_date Date,
            slot_idx      UInt8,
            baseline_kwh  Decimal(8,3),
            excess_kwh    Decimal(8,3),
            anomaly_score Float32,
            shiftable     Bool,
            version_ts    DateTime DEFAULT now()
        )
        ENGINE = ReplacingMergeTree(version_ts)
        PARTITION BY toYYYYMM(interval_date)
        ORDER BY (household_id, interval_date, ts)
        """,
    ),
    (
        "habit_events",
        """
        CREATE TABLE IF NOT EXISTS habit_events
        (
            household_id  UInt32,
            habit_type    LowCardinality(String),
            event_date    Date,
            achieved      Bool,
            threshold_kwh Decimal(8,3),
            actual_kwh    Decimal(8,3),
            streak_day    UInt16,
            ingestion_ts  DateTime DEFAULT now()
        )
        ENGINE = MergeTree
        PARTITION BY toYYYYMM(event_date)
        ORDER BY (household_id, event_date, habit_type)
        """,
    ),
    (
        "reward_transactions",
        """
        CREATE TABLE IF NOT EXISTS reward_transactions
        (
            household_id  UInt32,
            reward_type   LowCardinality(String),
            points_earned UInt32,
            reason        String,
            voucher_label String   DEFAULT '',
            created_at    DateTime DEFAULT now()
        )
        ENGINE = MergeTree
        PARTITION BY toYYYYMM(created_at)
        ORDER BY (household_id, created_at)
        """,
    ),
    (
        "device_actions",
        """
        CREATE TABLE IF NOT EXISTS device_actions
        (
            household_id        UInt32,
            device_id           LowCardinality(String),
            action_type         LowCardinality(String),
            params_json         String,
            status              LowCardinality(String) DEFAULT 'scheduled',
            projected_kwh_saved Decimal(8,3),
            projected_sgd_saved Decimal(8,4),
            created_at          DateTime               DEFAULT now()
        )
        ENGINE = MergeTree
        PARTITION BY toYYYYMM(created_at)
        ORDER BY (household_id, created_at)
        """,
    ),
    (
        "neighborhood_rollup",
        """
        CREATE TABLE IF NOT EXISTS neighborhood_rollup
        (
            neighborhood_id LowCardinality(String),
            interval_date   Date,
            slot_idx        UInt8,
            total_kwh       AggregateFunction(sum,  Decimal(12,3)),
            active_homes    AggregateFunction(uniq, UInt32)
        )
        ENGINE = AggregatingMergeTree
        PARTITION BY toYYYYMM(interval_date)
        ORDER BY (neighborhood_id, interval_date, slot_idx)
        """,
    ),
    (
        "neighborhood_rollup_mv",
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS neighborhood_rollup_mv
        TO neighborhood_rollup AS
        SELECT
            neighborhood_id,
            interval_date,
            slot_idx,
            sumState(CAST(kwh AS Decimal(12,3)))  AS total_kwh,
            uniqState(household_id)               AS active_homes
        FROM sp_energy_intervals
        GROUP BY neighborhood_id, interval_date, slot_idx
        """,
    ),
]


def run_all() -> None:
    import os
    db = os.environ.get("CLICKHOUSE_DB", "default")
    client = get_client()
    client.command(f"CREATE DATABASE IF NOT EXISTS {db}")
    print(f"[migrations] OK: database {db}")
    for name, ddl in _DDLS:
        client.command(ddl.strip())
        print(f"[migrations] OK: {name}")
    print("[migrations] All DDLs applied.")


if __name__ == "__main__":
    run_all()
