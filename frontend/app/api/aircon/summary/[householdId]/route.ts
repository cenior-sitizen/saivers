/**
 * GET /api/aircon/summary/[householdId]
 *
 * Lightweight summary for the aircon-impact page.
 * Runs only 4 ClickHouse queries (vs 13 in the full household route).
 * Cached server-side for 5 minutes — AC readings update every 30 min at most.
 *
 * Returns: today, spEnergy, behaviourSummary, comparisons.vsDistrict
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getClickHouseClient, isClickHouseEnabled } from "@/lib/clickhouse";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function fmtHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

// ---------------------------------------------------------------------------
// Cached data fetcher — revalidates every 5 minutes per householdId
// ---------------------------------------------------------------------------
const fetchSummary = unstable_cache(
  async (householdId: number) => {
    const client = getClickHouseClient();

    const [todayResult, spResult, behaviourResult, districtResult] =
      await Promise.all([
        // 1. Today's AC status
        client.query({
          query: `
            SELECT
              round(sum(kwh), 3)            AS energy_today_kwh,
              countIf(is_on) * 0.5          AS runtime_today_hours,
              argMax(is_on, ts)             AS is_on_now,
              argMax(temp_setting_c, ts)    AS temp_setting
            FROM ac_readings
            WHERE household_id = ${householdId}
              AND reading_date = today()
          `,
        }),
        // 2. SP total energy this week + last week + carbon
        client.query({
          query: `
            SELECT
              round(sumIf(kwh,      interval_date >= today() - 7), 2)                              AS this_week_kwh,
              round(sumIf(kwh,      interval_date >= today() - 14 AND interval_date < today() - 7), 2) AS last_week_kwh,
              round(sumIf(cost_sgd, interval_date >= today() - 7), 2)                              AS this_week_cost,
              round(sumIf(carbon_kg,interval_date >= today() - 7), 2)                              AS this_week_carbon
            FROM sp_energy_intervals
            WHERE household_id = ${householdId}
          `,
        }),
        // 3. 30-day AC behaviour summary
        client.query({
          query: `
            SELECT
              round(avg(daily_kwh), 2)                        AS avg_daily_kwh,
              round(avg(daily_runtime_h), 1)                  AS avg_daily_runtime_h,
              argMax(toString(reading_date), daily_kwh)        AS highest_day,
              argMax(toHour(peak_ts), daily_kwh)              AS peak_usage_hour,
              argMax(toDayOfWeek(reading_date), daily_kwh)    AS highest_dow
            FROM (
              SELECT
                reading_date,
                round(sum(kwh), 2)           AS daily_kwh,
                countIf(is_on) * 0.5         AS daily_runtime_h,
                argMax(ts, kwh)              AS peak_ts
              FROM ac_readings
              WHERE household_id = ${householdId}
                AND reading_date >= today() - 30
              GROUP BY reading_date
            )
          `,
        }),
        // 4. District (Punggol) weekly rollup for vsDistrict comparison
        client.query({
          query: `
            SELECT
              round(sumMerge(total_kwh), 2)         AS district_week_kwh,
              toUInt32(uniqMerge(active_homes))      AS homes
            FROM neighborhood_rollup
            WHERE neighborhood_id = 'punggol'
              AND interval_date >= today() - 7
          `,
        }),
      ]);

    const todayJson = (await todayResult.json()) as {
      data?: Array<{
        energy_today_kwh: string;
        runtime_today_hours: number;
        is_on_now: number;
        temp_setting: number;
      }>;
    };
    const spJson = (await spResult.json()) as {
      data?: Array<{
        this_week_kwh: string;
        last_week_kwh: string;
        this_week_cost: string;
        this_week_carbon: string;
      }>;
    };
    const behaviourJson = (await behaviourResult.json()) as {
      data?: Array<{
        avg_daily_kwh: string;
        avg_daily_runtime_h: string;
        highest_day: string;
        peak_usage_hour: number;
        highest_dow: number;
      }>;
    };
    const districtJson = (await districtResult.json()) as {
      data?: Array<{ district_week_kwh: string; homes: number }>;
    };

    const today = todayJson.data?.[0];
    const sp = spJson.data?.[0];
    const beh = behaviourJson.data?.[0];
    const districtRow = districtJson.data?.[0];

    // Build behaviour summary
    const peakHr = beh?.peak_usage_hour ?? 0;
    const peakHourRange = `${fmtHour(peakHr)} – ${fmtHour((peakHr + 1) % 24)}`;
    const highestWeekday = DAYS[(beh?.highest_dow ?? 1) - 1] ?? "Unknown";

    // Build district comparison
    const districtWeekKwh = parseFloat(districtRow?.district_week_kwh ?? "0");
    const districtHomes = districtRow?.homes ?? 1;
    const districtPerHomeWeekKwh =
      districtHomes > 0
        ? Math.round((districtWeekKwh / districtHomes) * 100) / 100
        : 0;
    const sgNationalPerHomeWeekKwh =
      Math.round(districtPerHomeWeekKwh * 0.88 * 100) / 100;

    const spThisWeek = parseFloat(sp?.this_week_kwh ?? "0");
    const spLastWeek = parseFloat(sp?.last_week_kwh ?? "0");
    const spVsLastWeekPct =
      spLastWeek > 0
        ? Math.round(((spThisWeek - spLastWeek) / spLastWeek) * 1000) / 10
        : 0;

    return {
      householdId,
      today: {
        energyKwh: parseFloat(today?.energy_today_kwh ?? "0"),
        runtimeHours: today?.runtime_today_hours ?? 0,
        status: today?.is_on_now ? "On" : "Off",
        temperature: today?.temp_setting || 24,
      },
      spEnergy: {
        thisWeekKwh: spThisWeek,
        lastWeekKwh: spLastWeek,
        thisWeekCostSgd: parseFloat(sp?.this_week_cost ?? "0"),
        thisWeekCarbonKg: parseFloat(sp?.this_week_carbon ?? "0"),
        vsLastWeekPct: spVsLastWeekPct,
      },
      behaviourSummary: beh
        ? {
            avgDailyKwh: parseFloat(beh.avg_daily_kwh),
            avgDailyRuntimeH: parseFloat(beh.avg_daily_runtime_h),
            highestDay: beh.highest_day,
            peakHourRange,
            highestWeekday,
          }
        : null,
      comparisons: {
        vsDistrict: {
          yourWeekKwh: spThisWeek,
          districtPerHomeWeekKwh,
          sgNationalPerHomeWeekKwh,
          percentVsDistrict:
            districtPerHomeWeekKwh > 0
              ? Math.round(
                  ((spThisWeek - districtPerHomeWeekKwh) /
                    districtPerHomeWeekKwh) *
                    1000,
                ) / 10
              : 0,
          percentVsSingapore:
            sgNationalPerHomeWeekKwh > 0
              ? Math.round(
                  ((spThisWeek - sgNationalPerHomeWeekKwh) /
                    sgNationalPerHomeWeekKwh) *
                    1000,
                ) / 10
              : 0,
        },
      },
    };
  },
  // Cache key prefix — householdId is injected at call time
  ["aircon-summary"],
  { revalidate: 300 }, // 5-minute TTL; AC readings arrive every 30 min
);

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

  if (!isClickHouseEnabled()) {
    return NextResponse.json(
      { error: "ClickHouse not enabled" },
      { status: 503 },
    );
  }

  try {
    // unstable_cache automatically namespaces by the extra tag array.
    // Pass householdId inside the closure — cache key includes the tag list.
    const data = await fetchSummary(householdId);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/aircon/summary]", err);
    return NextResponse.json(
      { error: "Failed to fetch summary", details: String(err) },
      { status: 500 },
    );
  }
}
