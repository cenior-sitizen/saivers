"""
Seed demo reward data for households 1001, 1002, and 1003.

Personas:
  1001 Ahmad (Waster)   — 7-day streak, 240 pts (progress toward 500 voucher)
  1002 Priya (Moderate) — 3-day streak, 150 pts (moderate progress)
  1003 Wei Ming (Champion) — 14-day streak, 480 pts (near 500-pt voucher threshold)

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
TODAY = date.today()

COLUMNS_HABIT = ["household_id", "habit_type", "event_date",
                 "achieved", "threshold_kwh", "actual_kwh", "streak_day"]
COLUMNS_REWARDS = ["household_id", "reward_type", "points_earned",
                   "reason", "voucher_label", "created_at"]


def _habit_row(hid: int, days_ago: int, streak: int, achieved: bool = True,
               actual_kwh: float = 0.05, habit_type: str = "offpeak_ac") -> list:
    day = TODAY - timedelta(days=days_ago)
    return [hid, habit_type, day, achieved, 0.3, actual_kwh, streak]


def _reward_row(hid: int, days_ago: int, reward_type: str, pts: int,
                reason: str, minute: int = 0) -> list:
    day = TODAY - timedelta(days=days_ago)
    ts = datetime(day.year, day.month, day.day, 22, minute, 0, tzinfo=SGT)
    return [hid, reward_type, pts, reason, "", ts]


# ---------------------------------------------------------------------------
# 1001 — Ahmad (Waster): 7-day streak, 240 pts
# ---------------------------------------------------------------------------

def seed_1001(client) -> None:
    print("  [1001 Ahmad — Waster] 7-day streak, 240 pts")
    habits = [_habit_row(1001, 6 - i, i + 1) for i in range(7)]
    client.insert("habit_events", habits, column_names=COLUMNS_HABIT)

    rewards = [_reward_row(1001, 6 - i, "streak_points", 20,
                           f"Off-peak AC — streak day {i+1}") for i in range(7)]
    rewards.append(_reward_row(1001, 0, "milestone_bonus", 100, "Streak milestone: 7 days!", minute=1))
    client.insert("reward_transactions", rewards, column_names=COLUMNS_REWARDS)
    print(f"    → {len(habits)} habit events, {sum(r[2] for r in rewards)} pts")


# ---------------------------------------------------------------------------
# 1002 — Priya (Moderate): 3-day streak, 150 pts
# Seeding: 4 older days (streak 1-4), one missed day, then 3 new days (streak 1-3)
# Rewards:  4×20=80 + 3×20=60 + 1 approve_action bonus 10 pts = 150 pts
# ---------------------------------------------------------------------------

def seed_1002(client) -> None:
    print("  [1002 Priya — Moderate] 3-day streak, 150 pts")
    habits: list = []
    # Older streak (4 days, ending 5 days ago)
    for i, streak in enumerate([1, 2, 3, 4]):
        habits.append(_habit_row(1002, 8 - i, streak))
    # Missed day (streak resets)
    habits.append(_habit_row(1002, 4, 0, achieved=False, actual_kwh=0.45))
    # Current 3-day streak
    for i, streak in enumerate([1, 2, 3]):
        habits.append(_habit_row(1002, 2 - i, streak))
    client.insert("habit_events", habits, column_names=COLUMNS_HABIT)

    rewards: list = []
    # Older 4 days
    for i in range(4):
        rewards.append(_reward_row(1002, 8 - i, "streak_points", 20,
                                   f"Off-peak AC — streak day {i+1}"))
    # Current 3 days
    for i, streak in enumerate([1, 2, 3]):
        rewards.append(_reward_row(1002, 2 - i, "streak_points", 20,
                                   f"Off-peak AC — streak day {streak}"))
    # Small approve-action bonus to reach 150 exactly
    rewards.append(_reward_row(1002, 0, "approve_action", 10,
                               "AI recommendation approved", minute=5))
    client.insert("reward_transactions", rewards, column_names=COLUMNS_REWARDS)
    print(f"    → {len(habits)} habit events, {sum(r[2] for r in rewards)} pts")


# ---------------------------------------------------------------------------
# 1003 — Wei Ming (Champion): 14-day streak, 480 pts
# Rewards: 14×20=280 + 7-day milestone 100 + 2 weekly_reduction×50=100 = 480 pts
# ---------------------------------------------------------------------------

def seed_1003(client) -> None:
    print("  [1003 Wei Ming — Champion] 14-day streak, 480 pts")
    habits = [_habit_row(1003, 13 - i, i + 1) for i in range(14)]
    client.insert("habit_events", habits, column_names=COLUMNS_HABIT)

    rewards: list = []
    for i in range(14):
        rewards.append(_reward_row(1003, 13 - i, "streak_points", 20,
                                   f"Off-peak AC — streak day {i+1}"))
    rewards.append(_reward_row(1003, 7, "milestone_bonus", 100, "Streak milestone: 7 days!", minute=1))
    # 2 weekly_reduction achievements (50 pts each)
    rewards.append(_reward_row(1003, 7, "streak_points", 50, "Weekly reduction achieved — week 1", minute=2))
    rewards.append(_reward_row(1003, 0, "streak_points", 50, "Weekly reduction achieved — week 2", minute=2))
    client.insert("reward_transactions", rewards, column_names=COLUMNS_REWARDS)
    print(f"    → {len(habits)} habit events, {sum(r[2] for r in rewards)} pts")


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

def verify(client) -> None:
    print("\n  Verification:")
    for hid, name in [(1001, "Ahmad"), (1002, "Priya"), (1003, "Wei Ming")]:
        r = client.query(
            "SELECT sum(points_earned) AS bal FROM reward_transactions WHERE household_id={h:UInt32}",
            parameters={"h": hid},
        )
        bal = int(list(r.named_results())[0]["bal"] or 0)
        r2 = client.query(
            """SELECT streak_day FROM habit_events
               WHERE household_id={h:UInt32} AND achieved=1
               ORDER BY event_date DESC LIMIT 1""",
            parameters={"h": hid},
        )
        rows = list(r2.named_results())
        streak = int(rows[0]["streak_day"]) if rows else 0
        print(f"    {hid} {name}: streak={streak}, pts={bal}, can_redeem_500={bal>=500}")


def main():
    print("Seeding reward demo data for households 1001, 1002, 1003...\n")
    client = get_client()

    seed_1001(client)
    seed_1002(client)
    seed_1003(client)
    verify(client)

    print("\nDone.")


if __name__ == "__main__":
    main()
