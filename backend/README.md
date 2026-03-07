# WattCoach — SP Group AI Energy Behaviour Change
## Product Requirements Document (PRD) v1

> Generated via all-plan (designer + Codex research + reviewer)
> Challenge: HackOMania 2026 — SP Group Track: "AI for Actionable Energy Behaviour Change"
> Date: 2026-03-07

---

## Executive Summary

**Product Name**: WattCoach

**Tagline**: "Your AI energy coach — turning half-hourly data into daily habits that help the grid."

**Core Pitch**: WattCoach is an explainable AI demand-response coach built on SP Group's half-hourly electricity data. It transforms raw interval data into a personalised, measurable behaviour-change loop — not a prettier dashboard, but a **next-best-action engine** that closes the loop from data to action to verified outcome.

**Why we win**: Every existing solution (OhmConnect, Sense, Nest, SP App) shows data. None of them closes the loop with explainable, verified behaviour change tied to grid-level impact. WattCoach does exactly that, in language a Senior Data Scientist in demand response will immediately recognise as credible.

---

## Problem Statement

The SP App already provides half-hourly electricity data. The gap is not data access — it is **data translation**:

| Pain Point | Current Reality | WattCoach Fix |
|---|---|---|
| Users see numbers, not meaning | 380.7 kWh/month for 4-room HDB with no context | Plain-language explanation of what drove usage |
| No actionable next step | "Here is your peak usage" with no guidance | "Run your washer after 11pm — saves S$8/month" |
| No verification of change | App shows historical data, not whether advice worked | Before/after baseline comparison per recommendation |
| No grid connection | Individual usage with no sense of collective impact | Grid Helper Score — how much peak stress did you relieve? |
| No habit formation | One-off tips with no tracking | Streaks, weekly missions, flexibility score over time |

**Judging criteria alignment**:
- Impact (30%): Demonstrated through before/after kWh reduction, CO2 avoided, S$ saved per household
- Relevance (15%): Built for Singapore HDB households, SP Group half-hourly data, real tariff figures
- Solution Complexity (20%): AI used intentionally — LLM for explanation + coaching only, deterministic analytics for signal extraction
- Product Execution (35%): Working end-to-end demo with real data flow, not a mock-up

---

## Singapore Context (Research-Backed)

### Household Energy Profile
- Average 4-room HDB: **380.7 kWh/month** (2024, MSE/EMA data)
- Average 5-room/executive HDB: **464.0 kWh/month**
- Electricity tariff: **S$0.2911/kWh** (Jan-Mar 2026, regulated)
- Grid emission factor: **0.402 kg CO2/kWh** (2024)
- Top energy users in a home: air-conditioner, refrigerator, water heater, washing machine, lighting (~80% of use)

### Savings Potential (Defensible Numbers)
| Behaviour Change | Monthly Saving | Annual Saving |
|---|---|---|
| 5% overall reduction (4-room HDB) | S$5.54 / 7.7 kg CO2 | S$66 |
| 10% overall reduction | S$11.08 / 15.3 kg CO2 | S$133 |
| Use fan instead of air-con | — | S$441/year (NEA) |
| Shift AC timing (pre-cool, auto-off 2am) | — | ~S$100-150/year (est.) |
| Shift laundry to off-peak (11pm-7am on TOU plan) | S$3-8/month | S$40-100/year |

### Motivation Signal
- **4 in 5 Singapore households** are motivated to save energy if they can see cost savings (NEA survey)
- SP Group's residential demand response pilot: **>50% of participants reduced usage by >20%** during activation events
- Smart meter rollout is near-nationwide — the data infrastructure exists

### Peak/Off-Peak Context
- SP Group's regulated tariff is **flat** (no TOU differential by default)
- Peak/off-peak matters through **retailer TOU plans** (e.g. Senoko: off-peak 11pm-7am; Geneco: off-peak 7pm-7am)
- Demo strategy: show value for both regulated (via grid stability contribution) and TOU plan users (via bill savings)

---

## Solution: WattCoach

### Core Philosophy
> Not a dashboard. A **next-best-action engine** with closed-loop verification.

### Three-Layer Architecture

```
Layer 1: Signal Extraction (Deterministic Analytics)
  Half-hourly intervals -> Baseline by weekday/hour -> Peak spike detection
  -> Recurring habit detection -> Shiftable load windows

Layer 2: AI Explanation & Coaching (Claude API)
  Structured insight objects -> Plain-language explanation
  -> Personalised recommendations -> Conversational Q&A

Layer 3: Behaviour Change Loop (Frontend)
  Before/after tracking -> Streak gamification
  -> Grid Helper Score -> Weekly missions -> Verified impact report
```

### Key Features (MVP for 24 Hours)

#### Feature 1: Proactive AI Energy Coach (Active, Not Passive)

WattCoach does not wait for the user to ask questions. It monitors half-hourly data and **proactively surfaces insights** when something important is detected.

**Proactive Trigger Engine** (3 triggers for demo):
```typescript
type InsightTrigger =
  | 'peak_spike_detected'      // Tonight's 7-11pm usage is projected above baseline
  | 'weekly_review_ready'      // End-of-week summary with top recommendation
  | 'demand_response_window'   // Simulated grid stress event tonight

interface ProactiveInsight {
  id: string
  trigger: InsightTrigger
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  evidence: {
    baseline_kwh: number
    projected_kwh?: number
    excess_kwh?: number
    matching_days?: number
  }
  recommended_action: string
  estimated_kwh_saved: number
  estimated_sgd_saved: number
  estimated_co2_kg_saved: number
  can_automate: boolean   // shows "Do this for me" button
}
```

**Pre-built proactive insights for Mdm Tan (demo-ready)**:

*Insight 1 — Tonight Peak Warning (peak_spike_detected)*:
- Title: "Your 8pm-10pm usage is likely to exceed your usual Thursday pattern"
- Message: "Your projected usage is 28% above your usual peak window. Pattern looks similar to previous AC + laundry overlap evenings."
- Action: "Delay laundry until after 11pm and pre-cool living room before 7pm."
- Impact: 1.3 kWh saved, S$0.38, 0.52 kg CO2 | can_automate: true

*Insight 2 — Weekly Coaching Summary (weekly_review_ready)*:
- Title: "You reduced evening peak usage this week — but AC remains your largest driver"
- Message: "Your 7pm-11pm consumption fell 11% vs last week. Estimated cooling still accounts for 42% of usage."
- Action: "Set a 2am auto-off for AC on weekdays."
- Impact: S$7-S$11/month projected | can_automate: true

*Insight 3 — Demand Response Event (demand_response_window)*:
- Title: "Grid stress expected tonight from 7pm-10pm — your home can help"
- Message: "If you shift one laundry cycle and delay water heating, your home can reduce peak stress by an estimated 0.9 kWh."
- Action: "Join tonight's Grid Helper challenge"
- Impact: Moves into top 15% of similar homes this week

**UI Delivery Pattern** (Next.js, no real push service needed):
- Notification bell (top-right) with count badge
- High-priority banner slides in after 3-second delay (simulates background detection)
- Clicking opens proactive coach card with: reason + evidence + recommended action + projected savings + "Do this for me" button
- After action: chart updates + savings counter ticks + confirmation appears

**Demo trigger**: In demo, the insight fires automatically via `setTimeout(..., 3000)` after page load. Frame it as: "For this demo we trigger the same insight pipeline on demand. In production this runs automatically on new interval data."

**Passive chat (also supported)**: User can still ask questions — "Why was my bill high last Tuesday?" → coach responds with interval-data-grounded explanation. Both modes coexist.

#### Feature 2: Peak-Shift Simulator (WOW DEMO MOMENT)
- Interactive half-hourly chart for "today"
- User can toggle recommended actions ON/OFF
- Chart updates in real-time showing:
  - Projected kWh shift from peak (7pm-11pm) to off-peak
  - Estimated cost savings (S$)
  - CO2 reduction (kg)
  - Grid contribution: "You would reduce peak demand by X% during tonight's stress window"
- Before/after side-by-side comparison

#### Feature 3: Grid Helper Score
- Weekly score (0-100) measuring how much peak-window stress this household avoided
- Broken down by:
  - Peak hours avoided (e.g. "You used 15% less during 7-11pm vs your baseline")
  - Shiftable load shifted (e.g. "You ran 3 of 5 laundry cycles off-peak")
  - Demand response events participated in
- Framing: "Your home is a Flexible Grid Asset" — language the energy data scientist will immediately respect

#### Feature 4: Estimated Appliance Breakdown (NEW)

SP App shows only total half-hourly usage. WattCoach adds estimated per-appliance breakdown using pattern heuristics.

**Singapore HDB Heuristics** (always labeled "estimated"):

| Appliance | Detection Pattern | Typical Range |
|---|---|---|
| Air-conditioner | Sustained 0.6-1.2 kWh/slot for 2+ consecutive slots, 8pm-1am | 0.6-1.2 kWh/slot |
| Washing machine | Short spike 0.8-1.5 kWh lasting 1-2 slots, evening or weekend | 0.8-1.5 kWh/event |
| Water heater | 0.3-0.6 kWh burst, 6-8am or late evening, 1-2 slots | 0.3-0.6 kWh/event |
| Fridge | Constant ~0.05-0.08 kWh every slot (baseline always-on) | 0.04-0.08 kWh/slot |
| Lighting & standby | Residual after subtracting above estimates | Varies |

**Always label**: "Estimated appliance breakdown — derived from pattern heuristics on whole-home half-hourly usage. Not device-level metering."

**Visualizations**:
- Daily stacked bar chart (48 half-hour slots): AC layer + washer spike + water heater burst + fridge baseline + residual
- Monthly donut breakdown: "AC 41% · Fridge 16% · Lighting & Standby 19% · Laundry 8% · Water Heater 10% · Other 6%"
- Each appliance card: estimated kWh/month, estimated cost, share of bill, trend vs last month

**Proactive connection**: Monthly analysis fires `monthly_analysis_ready` insight: "Your February analysis is ready. Estimated cooling accounted for 43% of your usage. I found 2 ways to lower that next month."

#### Feature 5: Habit Tracker with Streaks
- "Off-peak laundry streak: 4 days"
- "AC pre-cool habit: 2 of 7 days this week"
- Weekly mission: "Shift 3 high-energy activities to off-peak this week — earn your Grid Hero badge"
- Progress bar with estimated cumulative savings
- Explicit habit loop surface: action completed → streak updated → next milestone shown → badge earned

#### Feature 6: Monthly Analysis Page (NEW)

Transforms SP's monthly usage total into a rich, explainable breakdown. Fires the `monthly_analysis_ready` proactive insight.

**Six sections**:
1. **Monthly summary** — Total kWh, estimated bill, CO2, change vs last month, change vs 3-month baseline
2. **Estimated appliance breakdown** — Monthly donut + appliance table (kWh, cost, share, trend)
3. **Key insights** — 3 plain-language sentences: "Cooling was your biggest driver", "Laundry shifted later on 4 more days", "Evening peak fell 9%"
4. **Similar-home benchmark** — Percentile rank vs same flat type in same neighbourhood ("You used 6% more than similar 4-room homes in Toa Payoh")
5. **Recommended next actions** — Top 3 actions for next month with projected monthly impact
6. **Grid impact** — Peak reduction kWh, Grid Helper Score trend, "Your home avoided X kWh during stress windows"

#### Feature 7: Privacy-Safe Neighbourhood Leaderboard (NEW)

**Composite score formula** (transparent to users):
```
Grid Hero Score = (Grid Helper Score × 50%) + (kWh reduction vs baseline × 30%) + (habit consistency × 20%)
```

**Why this formula**: Grid Helper alone is strong but not enough for consumer motivation. Raw reduction alone rewards high-baseline homes unfairly. Composite keeps it demand-response-aligned while being motivating.

**Leaderboard tiers** (weekly reset):
- Grid Hero (top 10%)
- Peak Saver (top 25%)
- Flex-Ready (top 50%)
- Getting Started (bottom 50%)

**Privacy design**:
- No real names or addresses
- Anonymous IDs: `TPY-4R-018`, `TPY-4R-031`, `You`
- Scoped to: same flat type within same neighbourhood
- Display: "You rank #18 of 126 among 4-room HDB homes in Toa Payoh this week"

**Motivating mechanics**:
- Percentile rank ("You beat 86% of similar homes")
- Near-goal framing: "One more off-peak laundry cycle moves you into top 10%"
- Weekly reset keeps it fresh and achievable
- Three tabs: This Week · Similar Homes · Grid Heroes

**Connection to grid**: Leaderboard caption — "Top performers collectively reduced 2.3 MWh of peak demand across Toa Payoh this week"

#### Feature 8: Explainable Impact Dashboard
- Month-over-month comparison: actual kWh vs. baseline (counterfactual without behaviour change)
- Per-recommendation tracking: "Did the user follow this advice? What was the actual outcome?"
- Clearly labeled: "Projected impact" (recommendations not yet followed) vs "Estimated observed" (based on actual interval data after recommendation)
- Aggregate: S$ saved, kg CO2 avoided, peak kW reduced
- "Your changes this month equivalent to: X trees planted / X km not driven"

---

## Technical Architecture

### Stack (24hr buildable)
| Component | Technology | Rationale |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | Already in project, single-page demo |
| AI Coach | Claude API (claude-haiku-4-5) | Fast, cost-effective for conversational coaching |
| **Analytics DB** | **ClickHouse Cloud** | **43.2M rows of half-hourly data, sub-second queries, real-time grid analytics** |
| **DB Client** | **@clickhouse/client (server-side)** | **Queries via Next.js API routes — no credential exposure** |
| Signal Extraction | TypeScript (API routes) | Deterministic baseline, peak detection, recommendation ranking |
| State | React useState | UI state only; data fetched from API routes |

### Architecture Diagram
```
Browser (Next.js frontend)
  |
  |-- /api/coach       --> Claude API (haiku) -- AI explanation + coaching
  |-- /api/intervals   --> ClickHouse Cloud   -- household half-hourly data
  |-- /api/grid        --> ClickHouse Cloud   -- neighbourhood aggregates (43.2M rows)
  |-- /api/insights    --> TypeScript logic   -- deterministic signal extraction
  |
ClickHouse Cloud
  |-- energy_intervals_raw        (MergeTree, 43.2M rows)
  |-- energy_interval_features    (ReplacingMergeTree, computed baselines)
  |-- neighborhood_slot_rollup    (AggregatingMergeTree MV, live rollups)
```

### Why ClickHouse (not SQLite/Postgres/in-memory)
- **Scale**: 43.2M rows (5,000 households × 180 days × 48 slots/day) — queries in milliseconds
- **Column-oriented**: perfect for time-series analytics (half-hourly slots, date ranges, aggregations)
- **Materialized views**: pre-computed neighbourhood rollups update automatically on insert
- **Demo credibility**: "We are not faking analytics in memory — ClickHouse serves live behavioural and grid queries over tens of millions of intervals fast enough for interactive coaching"
- **Dual challenge unlock**: SP Group challenge + ClickHouse special challenge rubric

### Why NOT MCP + RAG
- MCP: unnecessary overhead — not integrating multiple external tool providers
- RAG: overkill for a hackathon — structured insight objects instead of document retrieval
- LibreChat: not used as main UI — our Next.js chat interface is simpler and faster to build
- Use Claude API **only where AI genuinely adds value**: natural language explanation and coaching
- Use ClickHouse for **all analytics**: peak detection, baseline, neighbourhood comparison, DR analysis

---

## ClickHouse Integration (Special Challenge)

### Database Schema

**Table 1: Raw Interval Facts (MergeTree)**
```sql
CREATE TABLE energy_intervals_raw
(
  household_id    UInt64,
  neighborhood_id LowCardinality(String),
  flat_type       LowCardinality(String),
  tariff_plan     LowCardinality(String) DEFAULT 'regulated',
  ts              DateTime('Asia/Singapore'),
  interval_date   Date MATERIALIZED toDate(ts),
  slot_idx        UInt8 MATERIALIZED (toHour(ts) * 2 + intDiv(toMinute(ts), 30)),
  kwh             Decimal(8,3),
  cost_sgd        Decimal(8,4),
  carbon_kg       Decimal(8,4),
  peak_flag       Bool,
  dr_event_flag   Bool DEFAULT 0,
  ingestion_ts    DateTime DEFAULT now()
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(interval_date)
ORDER BY (household_id, interval_date, ts);
-- Scale: 5,000 households x 180 days x 48 slots = 43.2M rows
```

**Table 2: Computed Features (ReplacingMergeTree)**
```sql
CREATE TABLE energy_interval_features
(
  household_id      UInt64,
  ts                DateTime('Asia/Singapore'),
  interval_date     Date,
  slot_idx          UInt8,
  baseline_kwh      Decimal(8,3),   -- rolling 4-week same-slot avg
  excess_kwh        Decimal(8,3),   -- kwh - baseline_kwh
  anomaly_score     Float32,        -- z-score vs baseline
  shiftable_candidate Bool,
  grid_helper_points Float32,
  version_ts        DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(version_ts)
PARTITION BY toYYYYMM(interval_date)
ORDER BY (household_id, interval_date, ts);
-- ReplacingMergeTree: recompute baselines by inserting newer version, not UPDATE
```

**Table 3: Neighbourhood Rollup (AggregatingMergeTree + MV)**
```sql
CREATE TABLE neighborhood_slot_rollup
(
  neighborhood_id LowCardinality(String),
  interval_date   Date,
  slot_idx        UInt8,
  total_kwh       AggregateFunction(sum, Decimal(12,3)),
  homes           AggregateFunction(uniq, UInt64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(interval_date)
ORDER BY (neighborhood_id, interval_date, slot_idx);

CREATE MATERIALIZED VIEW neighborhood_slot_rollup_mv
TO neighborhood_slot_rollup AS
SELECT
  neighborhood_id,
  interval_date,
  slot_idx,
  sumState(kwh)              AS total_kwh,
  uniqState(household_id)    AS homes
FROM energy_intervals_raw
GROUP BY neighborhood_id, interval_date, slot_idx;
-- MV updates live on every insert — no manual refresh needed
```

### Design Decisions (ClickHouse Best Practices)
- `LowCardinality(String)` for flat_type, neighborhood_id, tariff_plan — low unique values
- `UInt8` for slot_idx (0-47) — minimal bitwidth
- No `Nullable` columns — use defaults instead
- Monthly partitioning — not by household or day (avoid too many parts)
- Primary key order: household_id first, then date, then ts — matches drilldown query pattern
- Never `ALTER TABLE UPDATE` features — insert new version via ReplacingMergeTree

### 5 Live Demo SQL Queries

**Query 1: Peak-Load Heatmap (Neighbourhood Grid View)**
```sql
SELECT
  interval_date,
  slot_idx,
  round(sumMerge(total_kwh), 2) AS total_kwh_mwh,
  formatReadableQuantity(uniqMerge(homes))  AS active_homes
FROM neighborhood_slot_rollup
WHERE neighborhood_id = 'toa-payoh'
  AND interval_date >= today() - 7
GROUP BY interval_date, slot_idx
ORDER BY interval_date, slot_idx;
-- Hits pre-aggregated MV — returns in <100ms even at full scale
```

**Query 2: Household Anomaly Detection**
```sql
SELECT
  r.ts,
  r.kwh,
  f.baseline_kwh,
  round(r.kwh - f.baseline_kwh, 3) AS excess_kwh,
  f.anomaly_score
FROM energy_intervals_raw r
ANY INNER JOIN energy_interval_features f
  USING (household_id, ts, interval_date, slot_idx)
WHERE r.household_id = 10042
  AND r.interval_date = today() - 1
  AND f.anomaly_score > 2
ORDER BY f.anomaly_score DESC
LIMIT 10;
```

**Query 3: Similar-Home Comparison (Mdm Tan vs Neighbours)**
```sql
WITH mdm_tan AS (
  SELECT sum(kwh) AS day_kwh
  FROM energy_intervals_raw
  WHERE household_id = 10042
    AND interval_date = today() - 1
)
SELECT
  (SELECT day_kwh FROM mdm_tan) AS mdm_tan_kwh,
  quantileExact(0.5)(day_kwh)   AS neighbourhood_median_kwh,
  quantileExact(0.9)(day_kwh)   AS neighbourhood_p90_kwh
FROM (
  SELECT household_id, sum(kwh) AS day_kwh
  FROM energy_intervals_raw
  WHERE flat_type = '4-room HDB'
    AND neighborhood_id = 'toa-payoh'
    AND interval_date = today() - 1
  GROUP BY household_id
);
-- "Mdm Tan used 8% more than the median similar home yesterday"
```

**Query 4: Demand-Response Event Impact**
```sql
SELECT
  dr_event_flag,
  slot_idx,
  round(avg(kwh), 3)            AS avg_kwh_per_slot,
  count()                       AS interval_count
FROM energy_intervals_raw
WHERE neighborhood_id = 'toa-payoh'
  AND interval_date >= today() - 28
GROUP BY dr_event_flag, slot_idx
ORDER BY slot_idx, dr_event_flag;
-- Shows measurable load reduction during DR events vs normal slots
```

**Query 5: Grid Helper Leaderboard (Top Flexible Households)**
```sql
SELECT
  f.household_id,
  round(sumIf(f.excess_kwh, r.peak_flag = 1), 2) AS peak_excess_kwh,
  round(sum(f.grid_helper_points), 2)             AS grid_helper_score
FROM energy_interval_features f
ANY INNER JOIN energy_intervals_raw r
  USING (household_id, ts, interval_date, slot_idx)
WHERE f.interval_date >= today() - 7
GROUP BY f.household_id
ORDER BY grid_helper_score DESC
LIMIT 20;
-- "Top 20 most grid-flexible homes in Toa Payoh this week"
```

### Next.js API Route Pattern (Safe ClickHouse Access)
```typescript
// app/api/grid/route.ts
import { createClient } from '@clickhouse/client'

const client = createClient({
  host: process.env.CLICKHOUSE_HOST,
  username: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
  database: 'wattcoach',
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const neighborhood = searchParams.get('neighborhood') ?? 'toa-payoh'

  const result = await client.query({
    query: `
      SELECT interval_date, slot_idx, round(sumMerge(total_kwh), 2) AS total_kwh
      FROM neighborhood_slot_rollup
      WHERE neighborhood_id = {neighborhood:String}
        AND interval_date >= today() - 7
      GROUP BY interval_date, slot_idx
      ORDER BY interval_date, slot_idx
    `,
    query_params: { neighborhood },
    format: 'JSONEachRow',
  })
  const rows = await result.json()
  return Response.json(rows)
}
```

### Data Generation Script (to populate 43.2M rows)
```typescript
// scripts/seed-clickhouse.ts
// 5,000 households x 180 days x 48 slots = 43,200,000 rows
// Batch insert 50,000 rows at a time
// Realistic patterns: AC spikes at 8-11pm, laundry at 9pm, low overnight
// Neighborhoods: toa-payoh (2,000), bedok (1,500), jurong-west (1,500)
// Flat types: 4-room HDB (60%), 5-room HDB (25%), Condo (15%)
```

### ClickHouse Special Challenge Positioning
| What ClickHouse Judges Look For | How WattCoach Delivers |
|---|---|
| Clear fit for ClickHouse | Half-hourly time-series energy data — textbook ClickHouse use case |
| Visible scale | 43.2M rows, not a toy dataset |
| Real-time analytical usefulness | Live SQL driving interactive coach + grid views |
| ClickHouse-native design | Proper MergeTree, ReplacingMergeTree, AggregatingMergeTree MV |
| Integration depth | ClickHouse powers both household coach AND city-scale grid analytics |
| Demo credibility | Sub-second queries, explainable metrics, sensible schema |

### Optional: HyperDX/ClickStack Observability (Stretch Goal)
If time allows, emit OpenTelemetry events to HyperDX to track:
- `recommendation_shown` → `recommendation_accepted` → `recommendation_followed` → `impact_verified`
- Claude API latency per query
- ClickHouse query latency per endpoint
- This demonstrates WattCoach is "production-instrumented" — bonus for engineering quality judges

**Verdict on ClickHouse products**:
- ClickHouse Cloud: **YES — core integration**
- LibreChat: **NO — our Next.js chat is better and faster to build**
- HyperDX/ClickStack: **OPTIONAL — add only if P0 features are stable**

---

## Smart Home Automation Layer (MCP Tool-Calling)

### Concept: From Recommendations to Actions

WattCoach goes beyond advice. When the AI coach recommends "Set AC timer: 10pm-2am at 25°C", the user can say **"Do it"** — and WattCoach executes the schedule automatically.

```
Recommendation → User approves → Claude calls tool → Action confirmed in UI
                                                   → Simulator chart updates
                                                   → ClickHouse logs action event
```

### Verdict: GO-WITH-CONSTRAINTS (Codex-verified)

| Option | Verdict | Reason |
|---|---|---|
| Real Google Home / Nest SDM | NO-GO | Requires physical Nest device, $5 enrollment, OAuth, GCP project — blocked without hardware |
| Real Alexa Smart Home Skills | NO-GO | Requires AWS Lambda, Alexa developer account, account linking, physical Alexa device |
| Home Assistant integration | RISKY | Possible but 6-10hr overhead unless team knows it already |
| **Mock MCP tool-calling layer** | **GO** | **Feasible in 2-4hrs, impressive in demo, honest about simulation** |

**Build only after P0 features (ClickHouse + chart + coach) are stable.**

### What to Build: Mock Smart Home Action Service

**Step 1 — Server-side device state store** (in-memory JSON for demo):
```typescript
// lib/device-store.ts
interface DeviceAction {
  actionId: string
  householdId: string
  deviceId: string
  actionType: 'ac_schedule' | 'laundry_delay' | 'standby_off'
  params: Record<string, unknown>
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  projectedKwhSaved: number
  projectedSgdSaved: number
  createdAt: string
}

// In-memory store (survives the demo session)
const deviceActions: DeviceAction[] = []
```

**Step 2 — Claude tool definitions** (passed to Messages API `tools` parameter):
```typescript
const SMART_HOME_TOOLS = [
  {
    name: 'set_ac_schedule',
    description: 'Schedule the air-conditioner to turn on and off at specific times, with optional temperature setting. Use when the user wants to automate their AC timing.',
    input_schema: {
      type: 'object',
      properties: {
        householdId:   { type: 'string' },
        deviceId:      { type: 'string', default: 'ac.bedroom' },
        startTime:     { type: 'string', description: 'ISO 8601 datetime in SGT' },
        endTime:       { type: 'string', description: 'ISO 8601 datetime in SGT' },
        temperatureC:  { type: 'number', minimum: 16, maximum: 30, default: 25 }
      },
      required: ['householdId', 'startTime', 'endTime']
    }
  },
  {
    name: 'schedule_laundry_cycle',
    description: 'Schedule the washing machine to start at a specific off-peak time. Use when user wants to shift laundry to off-peak hours.',
    input_schema: {
      type: 'object',
      properties: {
        householdId: { type: 'string' },
        startTime:   { type: 'string', description: 'ISO 8601 datetime in SGT, preferably after 11pm' }
      },
      required: ['householdId', 'startTime']
    }
  }
]
```

**Step 3 — Tool execution handler** (Next.js API route):
```typescript
// app/api/coach/route.ts (extended)
async function executeToolCall(tool: ToolCall): Promise<ToolResult> {
  if (tool.name === 'set_ac_schedule') {
    const { startTime, endTime, temperatureC = 25 } = tool.input
    // Compute projected savings deterministically
    const durationHours = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 3600000
    const projectedKwh = durationHours * 0.2  // ~0.2 kWh/hr savings from optimised schedule
    const projectedSgd = projectedKwh * 0.2911

    const action: DeviceAction = {
      actionId: `ACT-${Date.now()}`,
      householdId: tool.input.householdId,
      deviceId: 'ac.bedroom',
      actionType: 'ac_schedule',
      params: tool.input,
      status: 'scheduled',
      projectedKwhSaved: projectedKwh,
      projectedSgdSaved: projectedSgd,
      createdAt: new Date().toISOString()
    }
    deviceActions.push(action)

    return {
      status: 'scheduled',
      actionId: action.actionId,
      message: `AC scheduled: ${startTime} to ${endTime} at ${temperatureC}°C`,
      projectedKwhSaved: projectedKwh,
      projectedSgdSaved: projectedSgd
    }
  }
  // ... handle schedule_laundry_cycle similarly
}
```

**Step 4 — UI confirmation** (after tool call returns):
```
[Chat bubble] "Done! I've scheduled your AC:"
┌─────────────────────────────────────────┐
│  AC Bedroom  [Automated] ✓              │
│  10:00pm → 2:00am  •  25°C             │
│  Tonight's saving: 0.8 kWh • S$0.23    │
│  [Cancel]  [View in simulator]          │
└─────────────────────────────────────────┘
```
- Simulator chart updates automatically to show the scheduled shift
- ClickHouse logs the `action_scheduled` event (for observability)

### MCP Branding (Optional — if time allows)
If the team wants the explicit "MCP" story for judges:
1. Wrap the tool handler behind a tiny `@modelcontextprotocol/sdk` TypeScript server
2. Connect via `mcp_servers` in the Anthropic client
3. Same tools, same actions — just adds the official MCP protocol layer

**If time is tight**: Use direct `tool_use` in the Messages API — functionally identical for the demo, and honest to describe as "MCP-compatible tool actions".

### Demo Language (How to Present This Honestly)
**SAY**: "For the demo, we use a simulated smart-home control layer exposed as tool actions via Claude's tool-use API — the same pattern as MCP. In production, this same action layer connects to real smart-home platforms like Google Home, Home Assistant, or Alexa."

**SAY**: "The important point is that WattCoach doesn't stop at recommendations — it can turn an accepted recommendation into an executable household action with one tap."

**DON'T SAY**: "We integrated with Google Home" (unless you actually did)

---

### Mock Data Schema (TypeScript types matching ClickHouse schema)
```typescript
interface HalfHourlyInterval {
  ts: string;              // ISO 8601 with SGT offset
  kwh: number;             // Consumption this half-hour
  day_type: 'weekday' | 'weekend';
  hour_bin: number;        // 0-47 (half-hour slots)
  estimated_carbon_kg: number;
  tariff_cents_per_kwh: number;
  activity_hint?: 'sleeping' | 'cooking' | 'laundry' | 'cooling' | 'idle';
  peak_flag: boolean;      // 7pm-11pm on weekdays
  baseline_kwh: number;    // Rolling 4-week same-slot average
  excess_kwh: number;      // kwh - baseline_kwh
  shiftable_candidate: boolean;
}

interface Household {
  household_id: string;
  flat_type: '4-room HDB' | '5-room HDB' | 'Condo' | 'Landed';
  has_aircon: boolean;
  has_ev: boolean;
  tariff_plan: 'regulated' | 'tou';
  tou_offpeak_start?: number;  // hour (e.g. 23 = 11pm)
  intervals: HalfHourlyInterval[];
}
```

### AI Insight Object (fed to Claude for explanation)
```typescript
interface EnergyInsight {
  type: 'peak_spike' | 'recurring_habit' | 'anomaly' | 'shift_opportunity';
  period: string;
  evidence: {
    peak_kwh: number;
    baseline_kwh: number;
    excess_kwh: number;
    peak_contribution_pct: number;
  };
  recommendation: {
    action: string;
    appliance_hint: string;
    shift_to: string;
    estimated_kwh_saved: number;
    estimated_sgd_saved: number;
    estimated_co2_kg_saved: number;
    confidence: 'high' | 'medium' | 'low';
  };
}
```

Claude's role: receive structured insight objects -> generate plain-language explanation + personalised advice. NOT raw interval processing.

### Metric Definitions & Assumptions (Technical Defensibility)

**Important**: All appliance-level attribution is **heuristic inference** from whole-home half-hourly data — not NILM disaggregation. This must be communicated correctly in the demo ("likely driven by", "estimated", "probable").

| Metric | Definition | Calculation |
|---|---|---|
| Baseline kWh | Rolling 4-week average of the same half-hour slot on the same day-type | `avg(kwh[same_slot, same_day_type, last_28_days])` |
| Peak window | Weekday 7pm-11pm (slots 38-45) — aligns with grid stress hours | Hardcoded for Singapore context |
| Excess kWh | `kwh - baseline_kwh` for each slot | Deterministic; never < 0 in display |
| Appliance attribution | Pattern heuristics: recurring 1.0-1.5 kWh spikes = likely washer; sustained 0.6-1.0 kWh for 3+ slots = likely AC | Always presented as "likely" / "estimated" |
| Grid Helper Score | `(peak_avoided_pct * 0.5) + (offpeak_shift_rate * 0.3) + (dr_participation * 0.2)` scaled to 0-100 | Deterministic rule, not ML |
| Confidence badge | High = evidence in 4+ of last 7 matching slots; Medium = 2-3; Low = 1 or inferred | Slot-match frequency count |
| Peak reduction % | `(baseline_peak_kwh - projected_peak_kwh) / baseline_peak_kwh * 100` | Shown only for the toggled simulator, not as historical fact |
| 45 MW extrapolation | `0.8 kW avg reduction * 56,250 households = 45 MW` — presented as illustrative scenario, not measured outcome | Clearly labeled as projection |

**LLM Fallback Strategy**:
- All numeric values (kWh, S$, CO2, %) are computed deterministically in code and passed as structured context to Claude — Claude never calculates numbers
- If Claude API is unavailable: show pre-computed insight cards with static explanation text (no chat mode)
- For unexpected judge questions: constrain the system prompt to only answer questions about the household's data; gracefully redirect off-topic queries to "I can only analyse your energy data"
- All Claude outputs go through a post-processing check: if any number in the response differs from the injected context values, replace with "see the data card above"

---

## Demo Script (For Judges)

### Setup
- Persona: "Meet Mdm Tan, 64, living in a 4-room HDB in Toa Payoh with 2 grandchildren."
- Show 90-day mock half-hourly data loaded

### Demo Flow (8-10 minutes)

**Act 1: The Problem (1 min)**
- Show SP App as-is: "Here is the half-hourly chart. What does this mean? What should Mdm Tan do?"
- Answer: nothing. Raw numbers. No guidance. No proactive alerts. No appliance breakdown.

**Act 2: Proactive Coach** [WOW MOMENT #1 — 2 min]
- Open WattCoach. Notification bell shows "1 new insight"
- After 3 seconds, banner slides in: "New insight: Your 8pm-10pm usage is projected above your usual Thursday pattern"
- "WattCoach did not wait for Mdm Tan to ask. It found the issue on its own."
- Open insight: coach explains AC + laundry overlap pattern with evidence (28% above baseline)
- Shows 3 ranked actions with S$, CO2, confidence badge
- Mdm Tan taps "Do this for me" on the AC recommendation
- `set_ac_schedule` fires: "Done! AC scheduled 10pm-2am at 25°C — tonight's saving: 0.8 kWh, S$0.23"

**Act 3: Simulator + Appliance Breakdown (2 min)** [WOW MOMENT #2]
- Chart updates: AC schedule block appears at 10pm, peak bars drop visibly
- Toggle laundry delay ON — 9pm peak bar drops further
- Live counter: "Tonight: 1.3 kWh saved · S$0.38 · 0.52 kg CO2"
- Switch to Analysis tab — stacked bar shows: AC layer in evening, washer spike, fridge baseline
- Monthly donut: "Estimated cooling: 42% of your usage — your biggest driver"
- "SP App shows total kWh. WattCoach shows what is actually driving it."

**Act 4: Leaderboard + Grid Hero Score (1 min)**
- Leaderboard tab: "Mdm Tan ranks #18 of 126 — 4-room HDB homes in Toa Payoh this week"
- "She beat 86% of similar homes. Up from #31 last week."
- "One more off-peak laundry cycle → top 10%"
- Grid Hero Score: 73/100, tier: "Flex-Ready Home"

**Act 5: Neighbourhood Grid View (ClickHouse)** [WOW MOMENT #3 — 2 min]
- Switch to City Grid: "Zoom out from Mdm Tan's home to all of Toa Payoh"
- Live ClickHouse query — 43.2M rows, returns in under 1 second
- Peak-load heatmap: "If 15% of Toa Payoh 4-room homes act on tonight's WattCoach insight, peak demand drops by X kWh"
- "That is a ClickHouse materialized view running live at SP Group operating scale."

**Act 6: Monthly Impact (1 min)**
- Monthly report: "8.3% reduction, S$9.48 saved, 11.2 kg CO2 avoided this month"
- "100,000 households doing this = 45 MW peak deferral — equivalent to a small peaker plant"

**Closing**: "WattCoach is the AI layer between raw SP data and real behaviour change. Proactive. Explainable. Actionable. Verified. The full loop — closed."

---

## Page Structure (Frontend)

### Section 1: Hero
- SP Group blue (#003399 or similar) + SP Group aesthetic
- Title: "WattCoach"
- Subtitle: "AI-powered energy behaviour coach for Singapore households"
- SP Group + HackOMania 2026 branding

### Section 2: The Problem
- 4 pain point cards (data without meaning, no action, no verification, no grid connection)

### Section 3: Interactive Demo (MOST IMPORTANT — 70% of build time)

**Left Panel: AI Coach Chat**
- Chat interface: Mdm Tan's household profile shown
- Pre-loaded conversation starters ("Why was my bill high?", "What should I do tonight?")
- AI response with structured cards: action + savings + CO2 + confidence badge
- Typing animation, streamed response feel

**Right Panel: Half-Hourly Chart + Simulator**
- 48-slot bar chart for "today" (current day's projected usage)
- Toggle switches for each recommendation
- Live update: S$ saved counter, CO2 counter, peak reduction %
- Grid Helper Score badge (updates with toggles)

**Below: Habit Tracker Strip**
- Streak cards: Off-peak laundry | AC pre-cool | Standby off
- Weekly mission progress bar

### Section 4: Impact Dashboard
- Month-over-month comparison chart (actual vs. baseline)
- Per-recommendation card: "Did you follow this? Outcome: -0.8 kWh"
- Cumulative: S$ saved, CO2 avoided, "Grid Stress Avoided" in kW

### Section 5: How It Works (Technical)
- 3-layer architecture diagram: Signal Extraction -> AI Coaching -> Behaviour Loop
- Tech badges: Claude API, Next.js, SP Group half-hourly data

### Section 6: Footer
- "Built for HackOMania 2026 — SP Group Track: AI for Actionable Energy Behaviour Change"

---

## Hardcoded Demo Data

### Household Profile
```typescript
const MDM_TAN = {
  name: "Mdm Tan",
  flat_type: "4-room HDB",
  block: "Blk 247 Toa Payoh Central",
  household_size: 3,
  has_aircon: true,
  has_ev: false,
  tariff_plan: "regulated",
  monthly_avg_kwh: 412,  // slightly above 4-room average
  baseline_monthly_kwh: 380.7
}
```

### Pre-Built AI Coach Conversations
```typescript
const CONVERSATIONS = {
  why_high_tuesday: {
    question: "Why was my electricity so high last Tuesday night?",
    response: {
      explanation: "Your Tuesday evening (7pm-11pm) used 4.2 kWh — 68% above your usual Tuesday baseline of 2.5 kWh. The likely drivers: your air-conditioner ran continuously for 4 hours (estimated 2.8 kWh), and a washing machine cycle around 9pm (estimated 1.1 kWh). Running both at peak hours means paying full grid rates and adding to demand stress.",
      insight_type: "peak_spike",
      evidence: { peak_kwh: 4.2, baseline_kwh: 2.5, excess_kwh: 1.7, excess_pct: 68 }
    }
  },
  what_tonight: {
    question: "What should I do tonight to save money?",
    response: {
      recommendations: [
        {
          rank: 1,
          action: "Pre-cool your home at 6pm for 30 min, then raise thermostat to 25 degrees C",
          appliance: "Air-conditioner",
          shift_to: "Before 7pm (off-peak window)",
          kwh_saved: 0.8,
          sgd_saved: 0.23,
          co2_kg_saved: 0.32,
          confidence: "high"
        },
        {
          rank: 2,
          action: "Schedule your laundry cycle to start after 11pm",
          appliance: "Washing machine",
          shift_to: "After 11pm",
          kwh_saved: 1.1,
          sgd_saved: 0.32,
          co2_kg_saved: 0.44,
          confidence: "high"
        },
        {
          rank: 3,
          action: "Switch off TV and set-top box at the power point before bed",
          appliance: "Standby devices",
          shift_to: "Eliminate (not shift)",
          kwh_saved: 0.15,
          sgd_saved: 0.04,
          co2_kg_saved: 0.06,
          confidence: "medium"
        }
      ]
    }
  }
}
```

### Grid Helper Score
```typescript
const GRID_HELPER = {
  this_week: 73,
  last_week: 58,
  breakdown: {
    peak_hours_avoided_pct: 15,
    offpeak_laundry_streak: 4,
    demand_response_events: 0,
    ac_precool_habit: 3  // of 7 days
  },
  label: "Flex-Ready Home",
  next_milestone: { score: 80, label: "Grid Hero" }
}
```

### Impact Report
```typescript
const IMPACT_REPORT = {
  period: "February 2026",
  actual_kwh: 378,
  baseline_kwh: 412,
  reduction_kwh: 34,
  reduction_pct: 8.3,
  sgd_saved: 9.90,
  co2_kg_avoided: 13.7,
  recommendations_followed: 11,
  recommendations_total: 16,
  follow_rate_pct: 69,
  grid_contribution: "Equivalent to 0.8 kW peak demand reduction"
}
```

---

## Build Priority (24-Hour Timeline)

### Phase 0: ClickHouse Setup (Do First — 1.5-2 hrs)

| Step | Action | Time |
|---|---|---|
| 1 | Create ClickHouse Cloud service, get credentials | 15 min |
| 2 | Create 3 tables + MV (copy SQL from PRD) | 30 min |
| 3 | Run data generation script — seed 43.2M rows in batches | 45 min |
| 4 | Test 2 queries from Next.js API route | 20 min |

**Do this first. All P0 features depend on ClickHouse being live.**

### True MVP (P0 — Must ship)

| Priority | Feature | Time | Impact |
|---|---|---|---|
| P0 | **ClickHouse Cloud + 43.2M row dataset** | 1.5-2 hrs | Foundation — everything depends on this |
| P0 | **Proactive insight engine** (3 triggers, notification bell + banner) | 2-3 hrs | WOW #1 — proactive coach moment |
| P0 | **Interactive chart + toggle simulator** (reads ClickHouse via API) | 3-4 hrs | WOW #2 — peak-shift visualisation |
| P0 | **AI Coach** (Claude API, passive chat + set_ac_schedule tool action) | 2-3 hrs | Recommendation → Action flow |

**Ship P0. Demo wins both SP + ClickHouse tracks with just these.**

### Stretch Goals (P1 — Add if P0 is stable)

| Priority | Feature | Time | Impact |
|---|---|---|---|
| P1 | **Neighbourhood Grid View** (live ClickHouse MV, peak heatmap) | 1-2 hrs | WOW #3 — grid scale story |
| P1 | **Estimated appliance breakdown** (stacked bar + monthly donut) | 1-2 hrs | "What's driving my usage" story |
| P1 | **Privacy-safe leaderboard** (neighbourhood cohort, weekly composite score) | 1-2 hrs | Gamification + habit motivation |
| P1 | Grid Hero Score display + tier badges | 1 hr | Demand-response credibility |
| P1 | Monthly analysis panel (appliance + similar-home benchmark) | 1-2 hrs | Long-term habit story |

### Nice-to-Have (P2 — Only if P0+P1 done)

| Priority | Feature | Time | Impact |
|---|---|---|---|
| P2 | Impact Report before/after chart | 1 hr | Verified behaviour change |
| P2 | Habit Tracker + streaks strip | 1 hr | Gamification completeness |
| P2 | Hero + Problem Statement sections | 1 hr | Polish |
| P3 | HyperDX observability (optional bonus) | 1-2 hrs | Engineering quality |
| P3 | How It Works + Footer | 1 hr | Completeness |

**Total MVP (P0): ~9-12 hrs. Full build (P0+P1+P2): ~18-22 hrs.**

**Scope discipline rules**:
- Do NOT start P1 until all P0 features demo end-to-end reliably
- Do NOT start P2 until P1 Neighbourhood Grid View and Leaderboard are working
- Proactive coach notification is P0 — it is the #1 WOW moment, non-negotiable

---

## SP "What Success Looks Like" — Full Alignment

| SP Success Criterion | WattCoach Feature | Status |
|---|---|---|
| **1. Make Energy Data Easy to Understand** | | |
| Explain half-hourly usage patterns | Proactive insight coach + stacked bar chart | ✓ |
| Highlight peak hours and unusual spikes | Peak_spike_detected trigger + 48-slot chart | ✓ |
| Help users understand what is driving their use | Estimated appliance breakdown (heuristic) | ✓ |
| **2. Actionable Behaviour Recommendations** | | |
| Simple, practical behaviour changes | Ranked top-3 recommendations per insight | ✓ |
| Specific actions (shift laundry, adjust AC) | set_ac_schedule, schedule_laundry tools | ✓ |
| Transparent and easy to understand | Evidence cards: baseline vs actual, confidence | ✓ |
| Gamify to encourage smarter use | Leaderboard + Grid Hero tiers + streaks | ✓ |
| **3. Measurable Impact** | | |
| Cost savings | S$ counter in simulator + monthly report | ✓ |
| Carbon reduction | CO2 kg counter, monthly CO2 total | ✓ |
| Lower peak demand | Peak reduction % in simulator, Grid Helper Score | ✓ |
| **4. Build Long-Term Habits** | | |
| Track progress over time | Monthly analysis page, Grid Helper trend | ✓ |
| Provide feedback loops | Action → streak → badge → next milestone | ✓ |
| Reward consistent sustainable behaviours | Leaderboard tiers, streak badges | ✓ |
| Make energy efficiency feel achievable | Near-goal framing ("one more cycle = top 10%") | ✓ |
| **5. Connect Individual Actions to Bigger Picture** | | |
| Show how personal changes support grid reliability | Grid Helper Score in main UI, DR window insight | ✓ |
| Link daily habits to broader energy efficiency goals | Neighbourhood Peak Stress Explorer, 45 MW macro claim | ✓ |

**Gap assessment**: No significant gaps remaining. All 5 criteria are directly addressed by named features.

**Key remaining risk**: The explicitness of the behaviour loop. Must show the full chain in demo:
```
Proactive insight → User accepts → Action executed → Chart shows projected drop →
Next day: "Did you follow through?" → Outcome tracked → Habit reinforced → Leaderboard updates
```

---

## Judging Criteria Alignment

### SP Group Track
| Criterion | Weight | How WattCoach Delivers |
|---|---|---|
| Impact | 30% | Demonstrated S$ savings, CO2 avoided, peak kW reduced — grounded in real Singapore tariff and emission data. 100K household extrapolation = 45 MW peak deferral. |
| Relevance | 15% | Singapore HDB context, SP Group half-hourly data, real tariff (S$0.2911/kWh), NEA household profiles, demand response pilot stats. |
| Solution Complexity | 20% | AI used intentionally: LLM for explanation only, ClickHouse for analytics at scale. Correct layered architecture a data scientist will respect. |
| Product Execution | 35% | Working end-to-end: real Claude API calls, live ClickHouse queries, interactive chart, before/after tracking. Judges can interact live. |

### ClickHouse Special Challenge
| Criterion | How WattCoach Delivers |
|---|---|
| Clear fit for ClickHouse | Half-hourly time-series energy data — textbook ClickHouse use case |
| Visible scale | 43.2M rows (5,000 households × 180 days × 48 slots) — not a toy dataset |
| Real-time analytical usefulness | Live SQL drives interactive coach + Neighbourhood Peak Stress Explorer |
| ClickHouse-native design | MergeTree + ReplacingMergeTree + AggregatingMergeTree MV — not "Postgres but faster" |
| Integration depth | ClickHouse powers both household coach AND city-scale grid analytics |
| Demo credibility | Sub-second queries, explainable metrics, defensible schema |

---

## Competitive Differentiation

| What others do | What WattCoach does differently |
|---|---|
| Show data | Close the loop: data -> action -> verified outcome |
| Generic tips | Interval-data-grounded, explainable recommendations |
| Bill savings only | Grid stability contribution + carbon impact |
| Advice without tracking | Per-recommendation follow-up: did you do it? what happened? |
| Generic gamification | Peak-shift streaks tied to real grid contribution |
| Dashboards | Conversational AI coach (ask anything about your data) |

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Claude API latency in live demo | High | Low | Pre-stream responses, show loading state; have static fallback cards ready |
| Mock data feels fake | Medium | Medium | Generate realistic 90-day dataset with weekday/weekend patterns, AC spikes, laundry cycles |
| Chart complexity overruns time | High | Medium | Build static chart first, add toggle interactivity after basic layout works |
| TOU vs regulated tariff confusion | Medium | Low | Clarify in demo: "For SP regulated users, benefit is grid contribution + habit; TOU users also get direct bill savings" |
| Judge asks for real SP API data | Low | Low | Be upfront: "This is a demo with realistic mock data. In production, SP's AMI API feeds directly into this layer." |
| **Appliance attribution credibility challenge** | **High** | **Medium** | Always use "likely driven by", "estimated", "probable" — never claim certainty. Explicitly acknowledge in demo: "We use pattern heuristics since the SP App provides whole-home data, not device-level disaggregation." |
| **LLM numeric hallucination** | **High** | **Medium** | All numbers computed in code and injected as context. Claude never calculates — only explains. Post-process responses to verify numbers match injected values. |
| **Overclaiming behaviour change** | **Medium** | **Medium** | Clearly label impact report as "projected from following recommendations" — not observed real-world outcome. Use language: "If Mdm Tan followed these recommendations..." |
| Unexpected judge question derails LLM | Medium | Medium | Constrain system prompt to energy domain. Graceful redirect for off-topic: "I can only analyse your SP electricity data." |
| **Claiming real Google Home/Alexa integration** | **High** | **Low** | Never claim real device control. Demo language: "simulated smart-home layer; production connects to Google Home/Home Assistant." |
| **Smart home automation scope creep** | **High** | **High** | Do NOT build this until P0+P1 are stable. Mock with in-memory store only. Skip if running short on time. |

---

## Success Criteria for Demo

- [ ] AI Coach responds to at least 2 different user questions with grounded, personalised answers
- [ ] Peak-Shift Simulator updates chart live when recommendations are toggled
- [ ] S$ saved and CO2 avoided counters update in real-time with toggles
- [ ] Grid Helper Score is visible and explained
- [ ] Impact Report shows before/after with specific numbers
- [ ] Judge can ask the AI Coach a spontaneous question and get a sensible answer
- [ ] Total demo runtime: under 10 minutes

---

## Appendix: Clarification Summary

**Readiness Score**: 84/100

| Dimension | Score | Status |
|---|---|---|
| Problem Clarity | 27/30 | Defined: energy behaviour change challenge with clear judging criteria |
| Functional Scope | 20/25 | Defined: AI coach, simulator, gamification, impact tracking |
| Success Criteria | 14/20 | Defined: judging rubric Impact/Relevance/Complexity/Execution |
| Constraints | 14/15 | Defined: 24hr hackathon, software-only, no hardware |
| Priority/MVP | 9/10 | Defined: MVP first, demo-ready end-to-end |

**Key Assumption**: Singapore tariff for demo purposes uses regulated rate S$0.2911/kWh; TOU savings calculations assume Senoko/Geneco-style off-peak plans.

---

## Inspiration Credits (from Codex Research)

| Idea | Status | How Integrated |
|---|---|---|
| "Demand Response Copilot" framing | Adopted | Core positioning and pitch language |
| Next-best-action engine (not dashboard) | Adopted | Defines entire product philosophy |
| Explainable counterfactuals | Adopted | Central to AI Coach response format |
| Closed-loop verification | Adopted | Impact Report + per-recommendation tracking |
| Grid Helper Score | Adopted | Key metric in demo Act 4 |
| RAG for tip library | Adapted | Singapore NEA tips as static JSON (not vector DB) |
| Peak-shift streaks | Adapted | Focused on grid-relevant habits, not generic badges |
| MCP integration | Discarded | Unnecessary complexity for 24hr hackathon |
| Full RL/time-series modelling | Discarded | Out of scope; pitch architecture is credible without it |
| Community comparison | Discarded | Privacy complexity, out of demo scope |

---

---

## Review Summary

| Dimension | Score |
|---|---|
| Clarity | 9/10 |
| Completeness | 8/10 |
| Feasibility | 8/10 |
| Risk Assessment | 7/10 |
| Requirement Alignment | 9/10 |
| **Overall** | **8.2/10** |

Review rounds: 1 (PASSED)

Reviewer (Codex) summary: "Strong plan with clear product thesis, good Singapore-specific grounding, and strong alignment to the challenge and judge profile. Main improvements applied: tighter metric definitions, explicit heuristic framing for appliance attribution, reduced MVP scope to 3 core deliverables, and LLM fallback strategy added."

---

*WattCoach — Turning half-hourly data into lasting habits that help the grid.*