# Saivers

Team: `Cenior Sitizen` | `HackOMania 2026`

Saivers is an AI energy behaviour coach for Singapore households. It combines ClickHouse analytics, AI-generated coaching, LibreChat-powered admin investigation, and smart-device control to turn raw energy usage into actions that reduce waste, lower bills, and ease peak-hour demand.

Built for HackOMania 2026, SP Group challenge: `AI for Actionable Energy Behaviour Change`.

## The Problem

Households can already see electricity usage, but most still do not know:

- what caused a spike
- what action to take next
- whether a behaviour change actually worked

That is the gap Saivers solves. Instead of showing energy data as a passive dashboard, we turn it into a measurable action loop for Singapore households.

## What We Built

Saivers is a full-stack prototype with four connected parts:

- `frontend/`: judge-facing product surfaces for the household and admin views
- `backend/`: FastAPI, ClickHouse analytics, AI orchestration, reports, habits, and device actions
- `librechat-config/`: admin investigation flow for natural-language analysis over energy data
- `xiaomi-purifier/`: smart-device demo support for the live hardware control story

End-to-end product flow:

1. Ingest household interval data and device readings.
2. Store and analyze the data in ClickHouse.
3. Detect anomalies and behaviour patterns with deterministic logic.
4. Use AI to explain the data in plain English and generate recommendations.
5. Let the user approve actions and trigger device controls.
6. Show habits, savings, and monthly impact.
7. Let admins investigate households and neighbourhood trends with AI and LibreChat.

## The AI Story

Saivers is intentionally AI-forward. AI is not used as a decorative chatbot. It is used where it creates real product value:

- explaining unusual household energy behaviour in plain language
- generating personalised energy recommendations from actual usage patterns
- producing admin-facing operational summaries and anomaly explanations
- supporting natural-language investigation in the admin flow through LibreChat over ClickHouse-backed data

The system stays credible because AI is paired with deterministic analytics:

- ClickHouse stores and queries the energy evidence
- backend services compute baselines, anomaly scores, savings, and behaviour metrics
- AI turns those computed facts into clear coaching and decision support

## Why ClickHouse Matters

ClickHouse is the evidence layer of Saivers. It gives the product a real analytical backbone instead of a lightweight demo database.

It is used for:

- SP-style half-hourly household interval data
- device telemetry and action logs
- anomaly detection and baseline comparison
- admin rollups, heatmaps, and neighbourhood summaries
- weekly and monthly reporting

This matters to judges because it proves the AI is operating on structured data that can be queried, aggregated, and verified.

## Admin Investigation With AI and LibreChat

One of the strongest demo moments is the admin experience.

The admin side combines:

- ClickHouse-backed neighbourhood analytics
- AI-generated dashboard and observability summaries
- AI-generated operational recommendations
- LibreChat-based natural-language investigation across energy data

This gives Saivers a stronger system story than a user-only app. The same platform helps both sides:

- households get coaching and automation support
- operators get investigation and decision support

## Why This Matters To Judges

### Impact

Saivers is built to create visible behaviour change, not just awareness. The product closes the loop from `data -> recommendation -> action -> measured result`.

Benefits include:

- lower household energy use
- lower energy cost
- reduced peak-hour demand
- clearer understanding of what caused consumption

### Relevance

The solution is tightly aligned with the HackOMania SP Group challenge. It focuses on Singapore households, interval energy data, actionable AI, and real household behaviour change.

### Solution Complexity

The architecture uses AI where it makes sense and uses traditional analytics where they are more reliable:

- ClickHouse for scale and evidence
- deterministic backend logic for scoring and measurement
- AI for explanation, coaching, summarisation, and investigation

### Product Execution

This is a working full-stack prototype, not a presentation deck. Judges can see real product surfaces, API routes, analytics, AI summaries, and a live device-control story.

## Demo Story

A judge can follow this flow:

1. Household interval data is ingested.
2. ClickHouse supports anomaly and baseline analysis.
3. Saivers detects wasteful or unusual behaviour.
4. The AI coach explains what happened and recommends an action.
5. The user approves the action.
6. The backend records projected savings and triggers device control.
7. Habits, streaks, and monthly reports show whether behaviour improved.
8. On the admin side, LibreChat and AI summaries help investigate households and neighbourhood patterns.

The live demo setup also includes an actual Xiaomi humidifier so judges can see a real AI-to-device control moment rather than only a software-only flow.

## Repository Structure

```text
saivers/
├── frontend/           # Next.js product UI for household and admin experiences
├── backend/            # FastAPI + ClickHouse + AI services
├── librechat-config/   # LibreChat configuration for admin investigation workflows
├── xiaomi-purifier/    # Smart-device demo integration assets
├── ac-simulator/       # Supporting local simulator for device scenarios
└── README.md
```

## Stack

- Frontend: Next.js, Tailwind CSS
- Backend: FastAPI, Python
- Database: ClickHouse
- AI: OpenAI models, LibreChat admin workflow
- Device demo: Xiaomi humidifier and device-control flow

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Backend

See [backend/README.md](/Users/shaunliew/Documents/saivers/backend/README.md) for the backend runbook, including:

- environment setup
- ClickHouse verification
- table creation
- demo seeding
- API startup
- smoke testing

## Notes

- This root README is submission-focused for judges and demo reviewers.
- The backend contains the main analytics and AI workflow details.
- The admin story is strongest when showing ClickHouse-backed investigation together with LibreChat.
- The live hardware demo includes an actual Xiaomi humidifier.
