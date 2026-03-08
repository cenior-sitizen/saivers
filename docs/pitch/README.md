# Saivers — Pitch Reference

**Tagline**: Your AI energy coach — turning half-hourly data into daily habits that help the grid.

**Challenge**: HackOMania 2026 — SP Group Track: "AI for Actionable Energy Behaviour Change"

---

## The Problem

SP Group's app gives every household **half-hourly meter data**. The gap is not data access — it is **data translation**:

| Pain Point | Current Reality | Saivers Fix |
|---|---|---|
| Users see numbers, not meaning | 380.7 kWh/month with no context | Plain-language explanation of what drove usage |
| No actionable next step | "Here is your peak usage" with no guidance | "Your AC ran 4+ hours overnight — set a 2am auto-off" |
| No verification of change | Historical data, but not whether advice worked | Before/after baseline comparison per recommendation |
| No habit formation | One-off tips with no tracking | Streaks, milestones, weekly missions |
| No appliance-level visibility | Only total household meter | AC-level data via smart appliance enrichment |

---

## Singapore Context

| Metric | Figure | Source |
|---|---|---|
| Average 4-room HDB | 380.7 kWh/month | MSE/EMA 2024 |
| Average 5-room HDB | 464.0 kWh/month | MSE/EMA 2024 |
| Electricity tariff | S$0.2911/kWh | Jan–Mar 2026, regulated |
| Grid emission factor | 0.402 kg CO2/kWh | EMA 2024 |
| Motivated to save if shown cost savings | 4 in 5 households | NEA survey |
| SP Group demand response pilot | >50% reduced usage by >20% | SP Group |
| Fan vs air-con annual saving | ~S$441/year | NEA |
| AC timing shift saving | ~S$100–150/year | Estimate |

---

## Our Solution

Saivers enriches SP Group's half-hourly meter data with **smart appliance data** (starting with air conditioners) to enable:

1. **Appliance-level insight** — not just total usage, but which device and which room
2. **Proactive AI coaching** — weekly insights with specific recommended actions
3. **Behaviour change loop** — streaks, gamification, CDC voucher rewards
4. **Automation with approval** — AI recommends an AC schedule, user approves with one tap

> Not a dashboard. A **next-best-action engine** with closed-loop verification.

---

## Architecture

```
┌─────────────────────┐    ┌─────────────────────────────────────────┐
│  SP Half-Hourly     │    │  Smart Appliance Data (AC Simulator)    │
│  Meter Data         │    │  Appliance-level, room-level, 30min     │
└────────┬────────────┘    └──────────────────────┬──────────────────┘
         │                                         │
         └──────────────────┬──────────────────────┘
                            ▼
              ┌─────────────────────────┐
              │  ClickHouse Cloud       │
              │  (GCP asia-southeast1)  │
              │  10 tables, seeded data │
              └────────────┬────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
   ┌──────────────────┐     ┌──────────────────────┐
   │  FastAPI Backend │     │  Next.js Frontend    │
   │  (Render)        │     │  (Vercel)            │
   │  Python          │     │  Tailwind CSS        │
   └──────────────────┘     └──────────────────────┘
              │                         │
              ▼                         ▼
   ┌──────────────────┐     ┌──────────────────────┐
   │  Admin Dashboard │     │  User Mobile App     │
   │  + LibreChat AI  │     │  (households)        │
   └──────────────────┘     └──────────────────────┘
```

### Layer Breakdown

| Layer | Purpose |
|---|---|
| **Signal extraction** | Deterministic analytics — baseline computation, peak detection, anomaly scoring |
| **AI explanation** | OpenAI / Claude API — plain-language summaries, weekly insight narratives |
| **Behaviour change** | Frontend — streaks, gamification, approve/dismiss workflows |

---

## What's Built (Demo-Ready)

### User App (Mobile-First, `/user`)

| Feature | Status | Description |
|---|---|---|
| Home dashboard | Built | AC usage chart, current cost, carbon, energy behaviour card |
| Aircon Impact page | Built | Half-hourly chart, usage vs district/SG average, AI-generated behaviour analysis |
| Notification bell | Built | Unread badge, dropdown with insights, 30s push toast, priority ordering |
| Weekly insight detail | Built | Full insight page — signal type, metrics grid, AI analysis, Approve/Dismiss CTAs |
| Rewards page | Built | Points balance radial arc, streak badge, CDC voucher redemption, transaction history |
| Household switcher | Built | Switch between Ahmad / Priya / Wei Ming demo personas |

### Admin Dashboard (Desktop-First, `/admin`)

| Feature | Status | Description |
|---|---|---|
| Real-time monitoring | Built | Live energy readings across households |
| Energy trend charts | Built | Historical patterns at various granularities |
| LibreChat integration | Built | Natural language ClickHouse queries via MCP |
| Anomaly detection | Built | Unusual consumption flagging from `energy_features` table |
| Weekly insights admin | Built | Manual trigger to regenerate insights for all households |

### Backend Services

| Service | Status | Description |
|---|---|---|
| FastAPI backend | Built | 10 routers, deployed on Render |
| AC Simulator | Built | 80 AC units (10 households × 4 rooms × 2 units), SSE live stream |
| Weekly insight engine | Built | Generates AI summaries + recommendations weekly |
| Habit evaluation | Built | Daily off-peak AC check, weekly reduction check |
| Rewards ledger | Built | Append-only points, CDC voucher redemption |

---

## Demo Personas

Three distinct Singapore HDB households with seeded data in ClickHouse:

### Ahmad (Household 1001) — Punggol, 5-room HDB
- Family household, highest usage
- Weekly usage: ~334 kWh | Weekly cost: ~S$97
- Points: 240 | Streak: 7 days
- Unread insights: 3 (including overnight AC anomaly)
- Story: Family with kids, AC runs through the night — biggest savings opportunity

### Priya (Household 1002) — Jurong West, 4-room HDB
- Working couple, moderate usage
- Weekly usage: ~152 kWh | Weekly cost: ~S$44
- Points: 150 | Streak: 4 days
- Unread insights: 1
- Story: Already energy-conscious, focusing on weekly reduction streaks

### Wei Ming (Household 1003) — Bedok, 3-room HDB
- Single professional, lowest usage
- Weekly usage: ~125 kWh | Weekly cost: ~S$36
- Points: 480 | Streak: 14 days (on track for S$5 CDC voucher at 500 pts)
- Unread insights: 1 (efficient signal)
- Story: Power user of the app, about to redeem first voucher — gamification working

---

## Tech Stack

| Component | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS, Recharts | Vercel |
| Backend | FastAPI (Python), `clickhouse-connect` | Render |
| Database | ClickHouse Cloud (GCP asia-southeast1) | ClickHouse Cloud |
| AC Simulator | FastAPI, in-memory state, SSE | Render (separate service) |
| AI Coach | OpenAI API (GPT-4o-mini) | Via Render backend |
| Admin AI | LibreChat + ClickHouse MCP server | Docker (local / deployable) |

---

## Key Differentiators

**1. Closed-loop verification**
Every recommendation has a before/after baseline comparison. We don't just suggest — we confirm whether the change happened.

**2. Appliance-level granularity**
SP's meter shows total household usage. We add AC-level data per room. That's the layer that makes recommendations actionable ("your master room AC ran until 4am — here's a schedule").

**3. Reward tied to grid behaviour**
CDC voucher points are earned by achieving off-peak AC habits and weekly energy reductions — directly aligning household incentives with grid demand management.

**4. Dual surfaces**
- **Households**: mobile-first app with nudges, automation, gamification
- **SP Operations**: admin dashboard with LibreChat natural-language analytics over live ClickHouse data

**5. ClickHouse for real analytics**
43,200+ rows of half-hourly SP meter data + 43,200 AC readings. Sub-second queries. Materialized views for neighbourhood rollups. Not mocked in memory.

---

## Savings Numbers (Defensible)

| Behaviour Change | Monthly Saving | Annual |
|---|---|---|
| 5% overall reduction (4-room HDB) | S$5.54 / 7.7 kg CO2 | S$66 |
| 10% overall reduction | S$11.08 / 15.3 kg CO2 | S$133 |
| AC timing shift (auto-off at 2am) | — | ~S$100–150 |
| Fan instead of AC | — | ~S$441 (NEA) |

At scale (500,000 HDB households), even a 5% reduction = **S$33M/year in household savings** and meaningful peak demand relief.

---

## Judging Criteria Alignment

| Criterion | Weight | How We Address It |
|---|---|---|
| Product Execution | 35% | Working end-to-end demo: Vercel + Render + ClickHouse Cloud. Three distinct personas with real seeded data. |
| Impact | 30% | Before/after kWh reduction per recommendation. Defensible Singapore-specific numbers. CDC voucher incentive tied to grid behaviour. |
| Solution Complexity | 20% | AI used intentionally — deterministic analytics for signal extraction, LLM only for natural language explanation. ClickHouse at scale. |
| Relevance | 15% | Built for Singapore HDB households, SP Group half-hourly data format, real tariff (S$0.2911/kWh), real CO2 factor (0.402 kg/kWh). |

---

## Demo Script (5 Minutes)

1. **Problem** (30s): "SP shows you kWh. We show you what to do about it."
2. **Notification bell** (45s): Switch to Ahmad. Bell shows 3 unread. Open insight — overnight AC anomaly. Show Approve to set 2am auto-off schedule.
3. **Rewards** (30s): Show 240 pts, 7-day streak. Explain CDC voucher at 500 pts. Switch to Wei Ming — 480 pts, nearly there.
4. **Aircon Impact page** (45s): Half-hourly chart, usage vs district average, AI behaviour analysis.
5. **Admin + LibreChat** (60s): "Which households have the most anomalies?" → ClickHouse query runs live.
6. **Scale** (30s): 500K HDB households × S$66/year = S$33M in savings. Peak demand relief at grid level.
7. **Why us** (30s): Closed loop, appliance-level, real data, real incentives.

---

## Deployment URLs

| Service | URL |
|---|---|
| Frontend (UAT) | Vercel deployment URL |
| Backend | `https://saivers.onrender.com` |
| Backend health | `https://saivers.onrender.com/health` |
| Backend API docs | `https://saivers.onrender.com/docs` |
| LibreChat | `http://localhost:3080` (local Docker) |

---

## Environment Variables

### Frontend (Vercel)

| Variable | Value | Purpose |
|---|---|---|
| `BACKEND_URL` | `https://saivers.onrender.com` | Proxy target for all API routes |
| `CLICKHOUSE_HOST` | ClickHouse Cloud host | Direct ClickHouse queries (aircon charts) |
| `CLICKHOUSE_USER` | `default` | ClickHouse auth |
| `CLICKHOUSE_PASSWORD` | (secret) | ClickHouse auth |
| `CLICKHOUSE_DB` | `saivers` | Database name |
| `OPENAI_API_KEY` | (secret) | AI explanations via frontend |

### Backend (Render)

| Variable | Value | Purpose |
|---|---|---|
| `CLICKHOUSE_HOST` | ClickHouse Cloud host | Backend → ClickHouse queries |
| `CLICKHOUSE_USER` | `default` | ClickHouse auth |
| `CLICKHOUSE_PASSWORD` | (secret) | ClickHouse auth |
| `CLICKHOUSE_DB` | `saivers` | Database name |
| `OPENAI_API_KEY` | (secret) | Weekly insight AI generation |
| `AC_SIMULATOR_URL` | AC Simulator Render URL | Backend → AC control |

---

*Built for HackOMania 2026 — SP Group Track*
