"""
Seed demo reward data for household 1001.

Inserts:
  - 7 habit_events rows (offpeak_ac achieved each day this week, streak 1-7)
  - 7 reward_transactions rows (20 points each day)
  - 1 milestone bonus row (100 points for 7-day streak)
  Total seeded: 240 points — enough to demonstrate progress toward 500-pt voucher.

NOTE: Run once against a clean dataset. Re-running adds duplicate rows.
      To reset: truncate habit_events and reward_transactions in ClickHouse console.
"""

import sys
import os
from datetime import date, timedelta, datetime
from zoneinfo import ZoneInfo

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.client import get_client

SGT = ZoneInfo("Asia/Singapore")
HOUSEHOLD_ID = 1001
TODAY = date.today()


def seed_habit_events(client) -> int:
    rows = []
    for i in range(7):
        day = TODAY - timedelta(days=6 - i)  # Mon → today
        streak = i + 1
        rows.append([
            HOUSEHOLD_ID,
            "offpeak_ac",
            day,        # Date object (not isoformat string)
            True,       # achieved
            0.3,        # threshold_kwh
            0.05,       # actual_kwh (well under threshold)
            streak,
        ])

    client.insert(
        "habit_events",
        rows,
        column_names=["household_id", "habit_type", "event_date",
                      "achieved", "threshold_kwh", "actual_kwh", "streak_day"],
    )
    print(f"  Inserted {len(rows)} habit_events rows (offpeak_ac, streak 1-7)")
    return len(rows)


def seed_reward_transactions(client) -> int:
    rows = []

    # 20 pts/day for 7 days
    for i in range(7):
        day = TODAY - timedelta(days=6 - i)
        streak = i + 1
        created_at = datetime(day.year, day.month, day.day, 22, 0, 0, tzinfo=SGT)
        rows.append([
            HOUSEHOLD_ID,
            "streak_points",
            20,
            f"Off-peak AC — streak day {streak}",
            "",
            created_at,
        ])

    # 100-pt milestone bonus on day 7
    created_at_bonus = datetime(TODAY.year, TODAY.month, TODAY.day, 22, 1, 0, tzinfo=SGT)
    rows.append([
        HOUSEHOLD_ID,
        "milestone_bonus",
        100,
        "Streak milestone: 7 days!",
        "",
        created_at_bonus,
    ])

    client.insert(
        "reward_transactions",
        rows,
        column_names=["household_id", "reward_type", "points_earned",
                      "reason", "voucher_label", "created_at"],
    )
    total_pts = sum(r[2] for r in rows)
    print(f"  Inserted {len(rows)} reward_transactions rows ({total_pts} points total)")
    return len(rows)


def verify(client) -> None:
    r = client.query(
        "SELECT sum(points_earned) AS balance FROM reward_transactions WHERE household_id = {hid:UInt32}",
        parameters={"hid": HOUSEHOLD_ID},
    )
    balance = int(list(r.named_results())[0]["balance"] or 0)

    r2 = client.query(
        "SELECT count() AS cnt FROM habit_events WHERE household_id = {hid:UInt32}",
        parameters={"hid": HOUSEHOLD_ID},
    )
    evt_count = int(list(r2.named_results())[0]["cnt"] or 0)

    print(f"\n  Verification:")
    print(f"    habit_events rows : {evt_count}")
    print(f"    points balance    : {balance}")
    print(f"    can_redeem 500    : {balance >= 500}")


def main():
    print(f"Seeding reward demo data for household {HOUSEHOLD_ID}...")
    client = get_client()

    seed_habit_events(client)
    seed_reward_transactions(client)
    verify(client)

    print("\nDone. Call GET /api/habits/rewards/1001 to see the result.")


if __name__ == "__main__":
    main()
