# AC Simulator

Standalone FastAPI server that mocks **smart air conditioner appliances** for the WattCoach app.

- **Port:** 8002 (or any port you choose)
- **Households:** 1001–1010
- **Rooms per household:** 4 (living-room, master-room, room-1, room-2)
- **AC units per room:** 2 (independently controllable)
- **Total AC units:** 10 × 4 × 2 = **80 units**
- **No database** — all state is in-memory, resets on restart

---

## Quick Start

```bash
cd ac-simulator
uv run uvicorn main:app --port 8002
```

Check it's running:
```bash
curl http://localhost:8002/health
# {"status":"ok","service":"ac-simulator","units":80}
```

Swagger docs: `http://localhost:8002/docs`

---

## Device IDs (unique identifier for each AC unit)

Each AC unit has a unique `device_id`. Use this ID in all control endpoints.

| Room | AC Unit 1 | AC Unit 2 |
|------|-----------|-----------|
| Living Room | `ac-living-room-1` | `ac-living-room-2` |
| Master Room | `ac-master-room-1` | `ac-master-room-2` |
| Room 1 | `ac-room-1-unit-1` | `ac-room-1-unit-2` |
| Room 2 | `ac-room-2-unit-1` | `ac-room-2-unit-2` |

These are the same across all households (1001–1010).

---

## How to Control 2 ACs in the Same Room

The two ACs in a room are **fully independent** — different temperatures, modes, and timers.

### Example: Living Room with 2 ACs at different settings

```bash
# Turn on AC-1 at 23°C (cool mode)
curl -X POST http://localhost:8002/ac/1001/ac-living-room-1/on \
  -H "Content-Type: application/json" \
  -d '{"temp_c": 23, "mode": "cool"}'

# Turn on AC-2 at 27°C (fan mode) — completely independent
curl -X POST http://localhost:8002/ac/1001/ac-living-room-2/on \
  -H "Content-Type: application/json" \
  -d '{"temp_c": 27, "mode": "fan"}'
```

**Response for each:**
```json
{
  "household_id": 1001,
  "room_id": "living-room",
  "device_id": "ac-living-room-1",
  "appliance_name": "Living Room AC 1",
  "is_on": true,
  "temp_c": 23,
  "mode": "cool",
  "power_w": 804.2,
  "schedule_start": null,
  "schedule_end": null,
  "last_updated": "2026-03-07T22:00:00+08:00"
}
```

### Example: Set timer on AC-2 only, leave AC-1 running freely

```bash
# AC-1 — turn on, no timer
curl -X POST http://localhost:8002/ac/1001/ac-master-room-1/on \
  -H "Content-Type: application/json" \
  -d '{"temp_c": 24}'

# AC-2 — set timer 23:00–07:00 (overnight)
curl -X POST http://localhost:8002/ac/1001/ac-master-room-2/timer \
  -H "Content-Type: application/json" \
  -d '{"start_time": "23:00", "end_time": "07:00", "temp_c": 25}'
```

The background tick fires the timer automatically — no user action needed.

---

## All Endpoints

### List & Status

```bash
# All 8 AC units for a household
GET /ac/{household_id}
curl http://localhost:8002/ac/1001

# All ACs in a specific room (returns 2 units)
GET /ac/{household_id}/room/{room_id}
curl http://localhost:8002/ac/1001/room/living-room

# Single AC unit by device_id
GET /ac/{household_id}/{device_id}
curl http://localhost:8002/ac/1001/ac-living-room-1
```

### Control (per device_id)

```bash
# Turn on (temp_c 16–30, mode: cool/fan/dry)
POST /ac/{household_id}/{device_id}/on
curl -X POST http://localhost:8002/ac/1001/ac-living-room-1/on \
  -H "Content-Type: application/json" \
  -d '{"temp_c": 23, "mode": "cool"}'

# Turn off
POST /ac/{household_id}/{device_id}/off
curl -X POST http://localhost:8002/ac/1001/ac-living-room-1/off

# Change temperature
POST /ac/{household_id}/{device_id}/temp
curl -X POST http://localhost:8002/ac/1001/ac-living-room-1/temp \
  -H "Content-Type: application/json" \
  -d '{"temp_c": 26}'

# Change mode
POST /ac/{household_id}/{device_id}/mode
curl -X POST http://localhost:8002/ac/1001/ac-living-room-1/mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "fan"}'

# Set timer (auto on/off, overnight-safe)
POST /ac/{household_id}/{device_id}/timer
curl -X POST http://localhost:8002/ac/1001/ac-living-room-2/timer \
  -H "Content-Type: application/json" \
  -d '{"start_time": "22:00", "end_time": "06:00", "temp_c": 24}'

# Cancel timer (does not turn off the AC)
DELETE /ac/{household_id}/{device_id}/timer
curl -X DELETE http://localhost:8002/ac/1001/ac-living-room-2/timer
```

### Live Stream (SSE)

```bash
# Subscribe to live updates for all ACs in a household (updates every 5s)
GET /ac/{household_id}/stream
curl -N http://localhost:8002/ac/1001/stream
```

**Event format:**
```
data: {"1001": [
  {"device_id": "ac-living-room-1", "is_on": true, "power_w": 806.0, ...},
  {"device_id": "ac-living-room-2", "is_on": false, "power_w": 0.0, ...},
  ...8 units total...
]}
```

**Frontend usage (JavaScript):**
```js
const es = new EventSource("http://localhost:8002/ac/1001/stream");
es.onmessage = (e) => {
  const allUnits = JSON.parse(e.data)["1001"]; // array of 8 ACState objects
  const livingRoom = allUnits.filter(u => u.room_id === "living-room");
  // livingRoom[0] = ac-living-room-1
  // livingRoom[1] = ac-living-room-2
};
```

---

## ACState fields

| Field | Type | Description |
|-------|------|-------------|
| `household_id` | int | 1001–1010 |
| `room_id` | string | `"living-room"` / `"master-room"` / `"room-1"` / `"room-2"` |
| `device_id` | string | Unique AC identifier e.g. `"ac-living-room-1"` |
| `appliance_name` | string | Human-readable label e.g. `"Living Room AC 1"` |
| `is_on` | bool | Whether AC is currently on |
| `temp_c` | int | Set-point temperature (16–30°C) |
| `mode` | string | `"cool"` / `"fan"` / `"dry"` |
| `power_w` | float | Current power draw in watts (0 when off, fluctuates ±5% per tick) |
| `schedule_start` | string / null | ISO8601+08:00 timer ON time |
| `schedule_end` | string / null | ISO8601+08:00 timer OFF time |
| `last_updated` | string | ISO8601+08:00 last state change |

**Power formula:** `base_w = (30 - temp_c) * 50 + 400` — cooler temperature = higher power draw.
Range: ~400W (30°C) to ~1,100W (16°C), with ±10% random fluctuation.

---

## Simulation Behaviour

- **Tick interval:** Every 5 seconds
- **Timer auto-trigger:** Background tick checks `schedule_start`/`schedule_end` each tick and fires on/off automatically
- **Overnight schedules:** Supported — `22:00` → `02:00` correctly sets end date to the next day
- **Power jitter:** Running units fluctuate ±5% per tick so the live stream feels realistic
- **State on restart:** All state resets to off (in-memory, by design for demo)

---

## Verification: Both ACs independent

This was tested and confirmed:

```
AC-1 (23°C cool): is_on=True,  power=804W  → changed temp to 18°C → power=918W
AC-2 (27°C fan):  is_on=True,  power=543W  → unchanged
AC-1 turned off:  is_on=False, power=0W
AC-2 still on:    is_on=True,  power=543W, timer active
SSE stream shows both states simultaneously every 5s
```

---

## For the Frontend Team

### What changed from single-AC

Previously each room had one device_id (e.g. `ac-living-room`).
Now each room has **two** (e.g. `ac-living-room-1` and `ac-living-room-2`).

Use `device_id` — not `room_id` — to target a specific unit.

### Recommended integration pattern

```ts
// 1. Fetch all units for the household
const units = await fetch("http://localhost:8002/ac/1001").then(r => r.json());

// 2. Group by room for display
const byRoom = units.reduce((acc, u) => {
  (acc[u.room_id] ??= []).push(u);
  return acc;
}, {});
// byRoom["living-room"] = [ac-living-room-1, ac-living-room-2]

// 3. Control a specific unit
await fetch(`http://localhost:8002/ac/1001/${deviceId}/on`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ temp_c: 23, mode: "cool" })
});

// 4. Subscribe to live updates
const es = new EventSource("http://localhost:8002/ac/1001/stream");
es.onmessage = (e) => {
  const units = JSON.parse(e.data)["1001"];
  // Re-render your AC status cards with fresh data
};
```
