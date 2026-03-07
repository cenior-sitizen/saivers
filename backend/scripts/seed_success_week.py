"""
WattCoach — Success Week Seeder (W11: Mar 9-15, 2026)
======================================================

Demonstrates the complete behaviour-change loop:

  W10 (Mar 2-8):  Anomaly detected → AI recommends raising temp →
                  User applies all 4 recommendations via MCP
  W11 (Mar 9-15): User follows recommendations → usage drops 64% →
                  Habit streak rebuilds → reward milestone unlocked

What gets seeded:

  1. ac_readings  Mar 9-15  — lower usage at higher temps (following recs)
       Living room 25°C (was 24°C), evening only 6pm-midnight
       Master room 24°C (was 23°C), evening only 6pm-midnight
       Room 1      26°C (was 25°C), later evening 8pm-midnight
       Room 2      26°C (was 25°C), 7pm-midnight

  2. sp_energy_intervals Mar 9-15 — household totals (AC × 1.2 non-AC factor)

  3. habit_events Mar 9-15
       offpeak_ac: achieved=True ×7, streak_day 1-7 (AC off before midnight ✓)
       weekly_reduction: achieved=True on Mar 15 (end-of-week check)

  4. reward_transactions
       7 × 20 pts daily offpeak_ac
       100 pts milestone bonus (7-day streak)
       → new balance: 240 + 240 = 480 pts (96% to S$5 CDC voucher)

Usage:
    uv run python -m scripts.seed_success_week

Run AFTER seed_anomaly_cases.py (W10 anomaly must exist first for the
comparison to be meaningful).
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
W11_START = date(2026, 3, 9)
W11_END = date(2026, 3, 15)


def get_client():
    from app.db.client import get_client as _get
    return _get()


def slot_ts(slot_idx: int, d: date) -> datetime:
    hour = (slot_idx * 30) // 60
    minute = (slot_idx * 30) % 60
    return datetime(d.year, d.month, d.day, hour, minute, 0, tzinfo=SGT)


def section(title: str) -> None:
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


# ── Step 1: Seed ac_readings W11 (reduced usage at higher temps) ──────────────

def seed_ac_readings(client) -> dict[str, float]:
    """Seed W11 ac_readings. Returns per-device kWh totals for verification."""
    section("STEP 1: Seed ac_readings W11 (Mar 9-15, following recommendations)")

    totals: dict[str, float] = {}
    rows = []

    for d in (W11_START + timedelta(days=i) for i in range(7)):
        day_str = str(d)

        # Living room: 25°C (raised from 24°C), evening only 6pm-midnight
        # 12 slots × 0.55 kWh = 6.6 kWh/day (vs 23°C all-day = 13.2 kWh/day)
        for slot in range(36, 48):   # 6pm-midnight
            rows.append([HOUSEHOLD_ID, "ac-living-room", slot_ts(slot, d),
                         1100.0, 0.55, 25, True, "cool"])

        # Master room: 24°C (raised from 23°C), evening 6pm-midnight
        # 12 slots × 0.40 kWh = 4.8 kWh/day
        for slot in range(36, 48):
            rows.append([HOUSEHOLD_ID, "ac-master-room", slot_ts(slot, d),
                         800.0, 0.40, 24, True, "cool"])

        # Room 1: 26°C (raised from 25°C), later evening 8pm-midnight
        # 8 slots × 0.22 kWh = 1.76 kWh/day
        for slot in range(40, 48):
            rows.append([HOUSEHOLD_ID, "ac-room-1", slot_ts(slot, d),
                         440.0, 0.22, 26, True, "cool"])

        # Room 2: 26°C (raised from 25°C), 7pm-midnight
        # 10 slots × 0.30 kWh = 3.0 kWh/day
        for slot in range(38, 48):
            rows.append([HOUSEHOLD_ID, "ac-room-2", slot_ts(slot, d),
                         600.0, 0.30, 26, True, "cool"])

    # Compute weekly totals
    totals["ac-living-room"] = 12 * 0.55 * 7
    totals["ac-master-room"] = 12 * 0.40 * 7
    totals["ac-room-1"]      =  8 * 0.22 * 7
    totals["ac-room-2"]      = 10 * 0.30 * 7
    total_ac = sum(totals.values())

    client.insert(
        "ac_readings",
        rows,
        column_names=["household_id", "device_id", "ts", "power_w", "kwh",
                      "temp_setting_c", "is_on", "mode"],
    )
    print(f"  Inserted {len(rows)} ac_readings rows for W11 (Mar 9-15)")
    print(f"  W11 per-device kWh:")
    for dev, kwh in totals.items():
        print(f"    {dev:22s}  {kwh:.1f} kWh")
    print(f"  W11 total AC: {total_ac:.1f} kWh")
    return totals


# ── Step 2: Seed sp_energy_intervals W11 ──────────────────────────────────────

def seed_sp_intervals(client, ac_totals: dict[str, float]) -> None:
    section("STEP 2: Seed sp_energy_intervals W11")

    total_ac_week = sum(ac_totals.values())
    total_hh_week = total_ac_week * 1.20  # AC + 20% non-AC appliances
    kwh_per_slot_per_day = total_hh_week / 7 / 48

    print(f"  Total AC W11: {total_ac_week:.2f} kWh")
    print(f"  Household W11 (AC + 20%): {total_hh_week:.2f} kWh")
    print(f"  Per-slot/day average: {kwh_per_slot_per_day:.4f} kWh")

    rows = []
    for d in (W11_START + timedelta(days=i) for i in range(7)):
        for slot in range(48):
            ts = slot_ts(slot, d)
            # Only active slots (6pm-midnight) have meaningful kWh; rest near-zero
            if slot >= 36:
                slot_kwh = round(kwh_per_slot_per_day * 1.5, 4)
            elif 8 <= slot <= 35:
                # Daytime: fridge + standby only
                slot_kwh = round(kwh_per_slot_per_day * 0.4, 4)
            else:
                # Overnight: near-zero (ACs off)
                slot_kwh = round(kwh_per_slot_per_day * 0.1, 4)
            cost = round(slot_kwh * 0.2911, 4)
            carbon = round(slot_kwh * 0.402, 4)
            rows.append([
                HOUSEHOLD_ID, NEIGHBORHOOD_ID, FLAT_TYPE,
                ts, slot_kwh, cost, carbon, False, False,
            ])

    client.insert(
        "sp_energy_intervals",
        rows,
        column_names=["household_id", "neighborhood_id", "flat_type",
                      "ts", "kwh", "cost_sgd", "carbon_kg",
                      "peak_flag", "dr_event_flag"],
    )
    inserted_kwh = sum(r[4] for r in rows)
    print(f"  Inserted {len(rows)} sp_energy_intervals rows, total {inserted_kwh:.2f} kWh")


# ── Step 3: Seed habit_events W11 ─────────────────────────────────────────────

def seed_habit_events(client) -> None:
    section("STEP 3: Seed habit_events W11 (streak rebuilding)")

    # Check for existing W11 habit rows
    r = client.query(
        "SELECT DISTINCT event_date, habit_type FROM habit_events "
        "WHERE household_id={hid:UInt32} AND event_date >= {s:Date} AND event_date <= {e:Date}",
        parameters={"hid": HOUSEHOLD_ID, "s": str(W11_START), "e": str(W11_END)},
    )
    existing = {(row["event_date"], row["habit_type"]) for row in r.named_results()}
    print(f"  Existing W11 habit rows: {len(existing)}")

    rows = []
    for i, d in enumerate((W11_START + timedelta(days=j) for j in range(7))):
        streak_day = i + 1  # Rebuilding: day 1 through day 7

        # offpeak_ac: achieved every day — AC off before midnight (no overnight slots)
        if (d, "offpeak_ac") not in existing:
            rows.append([
                HOUSEHOLD_ID, "offpeak_ac", d, True,
                0.300, 0.05,   # threshold, actual (AC off overnight = only 0.05 kWh in midnight slots)
                streak_day,
            ])

        # weekly_reduction: check only on last day of week (Saturday Mar 15)
        if d == W11_END and (d, "weekly_reduction") not in existing:
            rows.append([
                HOUSEHOLD_ID, "weekly_reduction", d, True,
                0.0, 0.0, streak_day,
            ])

    if rows:
        client.insert(
            "habit_events",
            rows,
            column_names=["household_id", "habit_type", "event_date", "achieved",
                          "threshold_kwh", "actual_kwh", "streak_day"],
        )
        offpeak_rows = sum(1 for r in rows if r[1] == "offpeak_ac")
        reduction_rows = sum(1 for r in rows if r[1] == "weekly_reduction")
        print(f"  Inserted {offpeak_rows} offpeak_ac rows (streak days 1-7, all achieved=True)")
        print(f"  Inserted {reduction_rows} weekly_reduction row (Mar 15, achieved=True)")
    else:
        print("  All W11 habit rows already exist — skipping")


# ── Step 4: Seed reward_transactions W11 ──────────────────────────────────────

def seed_reward_transactions(client) -> None:
    section("STEP 4: Seed reward_transactions W11 (7-day streak + milestone)")

    # Check current balance
    r = client.query(
        "SELECT sum(points_earned) as bal FROM reward_transactions WHERE household_id={hid:UInt32}",
        parameters={"hid": HOUSEHOLD_ID},
    )
    current_balance = int(list(r.named_results())[0]["bal"] or 0)
    print(f"  Current balance before W11: {current_balance} pts")

    # Check if W11 rewards already seeded
    r2 = client.query(
        "SELECT count() as cnt FROM reward_transactions "
        "WHERE household_id={hid:UInt32} AND toDate(created_at) >= {s:Date} AND toDate(created_at) <= {e:Date}",
        parameters={"hid": HOUSEHOLD_ID, "s": str(W11_START), "e": str(W11_END)},
    )
    existing_count = int(list(r2.named_results())[0]["cnt"] or 0)
    if existing_count > 0:
        print(f"  W11 rewards already seeded ({existing_count} rows) — skipping")
        return

    rows = []
    for i, d in enumerate((W11_START + timedelta(days=j) for j in range(7))):
        streak_day = i + 1
        ts = datetime(d.year, d.month, d.day, 8, 0, 0, tzinfo=SGT)  # 8am daily

        # Daily offpeak_ac points
        rows.append([
            HOUSEHOLD_ID, "offpeak_ac", 20,
            f"Off-peak AC — streak day {streak_day}",
            "",  # voucher_label
            ts,
        ])

        # 7-day streak milestone on day 7
        if streak_day == 7:
            ts_bonus = datetime(d.year, d.month, d.day, 8, 1, 0, tzinfo=SGT)
            rows.append([
                HOUSEHOLD_ID, "streak_milestone", 100,
                "Streak milestone: 7 days!",
                "",
                ts_bonus,
            ])

    client.insert(
        "reward_transactions",
        rows,
        column_names=["household_id", "reward_type", "points_earned",
                      "reason", "voucher_label", "created_at"],
    )

    new_balance = current_balance + 7 * 20 + 100
    print(f"  Inserted {len(rows)} reward rows: 7×20pts daily + 100pt milestone")
    print(f"  New balance: {new_balance} pts ({new_balance}/500 = {new_balance/500*100:.0f}% to S$5 voucher)")


# ── Step 5: Show the comparison ───────────────────────────────────────────────

def show_comparison(client) -> None:
    section("STEP 5: Before/After comparison (W10 anomaly vs W11 success)")

    w10_start = W11_START - timedelta(days=7)  # Mar 2
    w10_end   = W11_START - timedelta(days=1)  # Mar 8

    r = client.query(
        """
        SELECT device_id,
            toFloat64(sumIf(kwh, reading_date >= {s10:Date} AND reading_date <= {e10:Date})) AS w10_kwh,
            toFloat64(sumIf(kwh, reading_date >= {s11:Date} AND reading_date <= {e11:Date})) AS w11_kwh
        FROM ac_readings
        WHERE household_id = {hid:UInt32}
          AND reading_date >= {s10:Date}
        GROUP BY device_id ORDER BY device_id
        """,
        parameters={
            "hid": HOUSEHOLD_ID,
            "s10": str(w10_start), "e10": str(w10_end),
            "s11": str(W11_START), "e11": str(W11_END),
        },
    )
    total_w10 = total_w11 = 0.0
    print(f"  {'Device':22s}  {'W10 (anomaly)':15s}  {'W11 (success)':15s}  Change")
    print(f"  {'-'*22}  {'-'*15}  {'-'*15}  ------")
    for row in r.named_results():
        w10 = float(row["w10_kwh"])
        w11 = float(row["w11_kwh"])
        total_w10 += w10
        total_w11 += w11
        pct = (w11 - w10) / w10 * 100 if w10 > 0 else 0
        print(f"  {row['device_id']:22s}  {w10:8.1f} kWh      {w11:8.1f} kWh    {pct:+.1f}%")
    pct_total = (total_w11 - total_w10) / total_w10 * 100 if total_w10 > 0 else 0
    print(f"  {'TOTAL':22s}  {total_w10:8.1f} kWh      {total_w11:8.1f} kWh    {pct_total:+.1f}%")

    print()
    print("  Monthly March report (through Mar 15):")
    try:
        url = "http://localhost:8003/api/reports/monthly/1001?year=2026&month=3"
        with urllib.request.urlopen(url, timeout=30) as resp:
            report = json.loads(resp.read())
        e = report["energy"]
        h = report["habits"]
        nb = report["neighbourhood"]
        print(f"    kWh this month:       {e['kwh_this_month']} (vs Feb {e['kwh_prev_month']})")
        print(f"    Cost this month:      S${e['cost_sgd_this_month']}")
        print(f"    Change vs last month: {e['change_pct']}%")
        print(f"    Habits achieved:      {h['achieved_count']}/{h['total_days_in_month']} days ({h['achievement_rate_pct']}%)")
        print(f"    Neighbourhood avg:    {nb['avg_kwh_this_month']} kWh")
        print(f"    Your percentile:      {nb['percentile']}th")
        print(f"    AI narrative:         {report['ai_narrative'][:120]}...")
    except Exception as ex:
        print(f"    (could not fetch monthly report: {ex})")

    print()
    print("  Habit streak summary (offpeak_ac, Mar 1-15):")
    r2 = client.query(
        "SELECT event_date, achieved, streak_day FROM habit_events "
        "WHERE household_id={hid:UInt32} AND habit_type='offpeak_ac' "
        "AND event_date >= '2026-03-01' AND event_date <= '2026-03-15' "
        "GROUP BY event_date, achieved, streak_day ORDER BY event_date",
        parameters={"hid": HOUSEHOLD_ID},
    )
    for row in r2.named_results():
        icon = "✓" if row["achieved"] else "✗"
        print(f"    {str(row['event_date'])}  {icon}  streak_day={row['streak_day']}")

    print()
    print("  Rewards balance:")
    r3 = client.query(
        "SELECT sum(points_earned) as bal FROM reward_transactions WHERE household_id={hid:UInt32}",
        parameters={"hid": HOUSEHOLD_ID},
    )
    bal = int(list(r3.named_results())[0]["bal"] or 0)
    bar_filled = int(bal / 500 * 20)
    bar = "█" * bar_filled + "░" * (20 - bar_filled)
    print(f"    {bal}/500 pts  [{bar}]  {bal/500*100:.0f}% to S$5 CDC voucher")


# ── Main ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n WattCoach Success Week Seeder (W11: Mar 9-15, 2026)")
    print("=" * 60)
    print("  Story: User followed recommendations → usage drops 64%")
    print("         → habit streak rebuilt → reward milestone unlocked")
    print("=" * 60)

    client = get_client()

    ac_totals = seed_ac_readings(client)
    seed_sp_intervals(client, ac_totals)
    seed_habit_events(client)
    seed_reward_transactions(client)
    show_comparison(client)

    print("\n" + "=" * 60)
    print("  Success week seeded. Demo flow:")
    print("    W10 anomaly  → GET /api/recommendations/weekly/1001")
    print("    User applies → POST /api/recommendations/apply/1001")
    print("    W11 success  → GET /api/devices/rooms/1001  (trend down)")
    print("    Habits       → GET /api/habits/rewards/1001 (480 pts)")
    print("    Monthly      → GET /api/reports/monthly/1001")
    print("=" * 60)
