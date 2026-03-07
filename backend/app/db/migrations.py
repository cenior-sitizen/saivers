"""
ClickHouse schema migration script.
Run once to create all tables and materialized views.

Usage:
    uv run python -m app.db.migrations
"""

import os
from dotenv import load_dotenv
import clickhouse_connect

load_dotenv()

DDL_STATEMENTS = [
    # Table 1: SP Group half-hourly intervals
    """
    CREATE TABLE IF NOT EXISTS sp_energy_intervals (
        household_id    UInt32,
        neighborhood_id LowCardinality(String),
        flat_type       LowCardinality(String),
        ts              DateTime('Asia/Singapore'),
        interval_date   Date MATERIALIZED toDate(ts),
        slot_idx        UInt8 MATERIALIZED (toHour(ts)*2 + intDiv(toMinute(ts),30)),
        kwh             Decimal(8,3),
        cost_sgd        Decimal(8,4),
        carbon_kg       Decimal(8,4),
        peak_flag       Bool DEFAULT 0,
        dr_event_flag   Bool DEFAULT 0,
        ingestion_ts    DateTime DEFAULT now()
    ) ENGINE = MergeTree
    PARTITION BY toYYYYMM(interval_date)
    ORDER BY (household_id, interval_date, ts)
    """,

    # Table 2: AC appliance readings
    """
    CREATE TABLE IF NOT EXISTS ac_readings (
        household_id    UInt32,
        device_id       LowCardinality(String),
        ts              DateTime('Asia/Singapore'),
        reading_date    Date MATERIALIZED toDate(ts),
        slot_idx        UInt8 MATERIALIZED (toHour(ts)*2 + intDiv(toMinute(ts),30)),
        power_w         Float32,
        kwh             Decimal(8,3),
        temp_setting_c  UInt8,
        is_on           Bool,
        mode            LowCardinality(String) DEFAULT 'cool',
        ingestion_ts    DateTime DEFAULT now()
    ) ENGINE = MergeTree
    PARTITION BY toYYYYMM(reading_date)
    ORDER BY (household_id, device_id, reading_date, ts)
    """,

    # Table 3: Computed features/baselines
    """
    CREATE TABLE IF NOT EXISTS energy_features (
        household_id    UInt32,
        ts              DateTime('Asia/Singapore'),
        interval_date   Date,
        slot_idx        UInt8,
        baseline_kwh    Decimal(8,3),
        excess_kwh      Decimal(8,3),
        anomaly_score   Float32,
        shiftable       Bool,
        version_ts      DateTime DEFAULT now()
    ) ENGINE = ReplacingMergeTree(version_ts)
    PARTITION BY toYYYYMM(interval_date)
    ORDER BY (household_id, interval_date, ts)
    """,

    # Table 4: Habit tracking
    """
    CREATE TABLE IF NOT EXISTS habit_events (
        household_id    UInt32,
        habit_type      LowCardinality(String),
        event_date      Date,
        achieved        Bool,
        threshold_kwh   Decimal(8,3),
        actual_kwh      Decimal(8,3),
        streak_day      UInt16,
        ingestion_ts    DateTime DEFAULT now()
    ) ENGINE = MergeTree
    PARTITION BY toYYYYMM(event_date)
    ORDER BY (household_id, event_date, habit_type)
    """,

    # Table 5: Reward transactions
    """
    CREATE TABLE IF NOT EXISTS reward_transactions (
        transaction_id  UUID DEFAULT generateUUIDv4(),
        household_id    UInt32,
        reward_type     LowCardinality(String),
        points_earned   Int32,
        reason          String,
        voucher_code    String DEFAULT '',
        created_at      DateTime DEFAULT now()
    ) ENGINE = MergeTree
    ORDER BY (household_id, created_at)
    """,

    # Table 6: Device actions log
    """
    CREATE TABLE IF NOT EXISTS device_actions (
        action_id            UUID DEFAULT generateUUIDv4(),
        household_id         UInt32,
        device_id            LowCardinality(String),
        action_type          LowCardinality(String),
        params               String,
        status               LowCardinality(String) DEFAULT 'scheduled',
        projected_kwh_saved  Decimal(8,3),
        projected_sgd_saved  Decimal(8,4),
        created_at           DateTime DEFAULT now()
    ) ENGINE = MergeTree
    ORDER BY (household_id, created_at)
    """,

    # Table 7: Neighbourhood rollup (AggregatingMergeTree)
    """
    CREATE TABLE IF NOT EXISTS neighborhood_rollup (
        neighborhood_id LowCardinality(String),
        interval_date   Date,
        slot_idx        UInt8,
        total_kwh       AggregateFunction(sum, Decimal(12,3)),
        homes           AggregateFunction(uniq, UInt32)
    ) ENGINE = AggregatingMergeTree
    PARTITION BY toYYYYMM(interval_date)
    ORDER BY (neighborhood_id, interval_date, slot_idx)
    """,

    # Materialized view for neighbourhood rollup
    """
    CREATE MATERIALIZED VIEW IF NOT EXISTS neighborhood_rollup_mv
    TO neighborhood_rollup AS
    SELECT
        neighborhood_id,
        interval_date,
        slot_idx,
        sumState(kwh)             AS total_kwh,
        uniqState(household_id)   AS homes
    FROM sp_energy_intervals
    GROUP BY neighborhood_id, interval_date, slot_idx
    """,
]


def run_migrations() -> None:
    host = os.getenv("CLICKHOUSE_HOST", "").replace("https://", "").replace("http://", "")
    user = os.getenv("CLICKHOUSE_USER", "default")
    password = os.getenv("CLICKHOUSE_PASSWORD", "")
    database = os.getenv("CLICKHOUSE_DB", "wattcoach")

    if not host or host == "xxx.clickhouse.cloud":
        print("ERROR: Set CLICKHOUSE_HOST in .env before running migrations.")
        return

    print(f"Connecting to ClickHouse: {host} / db={database}")
    client = clickhouse_connect.get_client(
        host=host,
        user=user,
        port=443,
        password=password,
        database=database,
        secure=True,
    )

    for i, ddl in enumerate(DDL_STATEMENTS, start=1):
        statement = ddl.strip()
        preview = statement.split("\n")[0][:80]
        print(f"[{i}/{len(DDL_STATEMENTS)}] {preview} ...")
        client.command(statement)
        print(f"  OK")

    print("\nAll migrations complete.")

    # Verify tables exist
    result = client.query("SHOW TABLES")
    tables = [row[0] for row in result.result_rows]
    print(f"\nTables in '{database}': {tables}")


if __name__ == "__main__":
    run_migrations()
