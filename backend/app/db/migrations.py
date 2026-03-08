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
            points_earned Int32,   -- signed: negative for voucher redemptions
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
        "weekly_recommendations",
        """
        CREATE TABLE IF NOT EXISTS weekly_recommendations
        (
            household_id  UInt32,
            iso_week      LowCardinality(String),  -- e.g. "2026-W10"
            rec_id        String,                   -- UUID4; primary lookup for apply
            device_id     LowCardinality(String),   -- room-level: "ac-living-room"
            current_temp  UInt8,
            rec_temp      UInt8,
            current_mode  LowCardinality(String),
            rec_mode      LowCardinality(String),
            reason        String,
            ai_summary    String DEFAULT '',
            created_at    DateTime DEFAULT now()
        )
        ENGINE = MergeTree
        ORDER BY (household_id, iso_week, rec_id)
        -- No PARTITION BY: table stays <1K rows (10 households x 52 weeks x 4 rooms)
        """,
    ),
    (
        "applied_recommendations",
        """
        CREATE TABLE IF NOT EXISTS applied_recommendations
        (
            household_id  UInt32,
            rec_id        String,
            action_id     String,
            applied_at    DateTime DEFAULT now(),
            new_temp      UInt8,
            new_mode      LowCardinality(String)
        )
        ENGINE = MergeTree
        ORDER BY (household_id, rec_id, applied_at)
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
        "weekly_insights",
        """
        CREATE TABLE IF NOT EXISTS weekly_insights
        (
            insight_id          String,
            household_id        UInt32,
            week_start          Date,
            generated_at        DateTime('Asia/Singapore'),
            signal_type         LowCardinality(String),
            ac_night_anomaly    Bool           DEFAULT 0,
            nights_observed     UInt8          DEFAULT 0,
            weekly_increase     Bool           DEFAULT 0,
            this_week_kwh       Decimal(8,3),
            last_week_kwh       Decimal(8,3),
            change_pct          Float32,
            weekly_cost_sgd     Decimal(8,4),
            weekly_carbon_kg    Decimal(8,4),
            ai_summary          String,
            recommendation_type LowCardinality(String)  DEFAULT '',
            recommendation_json String                  DEFAULT '{}',
            notification_title  String,
            notification_body   String,
            status              LowCardinality(String)  DEFAULT 'unread',
            updated_at          DateTime('Asia/Singapore') DEFAULT now()
        )
        ENGINE = ReplacingMergeTree(updated_at)
        PARTITION BY toYYYYMM(week_start)
        ORDER BY (household_id, week_start, insight_id)
        """,
    ),
    (
        "focus_actions",
        """
        CREATE TABLE IF NOT EXISTS focus_actions
        (
            action_id            String,
            household_id         UInt32,
            week_start           Date,
            action_title         String,
            action_subtitle      String,
            category             LowCardinality(String)  DEFAULT 'habit',
            potential_saving_sgd Decimal(6,2)            DEFAULT 0,
            why_headline         String,
            why_body             String,
            how_steps_json       String                  DEFAULT '[]',
            effort_level         LowCardinality(String)  DEFAULT 'low',
            impact_level         LowCardinality(String)  DEFAULT 'medium',
            updated_at           DateTime('Asia/Singapore') DEFAULT now()
        )
        ENGINE = ReplacingMergeTree(updated_at)
        PARTITION BY toYYYYMM(week_start)
        ORDER BY (household_id, week_start, action_id)
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
