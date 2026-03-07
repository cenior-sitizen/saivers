# Saivers — AI for Actionable Energy Behavior Change

> A 24-hour prototype for the SP Group problem statement: using AI to help Singapore reduce energy wastage in households.

---

## Problem Statement

Singapore households need better tools to understand and change their energy behavior. Existing solutions provide aggregate insights but lack the granularity and actionability to drive meaningful behavior change at the household level.

## Our Approach

We focus on **households with smart appliances** — because we want **actionable** outcomes. Smart appliances give us appliance-level data and control, enabling both insights and automation.

---

## Current State: SP App

The SP App today provides **half-hourly electricity data** from the **master meter** of each household (tied to a unique `household_id`). Data is available at half-hourly, daily, weekly, monthly, and yearly granularities.

**What it offers:**
- Household vs. neighbourhood comparison
- Household vs. last week comparison

**What it lacks:**
- **Within-household visibility** — no breakdown of which appliances consume what
- **Appliance-level insights** — no understanding of when specific devices are active
- **Actionability** — insights without the ability to act on them

---

## Our Proposal: Smart Appliance Enrichment

We propose enriching SP Group's data with **smart home appliance data**. We aim to work with brands like **Xiaomi**, **Samsung**, and others — starting with **air conditioners** for the prototype.

Smart appliances provide:
- **Appliance-level information** — which device, which room
- **Hourly (or finer) data** — when each appliance is actively used
- **Control capabilities** — the ability to automate and optimize usage

---

## High-Level Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────────────┐
│  Home Meter     │────▶│  SP Group Database  │────▶│  ClickHouse (Mock)       │
│  (Half-hourly)  │     │  Raw + Processed    │     │  + Smart Appliance Data   │
└─────────────────┘     └─────────────────────┘     └──────────────────────────┘
                                                                  │
                                        ┌─────────────────────────┴─────────────────────────┐
                                        ▼                                                   ▼
                               ┌─────────────────┐                               ┌─────────────────┐
                               │  Admin Dashboard │                               │  User Mobile    │
                               │  (CEO / Ops)     │                               │  (Households)   │
                               └─────────────────┘                               └─────────────────┘
```

1. **Meter data** flows from each home to SP Group's database (mocked in ClickHouse)
2. **Smart appliance data** enriches the dataset with hourly, appliance-level granularity
3. The enriched data powers **two product surfaces**

---

## What We're Building (24-Hour Prototype)

### 6A. Admin Dashboard (Desktop-First)

For **SP Group leadership** and **operations teams** — a desktop-first view to monitor, analyze, and act on energy data.

| Feature | Description |
|---------|-------------|
| **Real-Time Regional Energy Monitoring** | Live view of energy consumption across regions |
| **Energy Trend Analysis** | Historical trends and patterns at various granularities |
| **AI-Powered Energy Analytics** | ClickHouse + LibreChat for natural language queries and investigation |
| **Energy Anomaly Detection & Observability** | Detect unusual consumption patterns and outliers |
| **Data Visualisation Dashboard** | Charts, maps, and KPIs for decision-making |
| **Incident and Event Timeline** | Chronological view of notable events and anomalies |
| **AI-Generated Operational Recommendations** | Actionable suggestions based on data analysis |

---

### 6B. User App (Mobile-First)

For **households** — a mobile-first experience that turns insights into action with minimal mental overhead.

| Capability | Description |
|------------|-------------|
| **Suggestions & Nudges** | Personalized recommendations based on usage patterns |
| **Automation (with approval)** | Help users automate configurations — e.g., turn off air conditioning between 2am–4am when it fits their schedule and saves cost |
| **Reduced Mental Overhead** | We handle the configuration logic; users approve and benefit |

**Prototype scope:** 4 rooms (Master Room, Room 1, Room 2, Living Room), each with one air conditioner. Users can see their rooms and appliances, and receive AI-driven suggestions for optimization.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Database** | ClickHouse |
| **Backend** | Python |
| **Frontend** | Next.js, Vercel |
| **AI / Analytics** | LibreChat (for admin), AI-driven recommendations |

---

## Repository Structure

```
saivers/
├── frontend/     # Next.js app — Admin (desktop) + User (mobile) views
├── backend/      # Python + ClickHouse integration
└── README.md
```

---

## Getting Started

*To be updated as the prototype evolves.*

---

*Built for SP Group — AI for Actionable Energy Behavior Change*
