# Saivers — Database Reference

**Database**: ClickHouse Cloud (GCP `asia-southeast1`)
**Database name**: `saivers`
**Tables**: 11 (including 1 materialized view)

---

## Table Overview

| Table | Engine | Purpose | Seeded Rows |
|---|---|---|---|
| `sp_energy_intervals` | MergeTree | Raw SP half-hourly meter data | 43,200 |
| `ac_readings` | MergeTree | AC appliance readings (30-min slots) | 43,200 |
| `energy_features` | ReplacingMergeTree | Computed baselines & anomaly scores | varies |
| `habit_events` | MergeTree | Daily habit evaluation log | varies |
| `reward_transactions` | MergeTree | Points ledger (append-only) | 33 |
| `device_actions` | MergeTree | AC control action log | varies |
| `weekly_recommendations` | MergeTree | AI-generated weekly AC schedule recommendations | 7 |
| `applied_recommendations` | MergeTree | Log of approved recommendations | varies |
| `weekly_insights` | ReplacingMergeTree | AI-generated weekly household insights | 21 |
| `neighborhood_rollup` | AggregatingMergeTree | Pre-aggregated neighbourhood stats (MV target) | auto |
| `neighborhood_rollup_mv` | Materialized View | Auto-updates on `sp_energy_intervals` insert | — |

---

## Table Schemas

### 1. `sp_energy_intervals` — Raw SP Meter Data

Half-hourly electricity readings from the household master meter. Mirrors what SP Group provides.

```sql
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
```

**Key columns:**
- `slot_idx`: 0–47, computed from `ts` (slot 0 = 00:00–00:30, slot 36 = 18:00–18:30)
- `peak_flag`: marks peak-window slots (7pm–11pm = slots 38–45)
- `kwh`, `cost_sgd`, `carbon_kg`: using tariff S$0.2911/kWh, emission factor 0.402 kg CO2/kWh

**Seeded data:**
- 3 households × 30 days × 48 slots = **43,200 rows**
- Households: 1001 (Punggol, 5-room), 1002 (Jurong West, 4-room), 1003 (Bedok, 3-room)
- Weekly totals: Ahmad ~334 kWh/wk, Priya ~152 kWh/wk, Wei Ming ~125 kWh/wk

---

### 2. `ac_readings` — AC Appliance Readings

30-minute readings from smart air conditioner units, by device and room.

```sql
CREATE TABLE IF NOT EXISTS ac_readings
(
    household_id   UInt32,
    device_id      LowCardinality(String),
    ts             DateTime('Asia/Singapore'),
    reading_date   Date     MATERIALIZED toDate(ts),
    slot_idx       UInt8    MATERIALIZED (toHour(ts) * 2 + intDiv(toMinute(ts), 30)),
    power_w        Float32,
    kwh            Decimal(8,3),
    temp_setting_c UInt8,
    is_on          Bool,
    mode           LowCardinality(String) DEFAULT 'cool',
    ingestion_ts   DateTime               DEFAULT now()
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(reading_date)
ORDER BY (household_id, device_id, reading_date, ts)
```

**Key columns:**
- `device_id`: room-level device identifier (e.g. `ac-master-room`, `ac-living-room`)
- `slot_idx`: same 0–47 scheme as `sp_energy_intervals`
- `is_on`: whether AC was running during this slot
- Power formula: `base_w = (30 - temp_c) * 50 + 400` → range ~400W (30°C) to ~1,100W (16°C)

**Seeded data:**
- 3 households × 30 days × 48 slots = **43,200 rows**
- Ahmad has elevated overnight AC readings (anomaly signal for insights)

---

### 3. `energy_features` — Computed Baselines & Anomalies

Pre-computed per-slot baselines and anomaly scores. Updated by replacing rows (no ALTER UPDATE).

```sql
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
```

**Design note**: `ReplacingMergeTree(version_ts)` — to update a row, insert a new row with the same ORDER BY key and a newer `version_ts`. Always query with `FINAL` to get the latest version.

**`anomaly_score`**: deviation from baseline in units of standard deviations. >2.0 = flagged anomaly.

---

### 4. `habit_events` — Daily Habit Evaluation Log

Append-only log of daily habit evaluations. One row per household per habit type per day.

```sql
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
```

**Habit types:**
- `offpeak_ac`: AC usage below 0.3 kWh during 7pm–11pm peak window (slots 36–45)
- `weekly_reduction`: this week's total kWh < 95% of last week's total

**Streak computation**: query `streak_day` from the latest achieved row per `(household_id, habit_type)`.

---

### 5. `reward_transactions` — Points Ledger

Append-only ledger. Points balance = `SUM(points_earned)` at query time. No UPDATE/DELETE.

```sql
CREATE TABLE IF NOT EXISTS reward_transactions
(
    household_id  UInt32,
    reward_type   LowCardinality(String),
    points_earned Int32,     -- signed: negative for voucher redemptions
    reason        String,
    voucher_label String   DEFAULT '',
    created_at    DateTime DEFAULT now()
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY (household_id, created_at)
```

**Reward types:**
- `streak_points`: daily habit achievement (+20 pts for off-peak AC, +50 pts for weekly reduction)
- `milestone_bonus`: streak milestones (+100 pts at 7 days, +250 pts at 14 days, +500 pts at 30 days)
- `voucher_redeemed`: CDC voucher redemption (−500 pts)

**Voucher threshold**: 500 points = S$5 CDC voucher

**Seeded data (33 rows):**
| Household | Points Balance | Streak |
|---|---|---|
| 1001 Ahmad | 240 | 7 days |
| 1002 Priya | 150 | 4 days |
| 1003 Wei Ming | 480 | 14 days |

---

### 6. `device_actions` — AC Control Action Log

Append-only log of all AC control commands issued (from insights approval, manual control).

```sql
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
```

**Action types:** `ac_schedule`, `ac_temp_change`, `ac_off`

---

### 7. `weekly_recommendations` — Weekly AC Recommendations

AI-generated weekly recommendations per household per room. Small table (<1K rows expected).

```sql
CREATE TABLE IF NOT EXISTS weekly_recommendations
(
    household_id  UInt32,
    iso_week      LowCardinality(String),  -- e.g. "2026-W10"
    rec_id        String,                   -- UUID4
    device_id     LowCardinality(String),   -- e.g. "ac-master-room"
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
-- No PARTITION BY: table stays <1K rows
```

**Seeded data (7 rows for week 2026-W10):**
- Ahmad 1001: 4 rooms recommended 20°C → 25°C
- Priya 1002: 2 rooms recommended 23°C → 25°C
- Wei Ming 1003: 1 room, already optimal at 26°C

---

### 8. `applied_recommendations` — Applied Recommendation Log

Records when a user approves a recommendation and it is applied.

```sql
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
```

---

### 9. `weekly_insights` — AI-Generated Weekly Insights

One insight per household per week. Status lifecycle: `unread` → `read` → `approved` | `dismissed`.

```sql
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
```

**Design note**: `ReplacingMergeTree(updated_at)` — status updates (read/approved/dismissed) are applied by re-inserting the full row with a newer `updated_at`. Always query with `FINAL`.

**`insight_id` format**: `WI-{household_id}-{week_start_as_YYYYMMDD}` (e.g. `WI-1001-20260223`)

**Signal types:**
- `ac_night_anomaly`: AC running late at night above threshold
- `weekly_increase`: total usage increased vs prior week
- `efficient`: usage decreased — positive reinforcement

**`recommendation_json` example:**
```json
{
  "action": "ac_schedule",
  "start_time": "22:00",
  "end_time": "02:00",
  "temp_c": 25,
  "summary": "Set AC to 25°C and auto-off at 2am"
}
```

**Seeded data (21 rows):**
- 3 households × 7 weeks of history
- Ahmad: 3 unread (most recent weeks), mix of `ac_night_anomaly` and `weekly_increase`
- Priya: 1 unread, mix of signals
- Wei Ming: 1 unread, mostly `efficient` signals (positive reinforcement)

---

### 10. `neighborhood_rollup` — Pre-Aggregated Neighbourhood Stats

AggregatingMergeTree target for the materialized view. Stores aggregate states, not final values.

```sql
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
```

**Query pattern** (always use `Merge` suffix functions):
```sql
SELECT
    neighborhood_id,
    slot_idx,
    sumMerge(total_kwh)  AS total_kwh,
    uniqMerge(active_homes) AS active_homes
FROM neighborhood_rollup
WHERE interval_date = today()
GROUP BY neighborhood_id, slot_idx
ORDER BY neighborhood_id, slot_idx
```

---

### 11. `neighborhood_rollup_mv` — Materialized View

Auto-populates `neighborhood_rollup` whenever rows are inserted into `sp_energy_intervals`.

```sql
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
```

---

## Common Query Patterns

### Points balance for a household
```sql
SELECT sum(points_earned) AS balance
FROM reward_transactions
WHERE household_id = 1001
```

### Current streak (latest achieved streak_day)
```sql
SELECT streak_day
FROM habit_events
WHERE household_id = 1001
  AND habit_type = 'offpeak_ac'
  AND achieved = 1
ORDER BY event_date DESC
LIMIT 1
```

### Unread insights for notification bell
```sql
SELECT count() AS unread
FROM weekly_insights FINAL
WHERE household_id = 1001
  AND status = 'unread'
```

### Weekly energy totals (this week vs last week)
```sql
SELECT
    sumIf(kwh, interval_date >= today()-7)                     AS this_week,
    sumIf(kwh, interval_date BETWEEN today()-14 AND today()-8) AS last_week
FROM sp_energy_intervals
WHERE household_id = 1001
```

### Hourly AC usage for chart (day view)
```sql
SELECT
    toHour(ts)        AS hour,
    sum(kwh)          AS total_kwh,
    any(is_on)        AS is_on
FROM ac_readings
WHERE household_id = 1001
  AND reading_date = today()
GROUP BY hour
ORDER BY hour
```

### Update insight status (read/approved/dismissed)
Re-insert the full row with the same `insight_id` and a newer `updated_at`. Do NOT use ALTER UPDATE.
```python
# backend/app/services/weekly_insight_service.py
# update_insight_status(insight_id, new_status) — fetches row, re-inserts with new status + now()
```

---

## Data Seeding

Seed scripts are in `backend/scripts/`. Run locally or via admin endpoint:

```bash
# Generate SP half-hourly data (3 households, 30 days)
uv run python scripts/generate_sp_data.py

# Generate AC readings (3 households, 30 days)
uv run python scripts/generate_ac_data.py

# Seed reward transactions
uv run python scripts/seed_rewards.py

# Generate weekly insights (3 households, 7 weeks)
uv run python scripts/generate_weekly_insights.py
```

Or trigger via admin endpoint (regenerates weekly insights only):
```
POST https://saivers.onrender.com/api/admin/run-weekly-insights
```

---

## LibreChat Integration

LibreChat is the admin-facing AI interface. It connects to ClickHouse via a **ClickHouse MCP server** running as a sidecar container.

### Architecture

```
LibreChat (Docker, port 3080)
    └── MCP Server: clickhouse-default (SSE, port 8001)
            └── ClickHouse Cloud (saivers database)
```

### Setup

1. **Clone LibreChat** (separate from this repo):
   ```bash
   git clone https://github.com/danny-avila/LibreChat.git
   cd LibreChat
   ```

2. **Copy Saivers config files** into LibreChat root:
   ```bash
   cp /path/to/saivers/librechat-config/docker-compose.override.yml .
   cp /path/to/saivers/librechat-config/librechat.yaml .
   ```

3. **Create LibreChat `.env`**:
   ```bash
   cp .env.example .env
   # Set OPENAI_API_KEY in .env
   ```

4. **Start** (the override adds the ClickHouse MCP container automatically):
   ```bash
   docker compose up -d
   ```

5. Open `http://localhost:3080`. Select **clickhouse-default** as the MCP server.

### What `docker-compose.override.yml` adds

- `clickhouse-mcp` service: runs the ClickHouse MCP server on port 8001
- Mounts `librechat.yaml` into the LibreChat container
- Sources ClickHouse credentials from `frontend/.env`

### `librechat.yaml` Key Config

```yaml
# MCP server connecting LibreChat to ClickHouse
mcpServers:
  clickhouse-default:
    type: sse
    url: http://host.docker.internal:8001/sse

# Welcome message shown to admin users (schema context)
interface:
  customWelcome: |
    Welcome to the Saivers Energy Analytics AI.
    Use the clickhouse-default MCP server to query our energy database.

    Key tables:
    - sp_energy_intervals: Raw half-hourly meter data
    - energy_features: Computed baselines & anomalies
    - neighborhood_rollup: Pre-aggregated by date/slot

# Local dev: social login disabled
registration:
  socialLogins: []
```

### Important: Database Name in LibreChat

LibreChat's MCP server currently queries the **`default`** database in ClickHouse Cloud. If your data is in `saivers`, prefix queries:

```sql
SELECT * FROM saivers.sp_energy_intervals LIMIT 5
```

Or set `CLICKHOUSE_DB=saivers` in the MCP server environment (via `docker-compose.override.yml`).

### Example Admin Queries (via LibreChat)

```
"Show me total energy usage by neighbourhood for the past 7 days"
"Which households have the most anomalies this month?"
"Compare Ahmad (1001) vs Priya (1002) weekly usage"
"What is the average peak-window kWh for 5-room HDB homes?"
"Show reward transaction history for household 1001"
```

---

## ClickHouse Best Practices Applied

| Rule | Applied |
|---|---|
| ORDER BY low → high cardinality | All tables: `neighborhood_id` → `household_id` → `date` → `ts` |
| LowCardinality for low-unique strings | `neighborhood_id`, `flat_type`, `device_id`, `habit_type`, `status`, `mode` |
| Minimum bitwidth numerics | `UInt8` for slot_idx, temp; `UInt16` for streak_day; `UInt32` for household_id |
| No Nullable columns | DEFAULT values used throughout (0, '', false) |
| ReplacingMergeTree for updates | `energy_features` and `weekly_insights` — no ALTER UPDATE |
| Partition by month | All time-series tables: `PARTITION BY toYYYYMM(...)` |
| Append-only for ledger data | `reward_transactions`, `habit_events`, `device_actions` |
| Materialized views for aggregations | `neighborhood_rollup_mv` → `neighborhood_rollup` |
| AggregateFunction states in MV target | `sumState`/`uniqState` in MV, `sumMerge`/`uniqMerge` at query time |

---

## Troubleshooting

### Data shows as zeros in production

1. Check ClickHouse connectivity from backend:
   ```
   GET https://saivers.onrender.com/health
   ```
   Look for `"clickhouse": {"status": "ok"}`. If `"status": "error"`, the error message shows why.

2. Most likely cause: **ClickHouse Cloud IP allowlist** — Render's IPs are not whitelisted.
   Fix: ClickHouse Cloud console → Security → IP Access List → add `0.0.0.0/0`.

3. Check `CLICKHOUSE_DB=saivers` is set on both Render and Vercel (not `default`).

4. After adding env vars on Render, a **manual redeploy is required** for them to take effect.

### `lru_cache` singleton (backend)

`backend/app/db/client.py` caches the ClickHouse client with `@lru_cache`. If Render restarts with new env vars, the cache is cleared automatically. If you suspect a stale cached client, trigger a restart from the Render dashboard.

### ECONNRESET warnings (frontend)

Caused by the `@clickhouse/client` Node.js singleton being reused across Vercel serverless function invocations after the TCP connection has been closed. Fixed by `keep_alive: { enabled: false }` in `frontend/lib/clickhouse.ts`.
