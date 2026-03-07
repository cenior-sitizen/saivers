"""
WattCoach — Anomaly Case Seeder
================================

Seeds realistic anomaly patterns into ClickHouse so the demo shows:
  - Weekly recommendations flagging real problems (not "usage on track")
  - Monthly report with mixed habit outcomes
  - Daily snapshot showing a high-usage anomaly day

Anomalies seeded for 2026-03-08 (today):
  1. Living room AC: runs all day at 23°C + very cold overnight (22°C midnight-4am)
     → pushes weekly kWh from 100.68 → ~144.7 kWh (+15.8% vs last week 124.97)
  2. Master room AC: peak-day cooling blast (22°C 7am-6:30pm)
     → pushes weekly kWh from 23.56 → ~42.8 kWh (+55.6% vs last week 27.49)
  3. sp_energy_intervals: household-level total matching AC sum + 20% non-AC load
     → peak_flag=True for slots 28-38 (2pm-7pm)
  4. habit_events: Mar 8 → achieved=False for both habit types
     → makes monthly achievement_rate more realistic (~40%)

Cleanup:
  5. DELETE FROM weekly_recommendations WHERE iso_week='2026-W10' (lightweight)
  6. DELETE FROM applied_recommendations WHERE rec_id IN (W10 rec_ids) (scoped)
  7. Regenerate recs via API → GPT-4o sees anomalies → produces actionable recs

Usage:
    uv run python scripts/seed_anomaly_cases.py

Codex review fixes applied:
  - Uses DELETE FROM (lightweight) not ALTER TABLE DELETE (mutation)
  - sp_energy_intervals total = AC kWh sum * 1.2 (includes non-AC load)
  - Checks existing Mar 8 habit_events before inserting (no duplicates)
  - Scoped applied_recommendations delete to W10 rec_ids only
"""

from __future__ import annotations

import urllib.request
import json
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

SGT = ZoneInfo("Asia/Singapore")
HOUSEHOLD_ID = 1001
NEIGHBORHOOD_ID = "punggol"
FLAT_TYPE = "4-room"
TODAY = date(2026, 3, 8)
BASE_URL = "http://localhost:8003"


def get_client():
    from app.db.client import get_client as _get
    return _get()


def slot_ts(slot_idx: int, d: date = TODAY) -> datetime:
    """Return the SGT datetime for a given slot_idx on a given date."""
    hour = (slot_idx * 30) // 60
    minute = (slot_idx * 30) % 60
    return datetime(d.year, d.month, d.day, hour, minute, 0, tzinfo=SGT)


def section(title: str) -> None:
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def verify_baselines(client) -> dict:
    """Read current this-week vs last-week kWh per device (computed from existing data)."""
    ws = TODAY - timedelta(days=6)   # Mar 2
    lws = TODAY - timedelta(days=13) # Feb 23
    r = client.query(
        """
        SELECT device_id,
            toFloat64(sumIf(kwh, reading_date >= {ws:Date})) AS kwh_this,
            toFloat64(sumIf(kwh, reading_date >= {lws:Date} AND reading_date < {ws:Date})) AS kwh_last
        FROM ac_readings
        WHERE household_id = {hid:UInt32} AND reading_date >= {lws:Date}
        GROUP BY device_id
        """,
        parameters={"hid": HOUSEHOLD_ID, "ws": str(ws), "lws": str(lws)},
    )
    baselines = {}
    for row in r.named_results():
        baselines[row["device_id"]] = {
            "kwh_this": float(row["kwh_this"]),
            "kwh_last": float(row["kwh_last"]),
        }
    return baselines


# ── Step 1: Seed ac_readings for Mar 8 ────────────────────────────────────────

def seed_ac_readings(client, baselines: dict) -> None:
    section("STEP 1: Seed ac_readings (Mar 8 anomaly day)")

    rows = []

    # ── Living room: cold overnight + full-day blast ────────────────
    # Target: +15% above last week (124.97 kWh)
    # Need to add: 124.97 * 1.16 - 100.68 ≈ 44 kWh today
    living_kwh_needed = baselines.get("ac-living-room", {}).get("kwh_last", 125.0) * 1.16 \
                        - baselines.get("ac-living-room", {}).get("kwh_this", 100.7)
    living_kwh_needed = max(40.0, living_kwh_needed)

    # Slots 0-7: midnight-3:30am → 22°C, very cold overnight anomaly
    overnight_kwh = 1.05   # kWh per 30-min slot at 2400W
    overnight_slots = list(range(0, 8))   # 8 slots = 4 hours midnight-4am
    for slot in overnight_slots:
        rows.append([HOUSEHOLD_ID, "ac-living-room", slot_ts(slot),
                     2100.0, overnight_kwh, 22, True, "cool"])

    # Slots 8-47: 4am-midnight → 23°C, high but less extreme
    daytime_kwh = 0.95   # kWh per 30-min slot at 1900W
    daytime_slots = list(range(8, 48))
    for slot in daytime_slots:
        rows.append([HOUSEHOLD_ID, "ac-living-room", slot_ts(slot),
                     1900.0, daytime_kwh, 23, True, "cool"])

    living_today = len(overnight_slots) * overnight_kwh + len(daytime_slots) * daytime_kwh
    print(f"  Living room today: {living_today:.1f} kWh "
          f"(new weekly total: {baselines.get('ac-living-room',{}).get('kwh_this',0)+living_today:.1f} "
          f"vs last week {baselines.get('ac-living-room',{}).get('kwh_last',0):.1f})")

    # ── Master room: peak-day cooling blast (7am-6:30pm) ─────────────
    # Target: +25% above last week (27.49 kWh) — master room spike
    master_kwh_needed = baselines.get("ac-master-room", {}).get("kwh_last", 27.5) * 1.30 \
                        - baselines.get("ac-master-room", {}).get("kwh_this", 23.6)
    master_kwh_per_slot = 0.85  # 1700W
    master_slots = list(range(14, 38))  # slots 14-37 = 7am-6:30pm (24 slots)
    for slot in master_slots:
        rows.append([HOUSEHOLD_ID, "ac-master-room", slot_ts(slot),
                     1700.0, master_kwh_per_slot, 22, True, "cool"])

    master_today = len(master_slots) * master_kwh_per_slot
    print(f"  Master room today: {master_today:.1f} kWh "
          f"(new weekly total: {baselines.get('ac-master-room',{}).get('kwh_this',0)+master_today:.1f} "
          f"vs last week {baselines.get('ac-master-room',{}).get('kwh_last',0):.1f})")

    # ── Room 1: light afternoon use only (stays on track) ─────────────
    for slot in range(30, 40):   # 3pm-8pm
        rows.append([HOUSEHOLD_ID, "ac-room-1", slot_ts(slot),
                     600.0, 0.30, 26, True, "cool"])
    print(f"  Room 1 today: {10 * 0.30:.1f} kWh (on track)")

    # ── Room 2: evening only (normal) ─────────────────────────────────
    for slot in range(36, 46):   # 6pm-11pm
        rows.append([HOUSEHOLD_ID, "ac-room-2", slot_ts(slot),
                     900.0, 0.45, 25, True, "cool"])
    print(f"  Room 2 today: {10 * 0.45:.1f} kWh (normal)")

    client.insert(
        "ac_readings",
        rows,
        column_names=["household_id", "device_id", "ts", "power_w", "kwh",
                      "temp_setting_c", "is_on", "mode"],
    )
    print(f"\n  Inserted {len(rows)} ac_readings rows for Mar 8.")


# ── Step 2: Seed sp_energy_intervals for Mar 8 ────────────────────────────────

def seed_sp_intervals(client) -> None:
    section("STEP 2: Seed sp_energy_intervals (household total, Mar 8)")

    # AC sum for today: living (8*1.05 + 40*0.95) + master (24*0.85) + room1 (10*0.30) + room2 (10*0.45)
    ac_today_kwh = (8 * 1.05 + 40 * 0.95) + (24 * 0.85) + (10 * 0.30) + (10 * 0.45)
    # Non-AC load (fridge, water heater, lights): add 20% on top
    household_today_kwh = ac_today_kwh * 1.20
    kwh_per_slot = round(household_today_kwh / 48, 4)

    print(f"  AC sum today: {ac_today_kwh:.2f} kWh")
    print(f"  Household total (AC + 20% non-AC): {household_today_kwh:.2f} kWh")
    print(f"  Per-slot average: {kwh_per_slot:.4f} kWh")

    rows = []
    for slot in range(48):
        ts = slot_ts(slot)
        # Afternoon peak slots (2pm-7pm = slots 28-38): slightly higher + peak_flag
        is_peak = 28 <= slot <= 38
        slot_kwh = round(kwh_per_slot * (1.3 if is_peak else 1.0), 4)
        cost = round(slot_kwh * 0.2911, 4)
        carbon = round(slot_kwh * 0.402, 4)
        rows.append([
            HOUSEHOLD_ID, NEIGHBORHOOD_ID, FLAT_TYPE,
            ts, slot_kwh, cost, carbon,
            is_peak, False,  # peak_flag, dr_event_flag
        ])

    client.insert(
        "sp_energy_intervals",
        rows,
        column_names=["household_id", "neighborhood_id", "flat_type",
                      "ts", "kwh", "cost_sgd", "carbon_kg",
                      "peak_flag", "dr_event_flag"],
    )
    total_inserted = sum(r[4] for r in rows)
    print(f"\n  Inserted {len(rows)} sp_energy_intervals rows, total {total_inserted:.2f} kWh")
    print(f"  {sum(1 for r in rows if r[7])} peak-flag slots (2pm-7pm)")


# ── Step 3: Seed habit_events for Mar 8 ───────────────────────────────────────

def seed_habit_events(client) -> None:
    section("STEP 3: Seed habit_events (Mar 8 failures)")

    # Check existing Mar 8 habit rows to avoid duplicates
    r = client.query(
        "SELECT habit_type FROM habit_events WHERE household_id={hid:UInt32} AND event_date={d:Date}",
        parameters={"hid": HOUSEHOLD_ID, "d": str(TODAY)},
    )
    existing = {row["habit_type"] for row in r.named_results()}
    print(f"  Existing Mar 8 habit_events: {existing}")

    rows = []
    if "offpeak_ac" not in existing:
        # offpeak_ac failed: AC ran overnight at 22°C (2.4 kWh in midnight slots >> 0.3 threshold)
        rows.append([HOUSEHOLD_ID, "offpeak_ac", TODAY, False, 0.300, 8.40, 0])
        print("  Adding offpeak_ac Mar 8: achieved=False (AC ran 8.4 kWh midnight-4am, threshold 0.3)")
    else:
        print("  Skipping offpeak_ac Mar 8 — already exists")

    if "weekly_reduction" not in existing:
        # weekly_reduction failed: usage spiked this week
        rows.append([HOUSEHOLD_ID, "weekly_reduction", TODAY, False, 0.0, 0.0, 0])
        print("  Adding weekly_reduction Mar 8: achieved=False (usage up vs last week)")
    else:
        print("  Skipping weekly_reduction Mar 8 — already exists")

    if rows:
        client.insert(
            "habit_events",
            rows,
            column_names=["household_id", "habit_type", "event_date", "achieved",
                          "threshold_kwh", "actual_kwh", "streak_day"],
        )
        print(f"  Inserted {len(rows)} habit_events rows.")
    else:
        print("  No new rows to insert.")


# ── Step 4: Delete W10 weekly_recommendations (lightweight) ───────────────────

def delete_w10_recommendations(client) -> list[str]:
    section("STEP 4: Delete W10 weekly_recommendations (lightweight DELETE)")

    # Get W10 rec_ids first (for scoped applied_recommendations cleanup)
    r = client.query(
        "SELECT rec_id FROM weekly_recommendations WHERE household_id={hid:UInt32} AND iso_week='2026-W10'",
        parameters={"hid": HOUSEHOLD_ID},
    )
    w10_rec_ids = [row["rec_id"] for row in list(r.named_results())]
    print(f"  Found {len(w10_rec_ids)} W10 rec_ids to delete")

    if w10_rec_ids:
        client.command(
            f"DELETE FROM weekly_recommendations WHERE household_id = {HOUSEHOLD_ID} AND iso_week = '2026-W10'"
        )
        print("  Deleted W10 weekly_recommendations (lightweight DELETE)")

    return w10_rec_ids


# ── Step 5: Delete applied_recommendations scoped to W10 rec_ids ──────────────

def delete_w10_applied(client, w10_rec_ids: list[str]) -> None:
    section("STEP 5: Delete applied_recommendations (scoped to W10 rec_ids)")

    if not w10_rec_ids:
        print("  No W10 rec_ids — nothing to delete in applied_recommendations")
        return

    ids_sql = ", ".join(f"'{rid}'" for rid in w10_rec_ids)
    client.command(
        f"DELETE FROM applied_recommendations WHERE household_id = {HOUSEHOLD_ID} AND rec_id IN ({ids_sql})"
    )
    print(f"  Deleted applied_recommendations for {len(w10_rec_ids)} W10 rec_ids (scoped lightweight DELETE)")


# ── Step 6: Trigger recommendation regeneration via API ───────────────────────

def regenerate_recommendations() -> list[dict]:
    section("STEP 6: Regenerate weekly recommendations via API")

    print("  Calling GET /api/recommendations/weekly/1001 ...")
    try:
        url = f"{BASE_URL}/api/recommendations/weekly/{HOUSEHOLD_ID}"
        with urllib.request.urlopen(url, timeout=60) as resp:
            recs = json.loads(resp.read())
        print(f"  Generated {len(recs)} recommendations:")
        for rec in recs:
            status = "already applied" if rec.get("already_applied") else "pending"
            print(f"    {rec['device_id']:22s}  {rec['current_temp']}°C → {rec['rec_temp']}°C  "
                  f"[{status}]  {rec['reason'][:70]}")
        return recs
    except Exception as e:
        print(f"  ERROR calling API: {e}")
        print("  Make sure the server is running: uv run uvicorn app.main:app --port 8003")
        return []


# ── Step 7: Verify results ─────────────────────────────────────────────────────

def verify_results(client) -> None:
    section("STEP 7: Verify seeded data")

    # Check new weekly kWh
    ws = TODAY - timedelta(days=6)
    lws = TODAY - timedelta(days=13)
    r = client.query(
        """
        SELECT device_id,
            toFloat64(sumIf(kwh, reading_date >= {ws:Date})) AS kwh_this,
            toFloat64(sumIf(kwh, reading_date >= {lws:Date} AND reading_date < {ws:Date})) AS kwh_last
        FROM ac_readings
        WHERE household_id = {hid:UInt32} AND reading_date >= {lws:Date}
        GROUP BY device_id ORDER BY device_id
        """,
        parameters={"hid": HOUSEHOLD_ID, "ws": str(ws), "lws": str(lws)},
    )
    print("  Weekly kWh after seeding:")
    for row in r.named_results():
        kwh_this = float(row["kwh_this"])
        kwh_last = float(row["kwh_last"])
        pct = (kwh_this - kwh_last) / kwh_last * 100 if kwh_last > 0 else 0
        flag = " ← ANOMALY" if pct > 10 else " ✓ on track"
        print(f"    {row['device_id']:22s}  this={kwh_this:.1f}  last={kwh_last:.1f}  "
              f"change={pct:+.1f}%{flag}")

    # Check Mar 8 daily snapshot
    r2 = client.query(
        """
        SELECT device_id, toFloat64(sum(kwh)) as kwh_today, countIf(is_on=1)/2.0 as runtime_h,
               argMax(temp_setting_c, ts) as last_temp
        FROM ac_readings
        WHERE household_id={hid:UInt32} AND reading_date='2026-03-08'
        GROUP BY device_id
        """,
        parameters={"hid": HOUSEHOLD_ID},
    )
    print("\n  Mar 8 AC usage (daily snapshot):")
    for row in r2.named_results():
        print(f"    {row['device_id']:22s}  {float(row['kwh_today']):.1f} kWh  "
              f"{float(row['runtime_h']):.1f}h runtime  {row['last_temp']}°C last temp")

    # Check habit_events
    r3 = client.query(
        "SELECT habit_type, event_date, achieved, actual_kwh FROM habit_events "
        "WHERE household_id={hid:UInt32} AND event_date >= '2026-03-06' ORDER BY event_date",
        parameters={"hid": HOUSEHOLD_ID},
    )
    print("\n  Recent habit_events (Mar 6-8):")
    for row in r3.named_results():
        achieved_str = "✓" if row["achieved"] else "✗"
        print(f"    {str(row['event_date'])} {row['habit_type']:20s}  {achieved_str}  "
              f"actual={float(row['actual_kwh']):.2f} kWh")

    # Check sp_energy_intervals Mar 8
    r4 = client.query(
        "SELECT toFloat64(sum(kwh)) as total, countIf(peak_flag=1) as peak_slots "
        "FROM sp_energy_intervals WHERE household_id={hid:UInt32} AND interval_date='2026-03-08'",
        parameters={"hid": HOUSEHOLD_ID},
    )
    for row in r4.named_results():
        print(f"\n  Mar 8 household total: {float(row['total']):.2f} kWh, "
              f"{row['peak_slots']} peak-flag slots")


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n WattCoach Anomaly Case Seeder")
    print("=" * 60)

    client = get_client()

    # Read current baselines first (compute-then-insert pattern)
    print("\nReading current baselines...")
    baselines = verify_baselines(client)
    for dev, b in baselines.items():
        pct = (b["kwh_this"] - b["kwh_last"]) / b["kwh_last"] * 100 if b["kwh_last"] else 0
        print(f"  {dev:22s}  this={b['kwh_this']:.1f}  last={b['kwh_last']:.1f}  {pct:+.1f}%")

    seed_ac_readings(client, baselines)
    seed_sp_intervals(client)
    seed_habit_events(client)
    w10_rec_ids = delete_w10_recommendations(client)
    delete_w10_applied(client, w10_rec_ids)
    recs = regenerate_recommendations()
    verify_results(client)

    print("\n" + "=" * 60)
    if recs:
        anomaly_recs = [r for r in recs if r["current_temp"] != r["rec_temp"]]
        print(f"  Seeding complete. {len(anomaly_recs)}/{len(recs)} recommendations suggest changes.")
        print("  Run the integration test to verify full flow:")
        print("    uv run python scripts/test_integration_flow.py")
    else:
        print("  Seeding complete (API call failed — run the server and regenerate manually).")
    print("=" * 60)
