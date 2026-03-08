# Saivers — System Architecture

> AI-powered energy behaviour coach for Singapore households · HackOMania 2026

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Users["👤 Users"]
        U1["Household User\n(Mobile Browser)"]
        U2["Admin / Ops\n(Desktop Browser)"]
    end

    subgraph Frontend["🖥️ Frontend — Next.js 16 · React 19 · Tailwind v4\n(Vercel)"]
        UA["/user — Mobile-first\nDashboard · Aircon · Rewards\nFocus · Profile"]
        AA["/admin — Desktop-first\nAnalytics · Incidents\nMonitoring · Recommendations"]
        API_ROUTES["Next.js API Routes /api/*\ncoach · intervals · aircon\ndevices · focus · insights\nxiaomi/purifier/on|off"]
    end

    subgraph Backend["⚙️ Saivers Backend — FastAPI · Python 3.14\n(Render · Port 8080)"]
        ROUTERS["Routers\ninsights · devices · habits\nadmin · aircon · ingest\nusage · weekly_insights\nrecommendations · focus"]
        SERVICES["Services\nai_service · anomaly_service\ndevice_store · habit_service\ninsight_service · reward_service"]
        MIGRATIONS["Migrations\nAuto-run on startup\n11 ClickHouse tables"]
    end

    subgraph DB["🗄️ ClickHouse Cloud\n(GCP asia-southeast1 · Port 443 TLS)"]
        T1["sp_energy_intervals\nMergeTree — half-hourly SP data"]
        T2["ac_readings\nMergeTree — AC appliance readings"]
        T3["energy_features\nReplacingMergeTree — baselines + anomaly scores"]
        T4["habit_events · reward_transactions\nMergeTree — append-only ledgers"]
        T5["weekly_insights · weekly_recommendations\nReplacingMergeTree — AI outputs"]
        T6["neighborhood_rollup + MV\nAggregatingMergeTree — pre-aggregated"]
    end

    subgraph Devices["🏠 Smart Devices"]
        ACS["AC Simulator\nFastAPI · In-memory\n80 units · 10 households\n(Render · Port 8002)"]
        XP["Xiaomi Purifier Service\nFastAPI · Port 8002\n(Local / Docker / Render)"]
        subgraph XP_Providers["Provider Fallback Chain"]
            P1["1️⃣ miIO Direct\n(LAN · UDP 54321)"]
            P2["2️⃣ Home Assistant\n(HTTP · Long-lived token)"]
            P3["3️⃣ Mock\n(Demo fallback)"]
        end
    end

    subgraph AI["🤖 AI Services"]
        CLAUDE["Claude API\n(haiku-4-5)\nCoaching · Focus explanations"]
        OPENAI["OpenAI API\n(GPT-4o-mini)\nWeekly insights · Why explanations"]
    end

    subgraph AdminAI["🧠 Admin AI — LibreChat\n(Docker · Port 3080)"]
        LC["LibreChat UI\nNatural language interface"]
        MCP["ClickHouse MCP Server\n(SSE · Port 8001)"]
    end

    %% User flows
    U1 --> UA
    U2 --> AA
    U2 --> LC

    %% Frontend internal
    UA --> API_ROUTES
    AA --> API_ROUTES

    %% Frontend → Backend
    API_ROUTES -->|"HTTP /api/*"| ROUTERS

    %% Frontend → ClickHouse direct (server-side)
    API_ROUTES -->|"@clickhouse/client\nserver-side only"| DB

    %% Frontend → Xiaomi Purifier (new integration)
    API_ROUTES -->|"POST /api/xiaomi/purifier/on|off\nPURIFIER_API_URL env var"| XP

    %% Backend internals
    ROUTERS --> SERVICES
    ROUTERS --> MIGRATIONS
    SERVICES --> DB
    SERVICES -->|"On startup"| MIGRATIONS

    %% Backend → AI
    SERVICES -->|"Coaching prompts"| CLAUDE
    SERVICES -->|"Insight generation"| OPENAI

    %% Backend → AC Simulator
    SERVICES -->|"AC control commands\nAC_SIMULATOR_URL"| ACS

    %% Xiaomi provider chain
    XP --> P1
    XP --> P2
    XP --> P3

    %% Admin AI
    LC --> MCP
    MCP -->|"SQL queries"| DB

    %% Styling
    classDef frontend fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    classDef backend fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef db fill:#fef9c3,stroke:#ca8a04,color:#713f12
    classDef devices fill:#f3e8ff,stroke:#9333ea,color:#3b0764
    classDef ai fill:#fce7f3,stroke:#db2777,color:#831843
    classDef adminai fill:#ffedd5,stroke:#ea580c,color:#7c2d12
    classDef users fill:#f1f5f9,stroke:#64748b,color:#1e293b

    class UA,AA,API_ROUTES frontend
    class ROUTERS,SERVICES,MIGRATIONS backend
    class T1,T2,T3,T4,T5,T6 db
    class ACS,XP,P1,P2,P3 devices
    class CLAUDE,OPENAI ai
    class LC,MCP adminai
    class U1,U2 users
```

---

## Data Flow — User Focus Page + Purifier Control

```mermaid
sequenceDiagram
    actor User as 👤 Household User
    participant FE as Next.js Frontend
    participant BE as FastAPI Backend
    participant CH as ClickHouse
    participant AI as Claude API
    participant XP as Xiaomi Purifier API

    User->>FE: Opens /user/focus
    FE->>BE: GET /api/focus/{householdId}
    BE->>CH: Query focus_actions table
    CH-->>BE: Focus action row
    BE-->>FE: action_title, steps, saving estimate
    FE-->>User: Renders page instantly (Phase 1)

    FE->>BE: GET /api/focus/{householdId}/why
    BE->>CH: Query energy_features + sp_energy_intervals
    CH-->>BE: 30-day usage patterns
    BE->>AI: Prompt with household data
    AI-->>BE: Personalised explanation + factors
    BE-->>FE: why, explanation, factors
    FE-->>User: Updates "Why this works" section (Phase 2)

    User->>FE: Clicks Allow
    FE->>FE: POST /api/xiaomi/purifier/on (Next.js proxy)
    FE->>XP: POST /api/test/xiaomi/purifier/on
    Note over FE,XP: PURIFIER_API_URL env var (server-side only)
    XP->>Device: miIO UDP command → 172.29.16.195
    Device-->>XP: ACK
    XP-->>FE: {success: true, provider: "miio"}
    FE-->>User: "Saivers will configure this tonight ✓"

    User->>FE: Clicks Decline
    FE->>FE: POST /api/xiaomi/purifier/off (Next.js proxy)
    FE->>XP: POST /api/test/xiaomi/purifier/off
    XP->>Device: miIO UDP command (power off)
    Device-->>XP: ACK
    XP-->>FE: {success: true, provider: "miio"}
    FE-->>User: "No problem — steps still available"
```

---

## Data Flow — Admin Monitors Household

```mermaid
sequenceDiagram
    actor Admin as 🔧 Admin / Ops
    participant LC as LibreChat
    participant MCP as ClickHouse MCP
    participant CH as ClickHouse
    participant BE as FastAPI Backend

    Admin->>LC: "Show households with anomalies this week"
    LC->>MCP: Natural language → SQL
    MCP->>CH: SELECT ... FROM energy_features WHERE anomaly_score > 2.0
    CH-->>MCP: Result rows
    MCP-->>LC: Formatted table
    LC-->>Admin: Anomaly report

    Admin->>BE: GET /api/admin/dashboard
    BE->>CH: Query neighborhood_rollup (sumMerge/uniqMerge)
    CH-->>BE: Aggregated stats
    BE-->>Admin: Dashboard summary JSON
```

---

## ClickHouse Schema

```mermaid
erDiagram
    SP_ENERGY_INTERVALS {
        UInt32 household_id
        LowCardinality_String neighborhood_id
        DateTime_Singapore ts
        Float32 kwh
        Bool peak_flag
        LowCardinality_String flat_type
    }

    AC_READINGS {
        UInt32 household_id
        LowCardinality_String device_id
        DateTime_Singapore ts
        Float32 power_w
        Bool is_on
        UInt8 temp_setting_c
    }

    ENERGY_FEATURES {
        UInt32 household_id
        DateTime_Singapore ts
        Float32 baseline_kwh
        Float32 anomaly_score
        DateTime version_ts
    }

    HABIT_EVENTS {
        UInt32 household_id
        LowCardinality_String habit_type
        Date event_date
        Bool achieved
        UInt16 streak_day
    }

    REWARD_TRANSACTIONS {
        UInt32 household_id
        LowCardinality_String reward_type
        Int32 points_earned
        DateTime created_at
    }

    WEEKLY_INSIGHTS {
        UInt32 household_id
        String insight_id
        LowCardinality_String signal_type
        LowCardinality_String status
        String ai_summary
        DateTime updated_at
    }

    NEIGHBORHOOD_ROLLUP {
        LowCardinality_String neighborhood_id
        Date interval_date
        UInt8 slot_idx
        AggregateFunction total_kwh
        AggregateFunction active_homes
    }

    SP_ENERGY_INTERVALS ||--o{ ENERGY_FEATURES : "computed from"
    SP_ENERGY_INTERVALS ||--o{ NEIGHBORHOOD_ROLLUP : "aggregated via MV"
    SP_ENERGY_INTERVALS ||--o{ HABIT_EVENTS : "evaluated daily"
    HABIT_EVENTS ||--o{ REWARD_TRANSACTIONS : "triggers points"
    ENERGY_FEATURES ||--o{ WEEKLY_INSIGHTS : "signals to AI"
```

---

## Deployment Architecture

```mermaid
graph LR
    subgraph Local["💻 Local Development"]
        L1["xiaomi-purifier backend\nuv run uvicorn app.main:app\n--port 8002"]
        L2["Next.js dev server\nnpx next dev · :3000"]
        L3["Saivers backend\nuv run uvicorn app.main:app\n--port 8000"]
        L4["LibreChat\ndocker compose up · :3080"]
    end

    subgraph Render["☁️ Render"]
        R1["saivers-backend\nFastAPI · Port 8080\nDockerfile (multi-stage)"]
        R2["ac-simulator\nFastAPI · Port 8002\nDockerfile"]
        R3["xiaomi-purifier\nFastAPI · Port 8080\nDockerfile (multi-stage + git)"]
    end

    subgraph Vercel["▲ Vercel"]
        V1["saivers-frontend\nNext.js · Edge Network"]
    end

    subgraph Cloud["☁️ Cloud Services"]
        CH["ClickHouse Cloud\nGCP asia-southeast1"]
        CLAUDE_API["Anthropic API\nClaude haiku-4-5"]
        OPENAI_API["OpenAI API\nGPT-4o-mini"]
    end

    V1 -->|"PURIFIER_API_URL"| R3
    V1 -->|"BACKEND_URL"| R1
    V1 -->|"@clickhouse/client"| CH
    R1 -->|"AC_SIMULATOR_URL"| R2
    R1 --> CH
    R1 --> CLAUDE_API
    R1 --> OPENAI_API
    L2 -->|"PURIFIER_API_URL=\nhttp://127.0.0.1:8002"| L1
    L2 -->|"localhost:8000"| L3
    L2 --> CH
```

---

## Component Summary

| Component | Tech | Port | Hosts | Role |
|-----------|------|------|-------|------|
| **Frontend** | Next.js 16, React 19, Tailwind v4, Recharts | 3000 | Vercel | User + Admin UI, API proxy routes |
| **Saivers Backend** | FastAPI, Python 3.14, clickhouse-connect | 8000 → 8080 | Render | 11 routers, AI orchestration, DB writes |
| **ClickHouse** | ClickHouse Cloud | 443 TLS | GCP asia-southeast1 | Time-series analytics, 11 tables |
| **AC Simulator** | FastAPI, Python | 8002 | Render | 80 virtual AC units, SSE live stream |
| **Xiaomi Purifier** | FastAPI, python-miio | 8002 (local) / 8080 (Render) | Local / Render | Real device control: miIO → HA → Mock |
| **LibreChat** | Docker, ClickHouse MCP | 3080 | Local | Admin natural-language ClickHouse queries |
| **Claude API** | Anthropic haiku-4-5 | — | Cloud | Focus explanations, coaching copy |
| **OpenAI API** | GPT-4o-mini | — | Cloud | Weekly insights, anomaly explanations |

---

## Domain Constants

| Constant | Value |
|----------|-------|
| Households | 1001 Ahmad · Punggol · 5-room · ~S$97/wk |
| | 1002 Priya · Jurong West · 4-room · ~S$44/wk |
| | 1003 Wei Ming · Bedok · 3-room · ~S$36/wk |
| Neighbourhood | `toa-payoh` (hardcoded for demo) |
| Tariff | S$0.2911 / kWh (SP Group Q1 2026) |
| CO₂ Factor | 0.402 kg CO₂ / kWh (EMA 2024) |
| Peak Window | 19:00–23:00 SGT (`peak_flag = true`, slots 38–45) |
| CDC Voucher | 500 pts = S$5 |
| Streak Milestones | 7d → +100 pts · 14d → +250 pts · 30d → +500 pts |
| Room Mapping | 1001→master-room · 1002→room-1 · 1003→room-2 · 1004→living-room |
