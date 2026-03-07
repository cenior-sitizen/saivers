"""
Reward service — append-only points ledger.

Points balance is derived via SUM(points_earned) at query time.
Voucher redemption inserts a negative-points row (no UPDATE/DELETE).
"""

from __future__ import annotations

from app.services.habit_service import VOUCHER_THRESHOLD

REWARD_TYPES = {
    "streak_points": "Streak achievement",
    "milestone_bonus": "Streak milestone bonus",
    "voucher_redeemed": "CDC voucher redeemed",
}


def _get_client():
    try:
        from app.db.client import get_client
        return get_client()
    except Exception:
        return None


def get_balance(household_id: int) -> int:
    """Derive current points balance via SUM — never store balance as mutable state."""
    client = _get_client()
    if client is None:
        return 0
    try:
        r = client.query(
            """
            SELECT sum(points_earned) AS total
            FROM reward_transactions
            WHERE household_id = {hid:UInt32}
            """,
            parameters={"hid": household_id},
        )
        return int(r.named_results()[0]["total"] or 0)
    except Exception:
        return 0


def get_history(household_id: int, limit: int = 20) -> list[dict]:
    client = _get_client()
    if client is None:
        return []
    try:
        r = client.query(
            """
            SELECT
                toString(toDate(created_at)) AS date,
                points_earned               AS points,
                reason,
                voucher_label
            FROM reward_transactions
            WHERE household_id = {hid:UInt32}
            ORDER BY created_at DESC
            LIMIT {lim:UInt8}
            """,
            parameters={"hid": household_id, "lim": limit},
        )
        return r.named_results()
    except Exception:
        return []


def award_points(household_id: int, points: int, reason: str) -> None:
    """Append a points-earned row. Never updates existing rows."""
    client = _get_client()
    if client is None:
        return
    try:
        client.insert(
            "reward_transactions",
            [[household_id, "streak_points", points, reason, ""]],
            column_names=["household_id", "reward_type", "points_earned", "reason", "voucher_label"],
        )
    except Exception:
        pass


def redeem_voucher(household_id: int) -> dict:
    """
    Redeem VOUCHER_THRESHOLD points for a mock CDC voucher.
    Appends a negative-points redemption row — no UPDATE.
    """
    balance = get_balance(household_id)
    if balance < VOUCHER_THRESHOLD:
        return {
            "success": False,
            "message": f"Need {VOUCHER_THRESHOLD} points, have {balance}",
            "balance": balance,
        }

    voucher_code = f"CDC-{household_id}-2026"
    client = _get_client()
    if client:
        try:
            client.insert(
                "reward_transactions",
                [[household_id, "voucher_redeemed", -VOUCHER_THRESHOLD,
                  "CDC voucher redeemed", voucher_code]],
                column_names=["household_id", "reward_type", "points_earned", "reason", "voucher_label"],
            )
        except Exception:
            pass

    return {
        "success": True,
        "voucher_code": voucher_code,
        "message": f"S$5 CDC voucher issued: {voucher_code}",
        "points_deducted": VOUCHER_THRESHOLD,
        "new_balance": balance - VOUCHER_THRESHOLD,
    }
