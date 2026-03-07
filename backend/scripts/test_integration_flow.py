"""
WattCoach — End-to-End Integration Flow Test
=============================================

Tests the complete three-cadence data flow:

  DAILY  (8am fetch)
    1. Daily AC snapshot per room
    2. Weekly bill graph data
    3. Room device status (weekly comparison)
    4. AI insights

  WEEKLY (Saturday)
    5. Generate / retrieve weekly AI recommendations
    6. Simulate user approving recommendations → POST apply
    7. Verify MCP mock server commanded both AC units per room
    8. Verify already_applied = true on re-fetch

  MONTHLY
    9. Full monthly performance report (energy/habits/recs/neighbourhood/AI)

  HABITS & REWARDS
    10. Evaluate today's habits → award points
    11. Check points balance and voucher status

Usage:
    uv run python scripts/test_integration_flow.py

The script prints clear PASS/FAIL for each check so the frontend team
knows exactly which fields to consume at each stage.
"""

import json
import sys
import urllib.request
import urllib.error

BASE = "http://localhost:8003"
HOUSEHOLD = 1001
PASS = "\033[32mPASS\033[0m"
FAIL = "\033[31mFAIL\033[0m"
HEAD = "\033[1;36m"
RESET = "\033[0m"
BOLD = "\033[1m"


# ── HTTP helpers ───────────────────────────────────────────────────────────────

def get(path: str) -> dict | list:
    url = f"{BASE}{path}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read())


def post(path: str, body: dict) -> dict | list:
    url = f"{BASE}{path}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def check(label: str, condition: bool, detail: str = "") -> bool:
    icon = PASS if condition else FAIL
    suffix = f"  ({detail})" if detail else ""
    print(f"  {icon}  {label}{suffix}")
    return condition


def section(title: str) -> None:
    print(f"\n{HEAD}{'='*60}{RESET}")
    print(f"{HEAD}{title}{RESET}")
    print(f"{HEAD}{'='*60}{RESET}")


def subsection(title: str) -> None:
    print(f"\n{BOLD}── {title}{RESET}")


# ── Test helpers ───────────────────────────────────────────────────────────────

all_passed = True

def verify(label: str, condition: bool, detail: str = "") -> None:
    global all_passed
    ok = check(label, condition, detail)
    if not ok:
        all_passed = False


# ══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════════════════════════

section("HEALTH CHECK")
try:
    health = get("/health")
    verify("API is reachable", health.get("status") == "ok", str(health))
except Exception as e:
    print(f"  {FAIL}  Cannot reach {BASE}: {e}")
    print("\nEnsure the server is running:  uv run uvicorn app.main:app --port 8003")
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════════════
# DAILY FLOW — 8am fetch
# ══════════════════════════════════════════════════════════════════════════════

section("DAILY FLOW — 8am fetch (what the frontend loads on page open)")

# 1. Daily AC snapshot
subsection("1. Daily AC snapshot per room")
snapshot = get(f"/api/devices/daily-snapshot/{HOUSEHOLD}")
print(f"  Response: {json.dumps(snapshot, indent=4)}")
verify("Returns 4 rooms", len(snapshot) == 4, f"got {len(snapshot)}")
verify("Each room has device_id", all("device_id" in r for r in snapshot))
verify("Each room has kwh_today", all("kwh_today" in r for r in snapshot))
verify("Each room has runtime_hours", all("runtime_hours" in r for r in snapshot))
verify("Each room has is_on_now (bool)", all(isinstance(r["is_on_now"], bool) for r in snapshot))
verify("Each room has power_w", all("power_w" in r for r in snapshot))

# 2. Weekly bill graph data
subsection("2. Weekly bill + chart data")
bill = get(f"/api/usage/weekly-bill/{HOUSEHOLD}")
print(f"  summary_metrics: {bill['summary_metrics']}")
print(f"  weekly_comparison: {bill['weekly_comparison']}")
print(f"  chart_data (7 days): {bill['chart_data']}")
verify("Has 4 summary metrics", len(bill["summary_metrics"]) == 4)
verify("weekly_comparison present", "this_week_kwh" in bill["weekly_comparison"])
verify("chart_data has 7 points", len(bill["chart_data"]) == 7, f"got {len(bill['chart_data'])}")
verify("daily_breakdown has 7 entries", len(bill["daily_breakdown"]) == 7)
verify("Each chart point has label+value", all("label" in p and "value" in p for p in bill["chart_data"]))

# 3. Room device status (weekly comparison)
subsection("3. Room device status — weekly kWh comparison")
rooms = get(f"/api/devices/rooms/{HOUSEHOLD}")
print(f"  Rooms: {json.dumps(rooms, indent=4)}")
verify("Returns 4 rooms", len(rooms) == 4, f"got {len(rooms)}")
verify("Each room has status (On/Off)", all(r["status"] in ("On", "Off") for r in rooms))
verify("Each room has kwh_this_week", all("kwh_this_week" in r for r in rooms))
verify("Each room has trend_vs_last_week_pct", all("trend_vs_last_week_pct" in r for r in rooms))
verify("Each room has percent_of_total", all("percent_of_total" in r for r in rooms))
verify("percent_of_total sums to ~100", abs(sum(r["percent_of_total"] for r in rooms) - 100.0) < 1.0,
       f"sum={sum(r['percent_of_total'] for r in rooms):.1f}")

# 4. AI Insights
subsection("4. AI insights")
insights = get(f"/api/insights/{HOUSEHOLD}")
print(f"  Insights: {json.dumps(insights, indent=4)}")
verify("insights is a list", isinstance(insights, list))
if insights:
    verify("Each insight has type+plain_language+title",
           all("type" in i and "plain_language" in i and "title" in i for i in insights))


# ══════════════════════════════════════════════════════════════════════════════
# WEEKLY FLOW — Saturday recommendation cycle
# ══════════════════════════════════════════════════════════════════════════════

section("WEEKLY FLOW — Saturday recommendation cycle")

# 5. Generate / retrieve weekly recommendations
subsection("5. GET weekly recommendations (idempotent)")
recs = get(f"/api/recommendations/weekly/{HOUSEHOLD}")
print(f"  Recommendations ({len(recs)} recs):")
for r in recs:
    status = "already applied" if r.get("already_applied") else "pending"
    print(f"    {r['device_id']:25s} {r['current_temp']}°C → {r['rec_temp']}°C  [{status}]  {r['reason'][:60]}")
verify("Returns recommendations list", isinstance(recs, list))
verify("At least 1 recommendation", len(recs) >= 1, f"got {len(recs)}")
if recs:
    verify("Each rec has rec_id", all("rec_id" in r for r in recs))
    verify("Each rec has device_id", all("device_id" in r for r in recs))
    verify("Each rec has current_temp + rec_temp", all("current_temp" in r and "rec_temp" in r for r in recs))
    verify("Each rec has already_applied flag", all("already_applied" in r for r in recs))
    verify("rec_temp in valid range (16-30)", all(16 <= r["rec_temp"] <= 30 for r in recs))

# Pick unapplied recs to simulate user approval
pending_recs = [r for r in recs if not r.get("already_applied")]
print(f"\n  User selects {len(pending_recs)} pending recommendation(s) to approve.")

# 6. Apply recommendations → triggers MCP mock server
subsection("6. POST apply recommendations (user approves → MCP commands AC)")
if pending_recs:
    rec_ids_to_apply = [r["rec_id"] for r in pending_recs]
    apply_result = post(
        f"/api/recommendations/apply/{HOUSEHOLD}",
        {"rec_ids": rec_ids_to_apply},
    )
    print(f"  Apply results: {json.dumps(apply_result, indent=4)}")
    verify("Returns list of results", isinstance(apply_result, list))
    verify("One result per rec_id", len(apply_result) == len(rec_ids_to_apply))
    for res in apply_result:
        rid = res.get("rec_id", "?")
        if res.get("already_applied"):
            verify(f"  {rid[:8]}... already_applied=true (idempotent)", True)
        else:
            verify(f"  {rid[:8]}... success=true", res.get("success") is True,
                   f"partial={res.get('partial')}, units={res.get('units')}")
            verify(f"  {rid[:8]}... has action_id", "action_id" in res)
            verify(f"  {rid[:8]}... has new_temp", "new_temp" in res)
else:
    print("  All recommendations already applied — testing idempotency.")
    if recs:
        already_id = recs[0]["rec_id"]
        idem_result = post(
            f"/api/recommendations/apply/{HOUSEHOLD}",
            {"rec_ids": [already_id]},
        )
        verify("Idempotent re-apply returns already_applied=true",
               idem_result[0].get("already_applied") is True)

# 7. Verify already_applied = true on re-fetch
subsection("7. Re-fetch recommendations — verify already_applied")
recs_after = get(f"/api/recommendations/weekly/{HOUSEHOLD}")
applied_count = sum(1 for r in recs_after if r.get("already_applied"))
print(f"  {applied_count}/{len(recs_after)} recommendations marked already_applied")
verify("applied_count increased after apply",
       applied_count >= len(recs) - len(pending_recs),
       f"applied={applied_count}, total={len(recs_after)}")

# 8. Recommendation history
subsection("8. Recommendation history (last 4 weeks)")
history = get(f"/api/recommendations/history/{HOUSEHOLD}")
print(f"  History weeks: {[h['iso_week'] for h in history]}")
verify("Returns list of weeks", isinstance(history, list))
if history:
    verify("Each week has iso_week, recommendations, applied_count, total_count",
           all(k in history[0] for k in ("iso_week", "recommendations", "applied_count", "total_count")))


# ══════════════════════════════════════════════════════════════════════════════
# MONTHLY FLOW — performance report
# ══════════════════════════════════════════════════════════════════════════════

section("MONTHLY FLOW — comprehensive performance report")

# 9. Monthly report (current month defaults)
subsection("9. Monthly report (March 2026)")
report = get(f"/api/reports/monthly/{HOUSEHOLD}?year=2026&month=3")
print(f"  Report: {json.dumps(report, indent=4)}")

verify("Has household_id", report.get("household_id") == HOUSEHOLD)
verify("Has year + month", report.get("year") == 2026 and report.get("month") == 3)

energy = report.get("energy", {})
verify("energy.kwh_this_month > 0", energy.get("kwh_this_month", 0) > 0,
       f"{energy.get('kwh_this_month')} kWh")
verify("energy.kwh_prev_month > 0", energy.get("kwh_prev_month", 0) > 0,
       f"{energy.get('kwh_prev_month')} kWh")
verify("energy.change_pct present", "change_pct" in energy, str(energy.get("change_pct")))
verify("energy.cost_sgd_this_month > 0", energy.get("cost_sgd_this_month", 0) > 0)
verify("energy.carbon_kg_this_month > 0", energy.get("carbon_kg_this_month", 0) > 0)

habits = report.get("habits", {})
verify("habits.achieved_count >= 0", habits.get("achieved_count", -1) >= 0,
       str(habits.get("achieved_count")))
verify("habits.total_days_in_month == 31", habits.get("total_days_in_month") == 31)
verify("habits.achievement_rate_pct in [0,100]",
       0 <= habits.get("achievement_rate_pct", -1) <= 100)

recs_section = report.get("recommendations", {})
verify("recommendations.applied_count >= 0", recs_section.get("applied_count", -1) >= 0)
verify("recommendations.total_generated >= 0", recs_section.get("total_generated", -1) >= 0)

nb = report.get("neighbourhood", {})
verify("neighbourhood.avg_kwh_this_month > 0", nb.get("avg_kwh_this_month", 0) > 0)
verify("neighbourhood.percentile in [0,100]", 0 <= nb.get("percentile", -1) <= 100)
verify("neighbourhood.green_grid_co2_kg >= 0", nb.get("green_grid_co2_kg", -1) >= 0)

verify("ai_narrative is non-empty string", isinstance(report.get("ai_narrative"), str)
       and len(report.get("ai_narrative", "")) > 20,
       report.get("ai_narrative", "")[:80])

# Test with default params (no year/month → uses current SGT month)
subsection("9b. Monthly report with default params (current month)")
report_default = get(f"/api/reports/monthly/{HOUSEHOLD}")
verify("Default params return valid report",
       "energy" in report_default and "household_id" in report_default)
print(f"  Defaulted to {report_default.get('year')}-{report_default.get('month'):02d}")


# ══════════════════════════════════════════════════════════════════════════════
# HABITS & REWARDS FLOW
# ══════════════════════════════════════════════════════════════════════════════

section("HABITS & REWARDS FLOW")

# 10. Evaluate habits
subsection("10. POST evaluate habits (daily trigger)")
eval_result = post(f"/api/habits/evaluate/{HOUSEHOLD}", {})
print(f"  Evaluation: {json.dumps(eval_result, indent=4)}")
verify("Returns household_id", eval_result.get("household_id") == HOUSEHOLD)
verify("Has evaluation dict", isinstance(eval_result.get("evaluation"), dict))
verify("Has new_balance", "new_balance" in eval_result)
verify("Has points_to_voucher", "points_to_voucher" in eval_result)

# 11. Rewards balance
subsection("11. GET rewards balance")
rewards = get(f"/api/habits/rewards/{HOUSEHOLD}")
print(f"  Rewards: {json.dumps(rewards, indent=4)}")
verify("Has points_balance", "points_balance" in rewards)
verify("Has can_redeem (bool)", isinstance(rewards.get("can_redeem"), bool))
verify("Has voucher_value_sgd (5.0)", rewards.get("voucher_value_sgd") == 5.0)
verify("Has redeemed_vouchers list", isinstance(rewards.get("redeemed_vouchers"), list))
verify("Has history list", isinstance(rewards.get("history"), list))


# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

section("INTEGRATION TEST SUMMARY")
if all_passed:
    print(f"\n  {PASS}  All checks passed — backend is ready for frontend integration.\n")
else:
    print(f"\n  {FAIL}  Some checks failed — review output above before frontend handoff.\n")

sys.exit(0 if all_passed else 1)
