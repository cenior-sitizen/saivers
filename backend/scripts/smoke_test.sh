#!/usr/bin/env bash
# WattCoach API smoke test
# Usage: bash scripts/smoke_test.sh [BASE_URL]
# Default: http://localhost:8000

BASE="${1:-http://localhost:8000}"
HOUSEHOLD=1001
PASS=0
FAIL=0

ok()  { echo "  PASS: $1"; ((PASS++)); }
fail(){ echo "  FAIL: $1  --> $2"; ((FAIL++)); }

check() {
    local label="$1"
    local status="$2"
    local expected="$3"
    if [ "$status" -eq "$expected" ]; then
        ok "$label (HTTP $status)"
    else
        fail "$label" "expected $expected, got $status"
    fi
}

echo "========================================"
echo "  WattCoach smoke test  ->  $BASE"
echo "========================================"

# ── Health ────────────────────────────────────
echo ""
echo "[ Health ]"
S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health")
check "GET /health" "$S" 200

S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/docs")
check "GET /docs (Swagger)" "$S" 200

# ── Devices ───────────────────────────────────
echo ""
echo "[ Devices ]"
S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/devices/ac/status/$HOUSEHOLD")
check "GET /api/devices/ac/status/$HOUSEHOLD" "$S" 200

BODY=$(curl -s -X POST "$BASE/api/devices/ac/schedule" \
  -H "Content-Type: application/json" \
  -d "{\"household_id\": $HOUSEHOLD, \"temp_c\": 24, \"start_time\": \"23:00\", \"end_time\": \"06:00\"}")
S=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(0 if 'action_id' in d else 1)" 2>/dev/null)
[ "$S" = "0" ] && ok "POST /api/devices/ac/schedule (has action_id)" || fail "POST /api/devices/ac/schedule" "$BODY"

S=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/devices/ac/off/$HOUSEHOLD")
check "POST /api/devices/ac/off/$HOUSEHOLD" "$S" 200

# ── Coach chat (OpenAI) ───────────────────────
echo ""
echo "[ Coach Chat ]"
BODY=$(curl -s -X POST "$BASE/api/insights/coach/chat" \
  -H "Content-Type: application/json" \
  -d "{\"household_id\": $HOUSEHOLD, \"message\": \"How can I save electricity?\"}")
S=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(0 if 'response' in d else 1)" 2>/dev/null)
[ "$S" = "0" ] && ok "POST /api/insights/coach/chat (has response)" || fail "POST /api/insights/coach/chat" "$BODY"

# ── Habits / Rewards ──────────────────────────
echo ""
echo "[ Habits & Rewards ]"
S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/habits/$HOUSEHOLD")
check "GET /api/habits/$HOUSEHOLD" "$S" 200

S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/habits/rewards/$HOUSEHOLD")
check "GET /api/habits/rewards/$HOUSEHOLD" "$S" 200

# ── Admin ─────────────────────────────────────
echo ""
echo "[ Admin ]"
S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/households")
check "GET /api/admin/households" "$S" 200

S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/region-summary")
check "GET /api/admin/region-summary" "$S" 200

# ── ClickHouse-dependent (require Dev A data) ─
echo ""
echo "[ Insights (ClickHouse required) ]"
S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/insights/anomalies/$HOUSEHOLD")
check "GET /api/insights/anomalies/$HOUSEHOLD" "$S" 200

S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/insights/weekly-comparison/$HOUSEHOLD")
check "GET /api/insights/weekly-comparison/$HOUSEHOLD" "$S" 200

S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/insights/ac-pattern/$HOUSEHOLD")
check "GET /api/insights/ac-pattern/$HOUSEHOLD" "$S" 200

S=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/insights/$HOUSEHOLD")
check "GET /api/insights/$HOUSEHOLD" "$S" 200

# ── Rooms / Appliances ────────────────────────
echo ""
echo "[ Rooms & Appliances ]"
BODY=$(curl -s "$BASE/api/devices/rooms/$HOUSEHOLD")
S=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(0 if len(d)==4 else 1)" 2>/dev/null)
[ "$S" = "0" ] && ok "GET /api/devices/rooms/$HOUSEHOLD (4 rooms)" || fail "GET /api/devices/rooms/$HOUSEHOLD" "$BODY"

S=$(echo "$BODY" | python3 -c "
import sys, json
rooms = json.load(sys.stdin)
total = sum(r['percent_of_total'] for r in rooms)
print(0 if abs(total - 100.0) < 1.0 else 1)
" 2>/dev/null)
[ "$S" = "0" ] && ok "GET /api/devices/rooms/$HOUSEHOLD (percent_of_total sums ~100)" || fail "GET /api/devices/rooms/$HOUSEHOLD percent_of_total" "$BODY"

# ── Usage / Weekly Bill ───────────────────────
echo ""
echo "[ Weekly Bill ]"
BODY=$(curl -s "$BASE/api/usage/weekly-bill/$HOUSEHOLD")
S=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(0 if len(d.get('chart_data',[])) == 7 else 1)" 2>/dev/null)
[ "$S" = "0" ] && ok "GET /api/usage/weekly-bill/$HOUSEHOLD (7 chart entries)" || fail "GET /api/usage/weekly-bill/$HOUSEHOLD" "$BODY"

# ── Summary ───────────────────────────────────
echo ""
echo "========================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "========================================"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
