# Saivers — Architecture

> AI-powered energy behaviour coach · HackOMania 2026

---

## Two Interfaces, One Codebase

```mermaid
graph TD
    subgraph Repo["📦 Next.js 16 + React 19 — Single Repo · Vercel"]
        subgraph Mobile["/user — Mobile App"]
            U_DASH["Dashboard\nAircon · Rewards\nFocus · Profile"]
            U_API["API Routes\n/api/focus\n/api/aircon\n/api/xiaomi/purifier/on|off"]
        end

        subgraph Admin["/admin — Admin Dashboard"]
            A_DASH["Analytics · Incidents\nMonitoring · Recommendations"]
            A_LC["LibreChat\nNatural language\nQuery Interface"]
        end
    end

    subgraph AI["🤖 AI"]
        CLAUDE["Claude haiku-4-5\nPersonalised coaching\nFocus explanations"]
        OPENAI["OpenAI GPT-4o-mini\nWeekly energy insights"]
    end

    subgraph CH["🗄️ ClickHouse Cloud — GCP asia-southeast1"]
        CH_DATA["Energy data · AC readings\nHabit events · Rewards\nWeekly insights · Anomaly scores"]
    end

    subgraph HW["🏠 Hardware"]
        XP_API["Xiaomi Purifier API\nFastAPI · Port 8002"]
        DEVICE["Xiaomi Air Purifier 4\nmiIO · LAN · UDP"]
    end

    subgraph BE["⚙️ FastAPI Backend · Render"]
        BE_SVC["AI orchestration\nAnomaly detection\nRewards · Habits"]
    end

    %% Mobile app connections
    U_DASH --> U_API
    U_API -->|"30-day energy analytics"| CH
    U_API -->|"Focus coaching"| CLAUDE
    U_API -->|"Weekly insights"| OPENAI
    U_API -->|"Allow / Decline button"| XP_API
    U_API --> BE_SVC
    XP_API -->|"miIO UDP"| DEVICE

    %% Admin connections
    A_DASH --> A_LC
    A_LC -->|"Natural language → SQL"| CH
    A_DASH --> BE_SVC
    BE_SVC --> CH

    classDef mobile fill:#dbeafe,stroke:#3b82f6,color:#1e3a5f
    classDef admin fill:#ffedd5,stroke:#ea580c,color:#7c2d12
    classDef ai fill:#fce7f3,stroke:#db2777,color:#831843
    classDef db fill:#fef9c3,stroke:#ca8a04,color:#713f12
    classDef hw fill:#f3e8ff,stroke:#9333ea,color:#3b0764
    classDef be fill:#dcfce7,stroke:#16a34a,color:#14532d

    class U_DASH,U_API mobile
    class A_DASH,A_LC admin
    class CLAUDE,OPENAI ai
    class CH,CH_DATA db
    class XP_API,DEVICE hw
    class BE_SVC be
```

---

## Mobile App — AI + ClickHouse + Hardware

```mermaid
sequenceDiagram
    actor User as 👤 Household User
    participant App as Mobile App (/user)
    participant CH as ClickHouse
    participant Claude as Claude haiku-4-5
    participant XP as Xiaomi Purifier API
    participant Device as Air Purifier (LAN)

    User->>App: Opens Focus page
    App->>CH: Query 30-day energy patterns\n(baseline kWh, anomaly scores, peak usage)
    CH-->>App: Household energy data
    App->>Claude: Prompt with energy data
    Claude-->>App: "Why this works for you" explanation
    App-->>User: Personalised AI coaching card

    User->>App: Clicks Allow
    App->>XP: POST /api/test/xiaomi/purifier/on
    XP->>Device: miIO protocol · UDP LAN
    Device-->>XP: ACK — powered on
    XP-->>App: {success: true, provider: "miio"}
    App-->>User: "Saivers will configure this tonight ✓"

    User->>App: Clicks Decline
    App->>XP: POST /api/test/xiaomi/purifier/off
    XP->>Device: miIO protocol · UDP LAN
    Device-->>XP: ACK — powered off
    XP-->>App: {success: true, provider: "miio"}
    App-->>User: "No problem — steps still available"
```

---

## Admin Dashboard — LibreChat + ClickHouse

```mermaid
sequenceDiagram
    actor Admin as 🔧 Admin / Ops
    participant Dashboard as Admin Dashboard (/admin)
    participant LC as LibreChat
    participant CH as ClickHouse

    Admin->>Dashboard: Views analytics & incidents
    Dashboard->>CH: Pre-built queries\n(neighbourhood rollup, anomaly scores)
    CH-->>Dashboard: Charts & tables

    Admin->>LC: "Which households spiked this week?"
    LC->>CH: Natural language → SQL\nSELECT ... FROM energy_features
    CH-->>LC: Query results
    LC-->>Admin: Plain-language answer + table
```

---

## Key Technologies

| Interface | Technology | What It Does |
|-----------|-----------|--------------|
| **Mobile App** | Next.js · **ClickHouse** · **Claude haiku-4-5** · **OpenAI** · **python-miio** | Energy coaching + AI explanations + physical device control |
| **Admin Dashboard** | Next.js · **ClickHouse** · **LibreChat MCP** | Natural language energy analytics for ops team |
| Shared Backend | FastAPI · Python 3.14 | AI orchestration, anomaly detection, rewards, habits |
