# Saivers — Architecture

> AI-powered energy behaviour coach · HackOMania 2026

---

## Tech Stack

```mermaid
graph TD
    FE["▲ Next.js 16 + React 19\nFrontend · Vercel"]
    BE["⚙️ FastAPI · Python 3.14\nBackend · Render"]
    CH["🗄️ ClickHouse Cloud\nTime-series Analytics"]
    CLAUDE["🤖 Claude API\nhaiku-4-5"]
    OPENAI["🤖 OpenAI API\nGPT-4o-mini"]
    XP["🌬️ Xiaomi Purifier API\nFastAPI · Port 8002"]
    DEVICE["📱 Xiaomi Smart\nAir Purifier 4"]

    FE -->|"REST"| BE
    FE -->|"@clickhouse/client\nserver-side"| CH
    BE --> CH
    BE -->|"Focus explanations"| CLAUDE
    BE -->|"Weekly insights"| OPENAI
    FE -->|"POST /api/xiaomi/purifier/on\nPOST /api/xiaomi/purifier/off"| XP
    XP -->|"miIO protocol\nUDP LAN"| DEVICE
```

---

## AI + ClickHouse — How It Works

```mermaid
sequenceDiagram
    participant User
    participant Next.js
    participant FastAPI
    participant ClickHouse
    participant Claude

    User->>Next.js: Opens Focus page
    Next.js->>FastAPI: GET /api/focus/{householdId}/why
    FastAPI->>ClickHouse: Query 30-day energy patterns\n(energy_features, sp_energy_intervals)
    ClickHouse-->>FastAPI: Baseline kWh, anomaly scores, peak usage
    FastAPI->>Claude: Prompt with household data
    Claude-->>FastAPI: Personalised "Why this works" explanation
    FastAPI-->>Next.js: explanation + factors
    Next.js-->>User: AI-personalised coaching card
```

---

## Xiaomi Smart Device Integration

```mermaid
sequenceDiagram
    participant User
    participant Next.js
    participant XiaomiAPI as Xiaomi Purifier API\n(FastAPI · :8002)
    participant Device as Xiaomi Air Purifier 4\n(LAN · 172.29.16.195)

    User->>Next.js: Clicks Allow / Decline
    Next.js->>XiaomiAPI: POST /api/test/xiaomi/purifier/on\n POST /api/test/xiaomi/purifier/off
    Note over Next.js,XiaomiAPI: Proxy via PURIFIER_API_URL env var
    XiaomiAPI->>Device: miIO protocol (UDP)\nMIoT set_property power=true/false
    Device-->>XiaomiAPI: ACK
    XiaomiAPI-->>Next.js: {success: true, provider: "miio"}
    Next.js-->>User: Success / Error state
```

---

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React 19, Tailwind v4 | Mobile-first user app |
| Backend | FastAPI, Python 3.14 | API, AI orchestration |
| Database | **ClickHouse Cloud** | Half-hourly energy analytics |
| AI Coaching | **Claude haiku-4-5** | Personalised focus explanations |
| AI Insights | **OpenAI GPT-4o-mini** | Weekly energy summaries |
| Smart Device | **Xiaomi Purifier + python-miio** | Physical device control via LAN |
