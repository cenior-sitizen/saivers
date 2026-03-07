/**
 * GET /api/aircon/behaviour-insights/[householdId]
 *
 * Generates 3 AI behaviour insight sentences for a household using OpenAI GPT-4o-mini.
 * Input: 30-day behaviour summary pulled from ClickHouse.
 * Cached in-process per (householdId, SGT date) — regenerated at midnight.
 *
 * Privacy: prompt uses ONLY the requesting household's own data.
 * No cross-household identifiers are ever included in the prompt.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getClickHouseClient, isClickHouseEnabled } from "@/lib/clickhouse";

// ---------------------------------------------------------------------------
// In-memory cache: key = `${householdId}_${SGT_date}` → string[]
// ---------------------------------------------------------------------------
const _cache = new Map<string, string[]>();

function sgDateKey(householdId: number): string {
  const sgDate = new Date().toLocaleDateString("en-SG", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${householdId}_${sgDate}`;
}

// ---------------------------------------------------------------------------
// OpenAI client (lazy init)
// ---------------------------------------------------------------------------
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

// ---------------------------------------------------------------------------
// Fetch 30-day behaviour metrics from ClickHouse
// ---------------------------------------------------------------------------
async function fetchBehaviourMetrics(householdId: number): Promise<{
  avgDailyKwh: number;
  avgDailyRuntimeH: number;
  highestDay: string;
  peakHour: number;
  highestDow: number;
  nightRunCount: number;
  thisWeekKwh: number;
  lastWeekKwh: number;
} | null> {
  if (!isClickHouseEnabled()) return null;
  try {
    const client = getClickHouseClient();
    const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    const fmtHour = (h: number) =>
      h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

    const [behResult, weekResult, nightResult] = await Promise.all([
      client.query({
        query: `
          SELECT
            round(avg(daily_kwh), 2) AS avg_daily_kwh,
            round(avg(daily_runtime_h), 1) AS avg_daily_runtime_h,
            argMax(toString(reading_date), daily_kwh) AS highest_day,
            argMax(toHour(peak_ts), daily_kwh) AS peak_usage_hour,
            argMax(toDayOfWeek(reading_date), daily_kwh) AS highest_dow
          FROM (
            SELECT
              reading_date,
              round(sum(kwh), 2) AS daily_kwh,
              countIf(is_on) * 0.5 AS daily_runtime_h,
              argMax(ts, kwh) AS peak_ts
            FROM ac_readings
            WHERE household_id = ${householdId}
              AND reading_date >= today() - 30
            GROUP BY reading_date
          )
        `,
      }),
      client.query({
        query: `
          SELECT
            round(sumIf(kwh, reading_date >= today() - 7), 2) AS this_week,
            round(sumIf(kwh, reading_date >= today() - 14 AND reading_date < today() - 7), 2) AS last_week
          FROM ac_readings
          WHERE household_id = ${householdId}
        `,
      }),
      client.query({
        query: `
          SELECT countIf(is_on = 1 AND toHour(ts) BETWEEN 0 AND 5) AS night_slots
          FROM ac_readings
          WHERE household_id = ${householdId}
            AND reading_date >= today() - 7
        `,
      }),
    ]);

    const beh = ((await behResult.json()) as { data?: Record<string, unknown>[] }).data?.[0];
    const wk = ((await weekResult.json()) as { data?: Record<string, unknown>[] }).data?.[0];
    const night = ((await nightResult.json()) as { data?: Record<string, unknown>[] }).data?.[0];

    if (!beh) return null;

    return {
      avgDailyKwh: parseFloat(String(beh.avg_daily_kwh ?? 0)),
      avgDailyRuntimeH: parseFloat(String(beh.avg_daily_runtime_h ?? 0)),
      highestDay: String(beh.highest_day ?? ""),
      peakHour: Number(beh.peak_usage_hour ?? 0),
      highestDow: Number(beh.highest_dow ?? 1),
      nightRunCount: Math.round(Number(night?.night_slots ?? 0) / 3),
      thisWeekKwh: parseFloat(String(wk?.this_week ?? 0)),
      lastWeekKwh: parseFloat(String(wk?.last_week ?? 0)),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Generate insights via OpenAI
// ---------------------------------------------------------------------------
async function generateInsights(householdId: number, metrics: NonNullable<Awaited<ReturnType<typeof fetchBehaviourMetrics>>>): Promise<string[]> {
  const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const fmtHour = (h: number) =>
    h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

  const weekChange = metrics.lastWeekKwh > 0
    ? Math.round(((metrics.thisWeekKwh - metrics.lastWeekKwh) / metrics.lastWeekKwh) * 100)
    : 0;
  const highestWeekday = DAYS[(metrics.highestDow - 1)] ?? "Unknown";
  const peakHourLabel = `${fmtHour(metrics.peakHour)} – ${fmtHour((metrics.peakHour + 1) % 24)}`;

  const prompt = `You are an energy coach for a Singapore HDB household.
Generate exactly 3 concise, personalised behaviour insights about this household's air-conditioner usage.
Each insight must be a single sentence (max 18 words). Be specific and factual. Use the data provided.
Do NOT mention other households, neighbours, or any names. Focus on this household's own patterns.
Return a JSON array of 3 strings only. No markdown.

Household AC usage data (last 30 days):
- Average daily kWh: ${metrics.avgDailyKwh}
- Average daily runtime: ${metrics.avgDailyRuntimeH} hours
- Peak usage time: ${peakHourLabel}
- Highest usage weekday: ${highestWeekday}
- This week vs last week: ${weekChange >= 0 ? "+" : ""}${weekChange}%
- Nights AC ran past midnight (last 7 days): ${metrics.nightRunCount}`;

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
    temperature: 0.5,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "[]";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 3).map(String);
    }
  } catch {
    // Fallback: split on newlines if JSON parse fails
    return raw
      .split("\n")
      .map((s) => s.replace(/^[\d\.\-\*\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ householdId: string }> },
) {
  const { householdId: hIdStr } = await params;
  const householdId = parseInt(hIdStr, 10);

  if (!householdId || isNaN(householdId)) {
    return NextResponse.json({ error: "Invalid householdId" }, { status: 400 });
  }

  const cacheKey = sgDateKey(householdId);
  const cached = _cache.get(cacheKey);
  if (cached) {
    return NextResponse.json({ insights: cached, cached: true });
  }

  const metrics = await fetchBehaviourMetrics(householdId);
  if (!metrics) {
    return NextResponse.json({ insights: [], error: "No data available" });
  }

  try {
    const insights = await generateInsights(householdId, metrics);
    _cache.set(cacheKey, insights);
    return NextResponse.json({ insights, cached: false });
  } catch (err) {
    console.error("[behaviour-insights]", err);
    return NextResponse.json(
      { insights: [], error: "AI generation failed" },
      { status: 500 },
    );
  }
}
