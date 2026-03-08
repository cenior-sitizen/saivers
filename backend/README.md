# Saivers Backend

Team: `Cenior Sitizen` | `HackOMania 2026`

Saivers is an AI energy behaviour coach for Singapore households. This backend turns SP-style interval data into explainable insights, GPT-powered recommendations, monthly reports, admin analytics, and device actions that help users reduce peak-hour usage.

Built for HackOMania 2026, SP Group challenge: `AI for Actionable Energy Behaviour Change`.

## The Problem

Households can see electricity usage, but they usually do not know:

- what caused the spike
- what to do next
- whether their action actually worked

For Singapore, that matters because evening peak demand affects both household bills and grid stress. Saivers focuses on turning raw energy data into clear next actions that are easy to follow and easy to verify.

## What We Built

This backend supports an end-to-end AI product flow:

1. Ingest half-hourly household energy intervals and AC readings.
2. Store and query the data in ClickHouse for fast analytics at interval level.
3. Detect anomalies and usage patterns with deterministic analytics.
4. Use AI to explain those patterns in plain language.
5. Generate weekly recommendations, proactive insights, and admin summaries.
6. Let the user approve an action and apply a device schedule through MCP-based control.
7. Measure habit progress, savings, and monthly impact.

Core capabilities already implemented in this repo:

- AI coach chat grounded in household usage context
- anomaly detection for spikes, weekly comparison, and late-night AC behaviour
- weekly insights with unread, approve, dismiss, and demo trigger flows
- recommendation generation with apply-and-track workflow
- monthly energy reports with AI narrative summary
- habit streaks, weekly impact, points, and reward redemption
- per-room AC status, scheduling, and recommendation-driven control
- admin analytics, anomaly explanation, AI dashboard summaries, and observability endpoints

## The AI Story

Saivers is intentionally AI-forward. The product is not using AI as a cosmetic chatbot layer. AI is used where it adds the most value:

- explaining unusual energy behaviour in plain English
- converting anomaly signals into personalised household recommendations
- generating admin-facing summaries for neighbourhood energy operations
- supporting natural-language investigation in the admin experience through LibreChat over ClickHouse-backed data

The architecture keeps the numbers trustworthy:

- ClickHouse stores the raw interval and device data
- deterministic backend logic computes anomaly scores, baselines, savings, and comparisons
- OpenAI models turn those computed facts into clear recommendations and explanations

That split is important for judges. It shows the system is both credible and practical: AI handles understanding and communication, while the backend and database handle evidence and measurement.

## Why ClickHouse Matters

ClickHouse is the evidence layer of Saivers. It gives the product a real analytical backbone rather than a toy demo backend.

In this repo, ClickHouse is used for:

- storing SP-style half-hourly energy intervals
- storing AC telemetry and device action logs
- computing neighbourhood rollups and peak/off-peak summaries
- comparing households against baselines
- supporting anomaly detection and weekly or monthly reporting

This is also what makes the admin story strong. Judges can see that the AI is not guessing. It is operating on structured energy data that can be queried, aggregated, and audited.

## Admin Investigation With AI and LibreChat

One of the strongest demo moments is the admin side of Saivers. The admin view is designed to do more than show charts.

It combines:

- ClickHouse-backed neighbourhood analytics
- AI-generated dashboard and incident summaries
- AI-generated operational recommendations
- a LibreChat-based investigation workflow for asking natural-language questions over the energy data

This matters because it shows AI being used in two ways at once:

- for the homeowner, as a coach that turns usage into action
- for the operator, as an investigation assistant that helps explain what is happening across households and peak periods

That gives the product a stronger system story than a single-user dashboard.

## Why This Matters To Judges

### Impact

Saivers is designed to create visible behaviour change, not just awareness. The product closes the loop from `data -> recommendation -> user action -> measured result`.

Users benefit through:

- lower household energy use
- lower energy cost
- reduced peak-hour demand
- clearer understanding of what drove their consumption

This directly matches the challenge focus on actionable AI for good in Singapore's energy context.

### Relevance

The solution is built around the exact user problem in this challenge: households already have usage data, but they still need help understanding it and acting on it. The backend is structured for Singapore-style residential interval data, demand-shifting behaviour, and appliance-level coaching from whole-home signals.

### Solution Complexity

The architecture keeps AI in the right place:

- ClickHouse handles the data model, rollups, and high-volume analytics
- deterministic backend logic handles ingestion, analytics, scoring, and savings calculations
- AI is used for explanation, recommendation language, coaching, anomaly interpretation, and admin summarisation

This makes the system more credible, cheaper to run, and easier to demonstrate reliably than an AI-only approach. It also shows that the team thought about where AI is necessary and where traditional analytics are the better tool.

### Product Execution

This is a working backend, not a slide deck. It exposes live API routes for ingestion, analytics, reports, habits, admin summaries, anomaly explanations, and device actions, and it is set up to run as a FastAPI app with interactive API docs.

## Demo Story

A judge can follow this flow in the product:

1. A household's interval data is ingested.
2. ClickHouse stores the data and supports the baseline and anomaly queries.
3. Saivers detects unusual or inefficient usage.
4. The AI coach explains what happened in plain English.
5. The system surfaces a weekly insight or recommendation.
6. The user approves a suggested action.
7. The backend applies a device schedule and records projected savings.
8. Habits and monthly reports show whether behaviour improved.

On the admin side, the same data can be used for:

- neighbourhood dashboards and peak heatmaps
- AI-generated operational summaries
- natural-language investigation with LibreChat over ClickHouse-backed data

For the live demo, this system is also paired with an actual Xiaomi humidifier so judges can see a real AI-to-device control moment rather than only a software-only flow.

This demonstrates the core claim of the product: Saivers does not just report energy usage, it helps users change it.

## How The Backend Works

This backend is the product engine behind Saivers.

Its responsibilities include:

- ingesting household interval and device data
- persisting the data in ClickHouse
- running anomaly and behaviour analysis
- calling OpenAI models for explanation and recommendation generation
- exposing recommendation approval and device action endpoints
- generating monthly reports, habit progress, and admin summaries

The backend is deliberately structured so that judges can see a full system:

- `data layer`: ClickHouse for interval-scale analytics
- `service layer`: Python services for anomaly detection, scoring, caching, and orchestration
- `AI layer`: OpenAI-powered explanation, coaching, and summary generation
- `API layer`: FastAPI endpoints used by the user and admin interfaces

## Architecture

```text
Energy data + device readings
        ->
ClickHouse storage + analytics
        ->
FastAPI services, orchestration, and scoring logic
        ->
OpenAI-powered explanations, recommendations, and admin summaries
        ->
User coaching, admin investigation, reports, habits, and device actions
```

Backend stack:

- FastAPI
- ClickHouse
- OpenAI API
- Python 3.14+

## Key API Areas

- `/health`
- `/api/insights/{household_id}`
- `/api/insights/coach/chat`
- `/api/insights/weekly/{household_id}`
- `/api/recommendations/weekly/{household_id}`
- `/api/reports/monthly/{household_id}`
- `/api/habits/{household_id}`
- `/api/devices/ac/status/{household_id}`
- `/api/devices/ac/schedule`
- `/api/admin/recommendations`
- `/api/admin/dashboard-summary`
- `/api/admin/observability-summary`
- `/api/admin/explain-anomaly`

Interactive docs are available at `/docs` when the server is running.

## Backend Setup

This section is for running the backend locally for demo prep, judging, or API verification.

### 1. Install dependencies

```bash
uv sync
```

### 2. Configure environment

Create `.env` from [.env.example](/Users/shaunliew/Documents/saivers/backend/.env.example).

Required variables:

- `CLICKHOUSE_HOST`
- `CLICKHOUSE_USER`
- `CLICKHOUSE_PASSWORD`
- `CLICKHOUSE_DB`
- `OPENAI_API_KEY`

### 3. Verify ClickHouse connectivity

```bash
uv run python scripts/test_clickhouse.py
```

This checks the ClickHouse connection and confirms the target database exists.

### 4. Create tables

```bash
uv run python -m app.db.migrations
```

This creates the core backend tables, including:

- raw SP interval data
- AC readings
- computed energy features
- rewards and habit tracking tables
- device action logs
- weekly recommendations and insights
- neighbourhood rollups for admin analytics

### 5. Seed demo data

Base seed:

```bash
uv run python -m scripts.seed_clickhouse
uv run python -m scripts.compute_features
```

Optional demo enhancers:

```bash
uv run python scripts/seed_anomaly_cases.py
uv run python -m scripts.seed_success_week
```

Use these if you want stronger anomaly, recommendation, and behaviour-change flows for a live demo.

### 6. Start the API

```bash
uv run uvicorn app.main:app --reload
```

### 7. Open the docs

Visit `http://127.0.0.1:8000/docs`

### 8. Run a quick smoke test

With the backend running:

```bash
bash scripts/smoke_test.sh
```

This verifies the main surfaces used in the demo:

- health and Swagger docs
- AI coach chat
- device control endpoints
- habits and rewards
- admin endpoints
- ClickHouse-backed insights

## Notes

- This repository is the backend and analytics layer for Saivers.
- Health checks report ClickHouse connectivity status.
- The app includes demo-friendly flows such as manual weekly insight generation, AI dashboard summaries, anomaly explanation, and recommendation approval endpoints.
- In the full demo system, the admin experience highlights AI investigation with LibreChat on top of ClickHouse-backed energy data.
- The live demo setup includes an actual Xiaomi humidifier to make the AI-driven device control flow tangible for judges.
