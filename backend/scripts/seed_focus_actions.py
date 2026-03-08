"""
Seed weekly focus actions for demo households 1001, 1002, 1003.

Each household gets ONE high-impact action for the current week with full
why/how content for the detail page.

Run: python -m scripts.seed_focus_actions (from backend/ directory)
Re-running is safe — ReplacingMergeTree deduplicates on (household_id, week_start, action_id).
"""

import json
import sys
import os
from datetime import date, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.db.client import get_client

TODAY = date.today()
WEEK_START = TODAY - timedelta(days=TODAY.weekday())  # Monday of current week

COLUMNS = [
    "action_id", "household_id", "week_start",
    "action_title", "action_subtitle", "category",
    "potential_saving_sgd", "why_headline", "why_body",
    "how_steps_json", "effort_level", "impact_level",
]

ACTIONS = [
    # ── 1001 Ahmad (Waster) ────────────────────────────────────────────────
    [
        f"focus-1001-{WEEK_START}",
        1001,
        WEEK_START,
        "Set AC auto-off at 2am tonight",
        "Your AC runs past 2am every night — that's ~S$0.60 wasted each night",
        "schedule",
        4.20,
        "Your AC is cooling an empty room while you sleep",
        (
            "Between 2am and 5am you're in deep sleep and your body temperature naturally "
            "drops — you don't need active cooling. But your AC runs on, drawing ~400W for "
            "3+ hours every night. That's S$0.35–0.60 per night, or up to S$180/year, "
            "just for those hours. A single timer setting eliminates this entirely."
        ),
        json.dumps([
            "Pick up your AC remote (or open the app if you have a smart AC)",
            "Press the 'Timer' or 'Sleep' button",
            "Set the OFF timer to 2:00am",
            "Set your temperature to 25°C now — you'll be asleep before it matters",
            "That's it. Check tomorrow's SP app — you'll see the drop immediately",
        ]),
        "low",
        "high",
    ],

    # ── 1002 Priya (Moderate) ──────────────────────────────────────────────
    [
        f"focus-1002-{WEEK_START}",
        1002,
        WEEK_START,
        "Raise AC from 23°C to 25°C after 9pm",
        "Just 2 degrees cooler uses ~10% more electricity all night",
        "temperature",
        4.00,
        "Every degree lower makes your compressor work harder",
        (
            "Air conditioners use roughly 5% more electricity for every 1°C lower you set. "
            "Going from 23°C to 25°C cuts nighttime cooling load by ~10%. After 9pm your "
            "body naturally wants a slightly warmer environment for deep sleep anyway — "
            "research shows 25–26°C is actually optimal for sleep quality. You're paying "
            "more for a temperature that's working against you."
        ),
        json.dumps([
            "At 9pm tonight, grab your remote",
            "Press the ▲ temperature button twice — from 23°C to 25°C",
            "If you feel warm initially, use a light cotton blanket — it's better than cold air",
            "Notice how you sleep — most people find 25°C more comfortable than they expect",
            "Do this 5 nights in a row and check your weekly cost on the Aircon Impact page",
        ]),
        "low",
        "medium",
    ],

    # ── 1003 Wei Ming (Champion) ───────────────────────────────────────────
    [
        f"focus-1003-{WEEK_START}",
        1003,
        WEEK_START,
        "Pre-cool to 24°C before 7pm, raise to 26°C by 9pm",
        "Charge your room's thermal mass and coast through the night",
        "habit",
        3.00,
        "Walls and furniture store cold — let physics do the work",
        (
            "HDB concrete walls, furniture and floors act as thermal batteries. "
            "Running at 24°C before 7pm charges them up. Raising to 26°C at 9pm "
            "cuts electricity use by ~15% while the room stays comfortable — the "
            "stored cold radiates out for 2+ hours. Singapore's concrete HDB "
            "construction is unusually good at this compared to lighter buildings. "
            "You're already in the top 5% of savers — this technique keeps you there "
            "while actually using less energy than your current pattern."
        ),
        json.dumps([
            "At 6:30pm, turn on AC at 24°C — let it run for the first hour",
            "The room and walls absorb the cold — don't open windows during this phase",
            "At 9pm exactly, raise temperature to 26°C on your remote",
            "You'll notice the room feels the same — that's the thermal mass working",
            "By 11pm the room has coasted with almost no active cooling needed",
            "Track it: your usage chart should show a drop after 9pm on the room page",
        ]),
        "medium",
        "medium",
    ],
]


def seed(client=None) -> None:
    if client is None:
        client = get_client()
    print("Seeding focus_actions for households 1001, 1002, 1003...")
    client.insert("focus_actions", ACTIONS, column_names=COLUMNS)
    print(f"  Inserted {len(ACTIONS)} focus actions (week starting {WEEK_START})")

    # Verify
    for hid, name in [(1001, "Ahmad"), (1002, "Priya"), (1003, "Wei Ming")]:
        r = client.query(
            "SELECT action_title FROM focus_actions FINAL "
            "WHERE household_id={h:UInt32} ORDER BY week_start DESC LIMIT 1",
            parameters={"h": hid},
        )
        rows = list(r.named_results())
        title = rows[0]["action_title"] if rows else "(none)"
        print(f"  {hid} {name}: {title!r}")


if __name__ == "__main__":
    seed()
    print("\nDone.")
