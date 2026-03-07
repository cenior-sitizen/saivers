"""
Generate 7 weeks of weekly insight snapshots for the 3 demo households.

Personas:
  1001 Ahmad   — The Waster   (AC running all night, high usage)
  1002 Priya   — The Moderate (normal usage, improving)
  1003 Wei Ming — The Champion (efficient, near voucher redemption)

Status progression tells a story:
  1001: dismissed × 3 → read × 2 → approved × 1 → unread (latest)
  1002: approved × 3 → read × 1 → approved × 2 → unread (latest)
  1003: approved × 6 → unread (latest)

Usage:
    uv run python -m scripts.generate_weekly_insights
"""

import json
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from app.db.client import get_client
from app.services.weekly_insight_service import COLUMN_NAMES

SGT = ZoneInfo("Asia/Singapore")

DEMO_HOUSEHOLDS = [1001, 1002, 1003]

# Pre-written AI summaries per household per week (index 0 = oldest, 6 = newest/current)
_AI_SUMMARIES: dict[int, list[str]] = {
    1001: [
        "Ahmad, your air-conditioner ran past midnight on 6 nights last week, adding 12.4 kWh above your normal baseline. This alone cost you an extra S$3.60. The simplest fix: set an auto-off timer for 2am.",
        "Ahmad, your energy use jumped 34% compared to the previous week — the main culprit is overnight AC running from midnight to 4am. At 20°C all night, your unit draws nearly 900W non-stop. Set your AC to auto-off at 2am.",
        "Ahmad, for the third week in a row, your AC has been running past midnight. This pattern costs you around S$50 extra per month. Setting a timer takes 30 seconds — tap Approve to do it now.",
        "Ahmad, late-night AC usage is again your top energy driver this week. Your unit ran 28 hours overnight, consuming 25.2 kWh above baseline. A simple timer would recover that saving automatically every night.",
        "Ahmad, five weeks of overnight AC usage have now cost you an estimated S$180 in avoidable charges. This week alone added S$4.20 extra. The recommendation below will auto-configure your AC to off at 2am.",
        "Ahmad, you approved last week's AC schedule — and it showed. Your overnight usage dropped by 40% compared to the week before. Your energy bill is on track to fall by S$15 this month. Keep it up!",
        "Ahmad, your AC ran past midnight on 4 nights this week. Setting an auto-off at 2am at 25°C would save you approximately S$3.20 this week and S$14/month if sustained. Tap Approve to apply now.",
    ],
    1002: [
        "Priya, your energy use was 9% higher than the previous week, mostly due to longer evening AC hours. Your unit averaged 23°C — raising it to 25°C would save around S$4/month without sacrificing comfort.",
        "Priya, great news — your AC usage was well-managed this week. No overnight usage detected. Maintaining this pattern puts you on track for a 7-day streak and 20 extra reward points.",
        "Priya, energy use rose 11% this week, driven by peak-hour AC during the heatwave. To stay on target, consider pre-cooling your home to 24°C before 7pm, then raising to 26°C by 9pm.",
        "Priya, your AC ran 3 hours more than your usual evening window this week. You're still well below Mdm Siti's usage next door. Keep your timer set and you'll maintain your 3-day streak.",
        "Priya, another solid week — energy use is down 5% vs last week. Your habit of keeping AC off past midnight is now a 5-day streak. Just 2 more days to hit your 7-day milestone and earn 100 bonus points!",
        "Priya, excellent consistency this week. Your evening AC pattern (6pm–11:30pm at 24°C) is a model for the neighbourhood. You've now saved an estimated S$22 over the past month.",
        "Priya, your energy use rose 9% this week against last week. Your AC averaged 23°C — nudging it to 25°C could save S$4/month. Tap Approve to apply the recommended setting automatically.",
    ],
    1003: [
        "Wei Ming, outstanding week — your energy use was 9% below your 4-week rolling average. You saved 8.4 kWh, equivalent to S$2.45 and 3.4 kg CO₂. Your neighbourhood thanks you!",
        "Wei Ming, you're on a 7-day habit streak — your AC auto-off timer is working perfectly. This week it saved 4.2 kWh. You've now earned 140 points and are 26% of the way to your S$5 CDC voucher.",
        "Wei Ming, excellent consistency again. Your AC turns off by 10pm every night, your set-point averages 26°C, and your carbon footprint is 2.4 kg CO₂ below the neighbourhood average this week.",
        "Wei Ming, 14 days on your energy-saving streak! This week you were 11% below the neighbourhood average in per-capita kWh. You've now earned 280 points — more than halfway to your CDC voucher.",
        "Wei Ming, 21 days and still going strong. Your energy use was 8% below your own 4-week baseline, and you saved S$6.80 compared to a typical week. At this rate your voucher arrives in about 2 weeks.",
        "Wei Ming, 28-day streak — you're in the top 5% of energy savers in Punggol this month. You've now accumulated 450 points. Just 50 more points to redeem your S$5 CDC voucher!",
        "Wei Ming, another excellent week — you used 8% less energy than your own 4-week baseline, saving S$3.20 and 5.1 kg CO₂. You're at 480 points — just 20 away from redeeming your S$5 CDC voucher!",
    ],
}

_NOTIFICATION_TITLES: dict[int, list[str]] = {
    1001: [
        "Your AC ran past midnight — 6 nights this week",
        "Energy up 34% — overnight AC is the cause",
        "3 weeks of overnight AC — S$50/month avoidable cost",
        "28 hours of overnight AC detected this week",
        "5 weeks of late-night AC usage — act now",
        "Overnight usage down 40% — great progress!",
        "Your AC ran past midnight — 4 nights this week",
    ],
    1002: [
        "Energy up 9% — AC set to 23°C during peak hours",
        "Great week — no overnight AC detected",
        "Energy up 11% — heatwave peak usage",
        "AC ran 3 hours longer than usual this week",
        "Energy down 5% — 5-day streak achieved",
        "Consistent week — S$22 saved this month",
        "Energy up 9% — AC thermostat tip available",
    ],
    1003: [
        "Excellent week — 9% below your average",
        "7-day streak! AC savings confirmed",
        "14-day streak — top performer in Punggol",
        "21-day streak — 280 points earned",
        "28-day streak — 450 points, voucher close!",
        "Top 5% energy saver this month",
        "480 points — just 20 away from your CDC voucher!",
    ],
}

_NOTIFICATION_BODIES: dict[int, list[str]] = {
    1001: [
        "Setting an auto-off timer could save S$3.60 this week.",
        "Auto-off at 2am at 25°C would recover S$4.10/week.",
        "Tap Approve — your AC will auto-off at 2am tonight.",
        "28 hours overnight costs S$4.20 extra. One tap to fix.",
        "S$4.20 extra this week. Auto-schedule saves it all.",
        "Your approved schedule is working — keep the timer on.",
        "Auto-off at 2am at 25°C would save S$3.20 this week.",
    ],
    1002: [
        "Raising AC to 25°C saves ~S$4/month. Tap to apply.",
        "Keep it up to earn your 7-day streak bonus.",
        "Pre-cool to 24°C before 7pm, raise to 26°C by 9pm.",
        "2 more days to your 7-day streak and 100 bonus points.",
        "Just 2 more nights to hit your 7-day milestone!",
        "Your evening AC pattern is a model for the neighbourhood.",
        "Raise AC to 25°C — saves S$4/month automatically.",
    ],
    1003: [
        "You saved 8.4 kWh · S$2.45 · 3.4 kg CO₂ this week.",
        "You've earned 140 points — 26% to your CDC voucher.",
        "2.4 kg CO₂ below neighbourhood average this week.",
        "280 points earned — more than halfway to your voucher.",
        "At this pace, your CDC voucher arrives in ~2 weeks.",
        "Just 50 more points to redeem your S$5 CDC voucher!",
        "Just 20 points to go — your CDC voucher is nearly here!",
    ],
}

# Recommendation per household (same for all weeks — maps to ac_schedule action)
_RECOMMENDATIONS: dict[int, dict] = {
    1001: {
        "type": "ac_schedule",
        "json": json.dumps({"action": "ac_schedule", "start_time": "22:00", "end_time": "02:00", "temp_c": 25}),
    },
    1002: {
        "type": "ac_schedule",
        "json": json.dumps({"action": "ac_schedule", "start_time": "19:00", "end_time": "23:00", "temp_c": 25}),
    },
    1003: {
        "type": "none",
        "json": json.dumps({"action": "none"}),
    },
}

# Status histories — index 0 = oldest week, 6 = newest (unread)
_STATUS_HISTORIES: dict[int, list[str]] = {
    1001: ["dismissed", "dismissed", "dismissed", "read", "read", "approved", "unread"],
    1002: ["approved", "approved", "approved", "read", "approved", "approved", "unread"],
    1003: ["approved", "approved", "approved", "approved", "approved", "approved", "unread"],
}

# Signal types per household
_SIGNAL_TYPES: dict[int, str] = {
    1001: "ac_night_anomaly",
    1002: "weekly_increase",
    1003: "efficient",
}

BATCH_SIZE = 50_000


def _query_week_metrics(client, household_id: int, week_start: date) -> dict:
    """Query ClickHouse for real metrics for the given week."""
    week_end = week_start + timedelta(days=6)
    prev_start = week_start - timedelta(days=7)

    try:
        r = client.query(
            """
            SELECT
                round(sumIf(kwh,  interval_date >= {ws:Date} AND interval_date <= {we:Date}), 3) AS this_week_kwh,
                round(sumIf(kwh,  interval_date >= {ps:Date} AND interval_date <  {ws:Date}), 3) AS last_week_kwh,
                round(sumIf(cost_sgd, interval_date >= {ws:Date} AND interval_date <= {we:Date}), 4) AS cost_sgd,
                round(sumIf(carbon_kg, interval_date >= {ws:Date} AND interval_date <= {we:Date}), 4) AS carbon_kg
            FROM sp_energy_intervals
            WHERE household_id = {hid:UInt32}
              AND interval_date >= {ps:Date}
              AND interval_date <= {we:Date}
            """,
            parameters={
                "hid": household_id,
                "ws": str(week_start),
                "we": str(week_end),
                "ps": str(prev_start),
            },
        )
        row = list(r.named_results())[0]
        this_w = float(row["this_week_kwh"] or 0)
        last_w = float(row["last_week_kwh"] or 1)
        change_pct = round((this_w - last_w) / last_w * 100, 1) if last_w else 0
        return {
            "this_week_kwh": this_w,
            "last_week_kwh": last_w,
            "change_pct": change_pct,
            "weekly_cost_sgd": float(row["cost_sgd"] or 0),
            "weekly_carbon_kg": float(row["carbon_kg"] or 0),
        }
    except Exception:
        return {"this_week_kwh": 0, "last_week_kwh": 0, "change_pct": 0, "weekly_cost_sgd": 0, "weekly_carbon_kg": 0}


def _query_night_ac(client, household_id: int, week_start: date) -> dict:
    """Count nights with AC on past midnight."""
    week_end = week_start + timedelta(days=6)
    try:
        r = client.query(
            """
            SELECT countIf(is_on = 1 AND slot_idx BETWEEN 0 AND 9) AS night_on_count
            FROM ac_readings
            WHERE household_id = {hid:UInt32}
              AND reading_date >= {ws:Date}
              AND reading_date <= {we:Date}
            """,
            parameters={"hid": household_id, "ws": str(week_start), "we": str(week_end)},
        )
        count = int(list(r.named_results())[0]["night_on_count"] or 0)
        nights = min(count // 3, 7)  # ~3 slots per night window
        return {"detected": nights >= 2, "nights_observed": nights}
    except Exception:
        return {"detected": False, "nights_observed": 0}


def generate_insights(client) -> list[list]:
    """Generate all weekly insight rows for the 3 demo households."""
    today = date.today()
    rows: list[list] = []

    for hid in DEMO_HOUSEHOLDS:
        statuses = _STATUS_HISTORIES[hid]
        signal_type = _SIGNAL_TYPES[hid]
        rec = _RECOMMENDATIONS[hid]
        summaries = _AI_SUMMARIES[hid]
        titles = _NOTIFICATION_TITLES[hid]
        bodies = _NOTIFICATION_BODIES[hid]

        for week_num in range(7):
            # week 0 = oldest (6 weeks ago), week 6 = newest (current)
            weeks_ago = 6 - week_num
            week_start = today - timedelta(days=weeks_ago * 7 + 6)

            metrics = _query_week_metrics(client, hid, week_start)
            night = _query_night_ac(client, hid, week_start)

            status = statuses[week_num]
            # updated_at: approved/dismissed insights were actioned mid-week
            if status in ("approved", "dismissed", "read"):
                updated_at = datetime(
                    *(week_start + timedelta(days=3)).timetuple()[:3], 9, 0, 0,
                    tzinfo=SGT
                )
            else:
                updated_at = datetime.now(SGT)

            insight_id = f"WI-{hid}-{week_start.strftime('%Y%m%d')}"
            generated_at = datetime(
                *(week_start + timedelta(days=6)).timetuple()[:3], 2, 0, 0,
                tzinfo=SGT
            )

            rows.append([
                insight_id,
                hid,
                week_start,           # date object — ClickHouse Date column
                generated_at,
                signal_type,
                night["detected"],
                night["nights_observed"],
                metrics["change_pct"] > 5,
                metrics["this_week_kwh"],
                metrics["last_week_kwh"],
                metrics["change_pct"],
                metrics["weekly_cost_sgd"],
                metrics["weekly_carbon_kg"],
                summaries[week_num],
                rec["type"],
                rec["json"],
                titles[week_num],
                bodies[week_num],
                status,
                updated_at,
            ])

    return rows


def seed() -> None:
    client = get_client()

    print("Clearing weekly_insights table...")
    client.command("TRUNCATE TABLE IF EXISTS weekly_insights")

    print("Generating weekly insights for 3 demo households (7 weeks each)...")
    rows = generate_insights(client)
    print(f"  {len(rows)} insight rows generated")

    client.insert("weekly_insights", rows, column_names=COLUMN_NAMES)
    count = client.command("SELECT count() FROM weekly_insights")
    print(f"  weekly_insights: {count} rows inserted")
    print("\nInsight history:")
    for hid in DEMO_HOUSEHOLDS:
        result = client.query(
            "SELECT insight_id, status FROM weekly_insights FINAL WHERE household_id = {hid:UInt32} ORDER BY week_start",
            parameters={"hid": hid},
        )
        for r in result.named_results():
            print(f"  {r['insight_id']} → {r['status']}")


if __name__ == "__main__":
    seed()
