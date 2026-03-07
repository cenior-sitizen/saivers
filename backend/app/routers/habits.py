"""Habit tracking and rewards endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.habit_service import (
    HABITS,
    STREAK_MILESTONES,
    compute_weekly_impact,
    evaluate_daily_habits,
    get_streak,
    get_week_rate,
    record_habit_event,
)
from app.services.reward_service import (
    award_points,
    get_balance,
    get_history,
    redeem_voucher,
)
from app.services.ai_service import generate_chat_response

router = APIRouter()


@router.get("/{household_id}")
def get_habits(household_id: int):
    """Return current habit streaks and today's status."""
    return {
        "offpeak_ac": {
            "streak_days": get_streak(household_id, "offpeak_ac"),
            "today_achieved": False,  # updated by /evaluate
            "this_week_rate": get_week_rate(household_id, "offpeak_ac"),
        },
        "weekly_reduction": {
            "streak_days": get_streak(household_id, "weekly_reduction"),
            "today_achieved": False,
            "this_week_rate": get_week_rate(household_id, "weekly_reduction"),
        },
    }


@router.post("/evaluate/{household_id}")
def evaluate_habits(household_id: int):
    """
    Evaluate today's habits, record events, award points.
    Demo trigger: call this after a device action to show immediate feedback.
    """
    from app.data.households import HOUSEHOLD_MAP
    if household_id not in HOUSEHOLD_MAP:
        raise HTTPException(status_code=404, detail=f"Household {household_id} not found")

    evaluation = evaluate_daily_habits(household_id)
    awarded: list[dict] = []

    for habit_type, result in evaluation.items():
        achieved = result.get("achieved", False)
        current_streak = get_streak(household_id, habit_type)
        new_streak = current_streak + 1 if achieved else 0

        # Record in ClickHouse (append-only)
        record_habit_event(
            household_id=household_id,
            habit_type=habit_type,
            achieved=achieved,
            actual_kwh=result.get("actual_kwh", 0),
            threshold_kwh=HABITS[habit_type].get("threshold_kwh", 0),
            streak_day=new_streak,
        )

        if achieved:
            points = HABITS[habit_type].get("daily_points", 0)
            reason = f"{HABITS[habit_type]['label']} — streak day {new_streak}"
            award_points(household_id, points, reason)
            awarded.append({"habit": habit_type, "points": points, "streak": new_streak})

            # Milestone bonus
            bonus = STREAK_MILESTONES.get(new_streak)
            if bonus:
                award_points(household_id, bonus, f"Streak milestone: {new_streak} days!")
                awarded.append({"habit": habit_type, "bonus_points": bonus, "milestone": new_streak})

    balance = get_balance(household_id)
    from app.services.habit_service import VOUCHER_THRESHOLD
    return {
        "household_id": household_id,
        "evaluation": evaluation,
        "points_awarded": awarded,
        "new_balance": balance,
        "points_to_voucher": max(0, VOUCHER_THRESHOLD - balance),
    }


@router.get("/{household_id}/impact")
def habit_impact(household_id: int):
    """Return measurable energy impact with AI motivational summary."""
    from app.data.households import HOUSEHOLD_MAP
    h = HOUSEHOLD_MAP.get(household_id, {"name": "Resident", "flat_type": "4-room HDB"})
    impact = compute_weekly_impact(household_id)

    # Generate AI summary (deterministic numbers already computed)
    summary_context = {
        **h,
        "this_week_kwh": impact.get("kwh_saved", 0),
        "change_pct": -impact.get("reduction_pct", 0),
        "anomaly_summary": f"Saved {impact.get('kwh_saved', 0)} kWh this week",
    }
    ai_summary = generate_chat_response(
        summary_context,
        f"Give me a 1-sentence motivational summary. I saved {impact.get('kwh_saved', 0)} kWh "
        f"(S${impact.get('sgd_saved', 0)}, {impact.get('co2_saved', 0)} kg CO2) this week."
    )

    return {**impact, "ai_summary": ai_summary}


@router.get("/rewards/{household_id}")
def get_rewards(household_id: int):
    """Return points balance, voucher status, and transaction history."""
    from app.services.habit_service import VOUCHER_THRESHOLD
    balance = get_balance(household_id)
    history_raw = get_history(household_id)
    return {
        "points_balance": balance,
        "points_to_next_voucher": max(0, VOUCHER_THRESHOLD - balance),
        "vouchers_available": balance // VOUCHER_THRESHOLD,
        "history": [
            {"date": r["date"], "points": r["points"], "reason": r["reason"]}
            for r in history_raw
        ],
    }


@router.post("/rewards/redeem/{household_id}")
def redeem(household_id: int):
    """Redeem points for a mock CDC voucher."""
    return redeem_voucher(household_id)
