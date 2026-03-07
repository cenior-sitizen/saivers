"""
Insight orchestration service.

Combines anomaly data + deterministic calculations → OpenAI plain-language explanation.
5-minute in-memory cache to avoid repeated OpenAI calls in demo.
"""

from __future__ import annotations

import time

from app.data.households import HOUSEHOLD_MAP
from app.services.ai_service import generate_insight_text
from app.services.anomaly_service import detect_ac_night_anomaly, get_weekly_comparison

_cache: dict[int, dict] = {}
CACHE_TTL = 300  # 5 minutes


def get_insights(household_id: int) -> list[dict]:
    """Return top insights for a household. Uses 5-min cache."""
    if household_id in _cache and time.time() - _cache[household_id]["ts"] < CACHE_TTL:
        return _cache[household_id]["data"]

    h = HOUSEHOLD_MAP.get(household_id, {"name": "Resident", "flat_type": "4-room HDB"})
    night = detect_ac_night_anomaly(household_id)
    weekly = get_weekly_comparison(household_id)
    insights = []

    # --- Insight 1: AC night anomaly (primary demo insight) ---
    if night.get("detected"):
        actual_kwh = night["avg_kwh"]
        baseline_kwh = 0.05  # expected near-zero at 2am
        excess = max(0.0, actual_kwh - baseline_kwh)
        kwh_saved = round(excess * 0.7, 3)
        sgd_saved = round(kwh_saved * 0.2911, 2)
        co2_saved = round(kwh_saved * 0.402, 3)

        plain_text = generate_insight_text({
            "name": h["name"],
            "flat_type": h["flat_type"],
            "anomaly_desc": "Air-conditioner running at 2am when no one needs cooling",
            "actual_kwh": actual_kwh,
            "baseline_kwh": baseline_kwh,
            "time_label": "2:00 AM",
            "days": night["days_observed"],
            "kwh_saved": kwh_saved,
            "sgd_saved": sgd_saved,
            "co2_saved": co2_saved,
        })

        insights.append({
            "id": f"insight_{household_id}_001",
            "type": "ac_night_anomaly",
            "title": f"Your AC ran at 2am — {night['days_observed']} nights this week",
            "plain_language": plain_text,
            "evidence": {
                "baseline_kwh": baseline_kwh,
                "actual_kwh": actual_kwh,
                "anomaly_score": 3.2,
                "days_observed": night["days_observed"],
            },
            "recommendation": {
                "action": "Set AC auto-off schedule: 10pm–2am at 25°C",
                "appliance": "Air-conditioner",
            },
            "projected_savings": {
                "kwh": kwh_saved,
                "sgd": sgd_saved,
                "co2_kg": co2_saved,
                "per": "night",
            },
            "can_automate": True,
        })

    # --- Insight 2: Weekly usage increase ---
    change_pct = weekly.get("change_pct", 0)
    if isinstance(change_pct, (int, float)) and change_pct > 5:
        insights.append({
            "id": f"insight_{household_id}_002",
            "type": "weekly_increase",
            "title": f"Energy use up {change_pct}% vs last week",
            "plain_language": (
                f"{h['name']}, your household used {weekly['this_week_kwh']:.1f} kWh this week — "
                f"{change_pct}% more than last week ({weekly['last_week_kwh']:.1f} kWh). "
                "Check your peak-hour usage and consider shifting heavy appliances to after 11pm."
            ),
            "evidence": weekly,
            "recommendation": {
                "action": "Shift laundry cycle to after 11pm",
                "appliance": "Washing machine",
            },
            "projected_savings": {"kwh": 1.1, "sgd": 0.32, "co2_kg": 0.44, "per": "week"},
            "can_automate": False,
        })

    _cache[household_id] = {"ts": time.time(), "data": insights}
    return insights


def invalidate_cache(household_id: int) -> None:
    _cache.pop(household_id, None)
