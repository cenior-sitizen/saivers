# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Saivers** — AI-powered energy behaviour coach for Singapore households (HackOMania 2026). Tracks half-hourly SP Group energy data and AC appliance readings in ClickHouse, surfaces anomalies/habits/rewards via FastAPI, and renders Admin + User dashboards in Next.js.

## Repository Structure

```
saivers/
├── backend/          # FastAPI + ClickHouse + OpenAI
└── frontend/         # Next.js 16 + React 19 + Tailwind v4
```

## Backend

**Stack**: Python 3.14, FastAPI, ClickHouse (clickhouse-connect), OpenAI, uv

### Commands (run from `backend/`)

```bash
# Dev server
uv run uvicorn app.main:app --reload --port 8000

# Run migrations manually (also runs automatically on startup)
uv run python -m app.db.migrations

# Seed scripts
uv run python scripts/seed_clickhouse.py       # SP energy data
uv run python scripts/seed_ac_multiroom.py     # AC readings
uv run python scripts/seed_rewards.py          # Reward transactions
uv run python scripts/compute_features.py      # energy_features table
uv run python scripts/simulate_realtime.py     # Streaming inserts

# Tests
uv run pytest
uv run pytest tests/test_foo.py::test_bar      # single test
```

### Environment Variables (copy from `.env.example`)

```
CLICKHOUSE_HOST=https://xxx.clickhouse.cloud
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=...
CLICKHOUSE_DB=default
OPENAI_API_KEY=sk-...
```

### Architecture

- **Entry point**: `app/main.py` — mounts routers, runs migrations + device store on startup
- **DB client**: `app/db/client.py` — singleton `get_client()` via `lru_cache`, connects to ClickHouse Cloud (port 443, TLS)
- **Migrations**: `app/db/migrations.py` — idempotent DDL, auto-runs on startup
- **Routers**: `insights`, `devices`, `habits`, `admin`, `ingest`, `usage` — all prefixed under `/api/`
- **Services**: `ai_service` (OpenAI), `anomaly_service`, `device_store` (in-memory AC schedule), `habit_service`, `insight_service`, `reward_service`
- **Static data**: `app/data/households.py` (`HOUSEHOLDS`, `HOUSEHOLD_MAP`, `NEIGHBORHOOD_ID`), `app/data/rooms.py`

### ClickHouse Schema

Tables (all created by `migrations.py`):

| Table | Engine | Purpose |
|---|---|---|
| `sp_energy_intervals` | MergeTree | SP half-hourly energy readings |
| `ac_readings` | MergeTree | AC appliance readings per device |
| `energy_features` | ReplacingMergeTree(version_ts) | Computed baselines + anomaly scores |
| `habit_events` | MergeTree | Daily habit tracking (append-only) |
| `reward_transactions` | MergeTree | Points ledger (append-only, balance via SUM) |
| `device_actions` | MergeTree | AC schedule/action log |
| `neighborhood_rollup` | AggregatingMergeTree | Pre-aggregated neighborhood totals |
| `neighborhood_rollup_mv` | Materialized View | Auto-populates `neighborhood_rollup` |

**ClickHouse query rules enforced throughout**:
- Always filter on ORDER BY prefix columns first
- Use `LowCardinality(String)` for low-unique-count strings; no `Nullable` columns (use DEFAULT)
- Query `neighborhood_rollup` with `sumMerge`/`uniqMerge` (AggregatingMergeTree state functions)
- Use `ANY INNER JOIN` when joining one feature row per interval row
- `async_insert=1` + `wait_for_async_insert=1` for real-time inserts (avoids part explosion)
- Reward balance is always derived via `SUM(points_earned)` — never stored as mutable state

### Domain Constants

- **Neighborhood**: hardcoded `NEIGHBORHOOD_ID` in `app/data/households.py`
- **Household IDs**: 1001–1004 (map to 4 rooms in the household)
- **Timezone**: `Asia/Singapore` on all `DateTime` columns
- **Tariff**: S$0.2911/kWh
- **Peak hours**: tracked via `peak_flag` bool on `sp_energy_intervals`

## Frontend

**Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Recharts, `@clickhouse/client`

### Commands (run from `frontend/`)

```bash
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test:clickhouse  # Test ClickHouse connectivity
```

### Environment Variables

Same ClickHouse vars as backend (`CLICKHOUSE_HOST`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DB`) set in `frontend/.env.local`.

### Architecture

Two views accessible from the root landing page:

- **Admin** (`/admin`) — desktop-first, reads from ClickHouse via backend API or Next.js API routes; pages: analytics, incidents, investigation, monitoring, observability, recommendations
- **User** (`/user`) — mobile-first; pages: dashboard, aircon per room (`/user/aircon/[room]`), aircon impact summary, rewards, profile, settings

**ClickHouse access pattern**: Next.js API routes in `app/api/` query ClickHouse directly using `frontend/lib/clickhouse.ts` (server-side singleton). Some pages fall back to `mockData.ts` when the DB is unavailable.

**Room mapping** (`frontend/lib/clickhouse.ts`):
- `1001` → `master-room`, `1002` → `room-1`, `1003` → `room-2`, `1004` → `living-room`

## Deployment

- **Backend**: Render (Docker) — `backend/Dockerfile` is a multi-stage build (builder installs deps with `uv`, runtime copies `.venv` and app source). Port 8080.
- **Frontend**: Render — standard Next.js deployment.
- Production env vars are set in Render dashboard (no `.env` file in production).
