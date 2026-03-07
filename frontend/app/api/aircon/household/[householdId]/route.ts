/**
 * GET /api/aircon/household/[householdId]
 * Returns AC data for a specific household directly by ID.
 * Used by the persona-switched user view.
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getClickHouseClient, isClickHouseEnabled } from "@/lib/clickhouse";

// ---------------------------------------------------------------------------
// Cached query executor — 5-min TTL per householdId
// ---------------------------------------------------------------------------
const fetchHouseholdData = unstable_cache(
  async (householdId: number) => {
    const client = getClickHouseClient();
    const [
      todayResult,
      weekResult,
      dayResult,
      lastWeekResult,
      spResult,
      monthResult,
      behaviourResult,
      spikesResult,
      vsLastMonthResult,
      districtResult,
      districtWeekPointsResult,
      districtDayPointsResult,
      districtMonthPointsResult,
    ] = await Promise.all([
      // Today's AC summary
      client.query({
        query: `
          SELECT
            round(sum(kwh), 3) as energy_today_kwh,
            countIf(is_on) * 0.5 as runtime_today_hours,
            argMax(is_on, ts) as is_on_now,
            argMax(temp_setting_c, ts) as temp_setting
          FROM ac_readings
          WHERE household_id = ${householdId}
            AND reading_date = today()
        `,
      }),
      // Last 7 days by actual date (for week chart — shows "Mar 1", "Mar 2" with year)
      client.query({
        query: `
          SELECT
            reading_date,
            concat(
              formatDateTime(reading_date, '%b'), ' ',
              toString(toDayOfMonth(reading_date)), ', ',
              toString(toYear(reading_date))
            ) as day_label,
            round(sum(kwh), 2) as kwh
          FROM ac_readings
          WHERE household_id = ${householdId}
            AND reading_date >= today() - 7
            AND reading_date < today()
          GROUP BY reading_date
          ORDER BY reading_date
        `,
      }),
      // Today by hour (for day chart — shows "Mar 8, 2026 · 00:00" style subtitle in UI)
      client.query({
        query: `
          SELECT
            toHour(ts) as hour,
            concat(lpad(toString(toHour(ts)), 2, '0'), ':00') as time_label,
            round(sum(kwh), 3) as kwh,
            countIf(is_on) > 0 as is_on
          FROM ac_readings
          WHERE household_id = ${householdId}
            AND reading_date = today()
          GROUP BY toHour(ts)
          ORDER BY toHour(ts)
        `,
      }),
      // Last week total (for vsLastWeek %)
      client.query({
        query: `
          SELECT round(sum(kwh), 2) as total
          FROM ac_readings
          WHERE household_id = ${householdId}
            AND reading_date >= today() - 14
            AND reading_date < today() - 7
        `,
      }),
      // SP energy this week + last week + carbon
      client.query({
        query: `
          SELECT
            round(sumIf(kwh, interval_date >= today() - 7), 2) as this_week_kwh,
            round(sumIf(kwh, interval_date >= today() - 14 AND interval_date < today() - 7), 2) as last_week_kwh,
            round(sumIf(cost_sgd, interval_date >= today() - 7), 2) as this_week_cost,
            round(sumIf(carbon_kg, interval_date >= today() - 7), 2) as this_week_carbon
          FROM sp_energy_intervals
          WHERE household_id = ${householdId}
        `,
      }),
      // Last 28 days by week — month chart with full date + year ("Feb 2, 2026")
      client.query({
        query: `
          SELECT
            toString(toMonday(reading_date)) AS week_start,
            concat(
              formatDateTime(toMonday(reading_date), '%b'), ' ',
              toString(toDayOfMonth(toMonday(reading_date))), ', ',
              toString(toYear(toMonday(reading_date)))
            ) AS time,
            round(sum(kwh), 2) AS value,
            max(toUInt8(is_on)) = 1 AS isOn
          FROM ac_readings
          WHERE household_id = ${householdId}
            AND reading_date >= today() - 27
          GROUP BY toMonday(reading_date)
          ORDER BY toMonday(reading_date)
        `,
      }),
      // Behaviour summary over last 30 days
      client.query({
        query: `
          SELECT
            round(avg(daily_kwh), 2) as avg_daily_kwh,
            round(avg(daily_runtime_h), 1) as avg_daily_runtime_h,
            argMax(toString(reading_date), daily_kwh) as highest_day,
            argMax(toHour(peak_ts), daily_kwh) as peak_usage_hour,
            argMax(toDayOfWeek(reading_date), daily_kwh) as highest_dow
          FROM (
            SELECT
              reading_date,
              round(sum(kwh), 2) as daily_kwh,
              countIf(is_on) * 0.5 as daily_runtime_h,
              argMax(ts, kwh) as peak_ts
            FROM ac_readings
            WHERE household_id = ${householdId}
              AND reading_date >= today() - 30
            GROUP BY reading_date
          )
        `,
      }),
      // Spike events: hourly readings > 1.5x average over last 7 days, top 3
      client.query({
        query: `
          WITH hourly AS (
            SELECT
              reading_date,
              toHour(ts) as hr,
              round(sum(kwh), 2) as kwh
            FROM ac_readings
            WHERE household_id = ${householdId}
              AND reading_date >= today() - 7
            GROUP BY reading_date, toHour(ts)
          ),
          avg_kwh AS (SELECT avg(kwh) as avg_val FROM hourly WHERE kwh > 0)
          SELECT
            h.reading_date,
            h.hr,
            h.kwh,
            round((h.kwh - a.avg_val) / a.avg_val * 100, 0) as pct_above_avg,
            concat(
              formatDateTime(h.reading_date, '%b'), ' ',
              toString(toDayOfMonth(h.reading_date)), ', ',
              toString(toYear(h.reading_date)),
              ' ', lpad(toString(h.hr), 2, '0'), ':00'
            ) as datetime_label
          FROM hourly h, avg_kwh a
          WHERE h.kwh > a.avg_val * 1.5
          ORDER BY h.kwh DESC
          LIMIT 3
        `,
      }),
      // vs same trailing 7-day window last month
      client.query({
        query: `
          SELECT
            round(sumIf(kwh, interval_date >= today() - 7), 2) as this_week,
            round(sumIf(kwh, interval_date >= today() - 35 AND interval_date < today() - 28), 2) as same_week_last_month
          FROM sp_energy_intervals
          WHERE household_id = ${householdId}
        `,
      }),
      // District (Punggol neighbourhood) weekly total — for comparisons.vsDistrict
      client.query({
        query: `
          SELECT
            round(sumMerge(total_kwh), 2) AS district_week_kwh,
            toUInt32(uniqMerge(active_homes)) AS homes
          FROM neighborhood_rollup
          WHERE neighborhood_id = 'punggol'
            AND interval_date >= today() - 7
        `,
      }),
      // District per-day avg — for week chart data points
      client.query({
        query: `
          SELECT
            interval_date,
            round(sumMerge(total_kwh) / toFloat64(uniqMerge(active_homes)), 3) AS district_per_home_kwh
          FROM neighborhood_rollup
          WHERE neighborhood_id = 'punggol'
            AND interval_date >= today() - 7
            AND interval_date < today()
          GROUP BY interval_date
          ORDER BY interval_date
        `,
      }),
      // District per-hour avg (2 slots per hour) — for day chart data points
      client.query({
        query: `
          SELECT
            toUInt8(slot_idx / 2) AS hour,
            round(sumMerge(total_kwh) / toFloat64(uniqMerge(active_homes)), 4) AS district_per_home_kwh
          FROM neighborhood_rollup
          WHERE neighborhood_id = 'punggol'
            AND interval_date = today()
          GROUP BY hour
          ORDER BY hour
        `,
      }),
      // District per-week avg — for month chart data points
      client.query({
        query: `
          SELECT
            toMonday(interval_date) AS week_start,
            round(sumMerge(total_kwh) / toFloat64(uniqMerge(active_homes)), 2) AS district_per_home_kwh
          FROM neighborhood_rollup
          WHERE neighborhood_id = 'punggol'
            AND interval_date >= today() - 27
          GROUP BY toMonday(interval_date)
          ORDER BY week_start
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
    const weekJson = (await weekResult.json()) as {
      data?: Array<{
        reading_date: string;
        day_label: string;
        kwh: string;
        reading_date_str?: string;
      }>;
    };
    const dayJson = (await dayResult.json()) as {
      data?: Array<{
        hour: number;
        time_label: string;
        kwh: string;
        is_on: number;
      }>;
    };
    const lastWeekJson = (await lastWeekResult.json()) as {
      data?: Array<{ total: string }>;
    };
    const monthJson = (await monthResult.json()) as {
      data?: Array<{
        week_start: string;
        time: string;
        value: string;
        isOn: number;
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
    const spikesJson = (await spikesResult.json()) as {
      data?: Array<{
        reading_date: string;
        hr: number;
        kwh: string;
        pct_above_avg: string;
        datetime_label: string;
      }>;
    };
    const vsLastMonthJson = (await vsLastMonthResult.json()) as {
      data?: Array<{ this_week: string; same_week_last_month: string }>;
    };
    const districtJson = (await districtResult.json()) as {
      data?: Array<{ district_week_kwh: string; homes: number }>;
    };
    const districtWeekPointsJson = (await districtWeekPointsResult.json()) as {
      data?: Array<{ interval_date: string; district_per_home_kwh: string }>;
    };
    const districtDayPointsJson = (await districtDayPointsResult.json()) as {
      data?: Array<{ hour: number; district_per_home_kwh: string }>;
    };
    const districtMonthPointsJson =
      (await districtMonthPointsResult.json()) as {
        data?: Array<{ week_start: string; district_per_home_kwh: string }>;
      };

    // Build lookup maps: key → { districtAvg, singaporeAvg }
    // Singapore avg is labelled as estimated reference (88% of Punggol, newer estate baseline)
    const districtByDate = new Map(
      (districtWeekPointsJson.data ?? []).map((r) => [
        r.interval_date,
        parseFloat(r.district_per_home_kwh),
      ]),
    );
    const districtByHour = new Map(
      (districtDayPointsJson.data ?? []).map((r) => [
        r.hour,
        parseFloat(r.district_per_home_kwh),
      ]),
    );
    const districtByWeekStart = new Map(
      (districtMonthPointsJson.data ?? []).map((r) => [
        r.week_start,
        parseFloat(r.district_per_home_kwh),
      ]),
    );

    const today = todayJson.data?.[0];
    const weekData = weekJson.data ?? [];
    const dayData = dayJson.data ?? [];
    const monthData = monthJson.data ?? [];
    const lastWeekKwh = parseFloat(lastWeekJson.data?.[0]?.total ?? "0");
    const sp = spJson.data?.[0];
    const beh = behaviourJson.data?.[0];
    const spikesData = spikesJson.data ?? [];
    const lastMonth = vsLastMonthJson.data?.[0];
    const districtRow = districtJson.data?.[0];
    const districtWeekKwh = parseFloat(districtRow?.district_week_kwh ?? "0");
    const districtHomes = districtRow?.homes ?? 1;
    // Per-home district weekly avg; Singapore national avg is ~88% of Punggol (newer estate)
    const districtPerHomeWeekKwh =
      districtHomes > 0
        ? Math.round((districtWeekKwh / districtHomes) * 100) / 100
        : 0;
    const sgNationalPerHomeWeekKwh =
      Math.round(districtPerHomeWeekKwh * 0.88 * 100) / 100;

    const thisWeekAcKwh = weekData.reduce((s, r) => s + parseFloat(r.kwh), 0);
    const vsLastWeekPct =
      lastWeekKwh > 0 ? ((thisWeekAcKwh - lastWeekKwh) / lastWeekKwh) * 100 : 0;

    const spThisWeek = parseFloat(sp?.this_week_kwh ?? "0");
    const spLastWeek = parseFloat(sp?.last_week_kwh ?? "0");
    const spVsLastWeekPct =
      spLastWeek > 0 ? ((spThisWeek - spLastWeek) / spLastWeek) * 100 : 0;

    const lastMonthKwh = parseFloat(lastMonth?.same_week_last_month ?? "0");
    const vsLastMonthPct =
      lastMonthKwh > 0 ? ((spThisWeek - lastMonthKwh) / lastMonthKwh) * 100 : 0;

    // Format peak hour as a readable range e.g. "3 AM – 4 AM"
    const peakHr = beh?.peak_usage_hour ?? 0;
    const fmtHour = (h: number) =>
      h === 0
        ? "12 AM"
        : h < 12
          ? `${h} AM`
          : h === 12
            ? "12 PM"
            : `${h - 12} PM`;
    const peakHourRange = `${fmtHour(peakHr)} – ${fmtHour((peakHr + 1) % 24)}`;
    const DAYS = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const highestWeekday = DAYS[(beh?.highest_dow ?? 1) - 1] ?? "Unknown";

    // Today's date label for day chart subtitle
    const todayLabel = new Date().toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Singapore",
    });

    return {
      householdId,
      todayLabel,
      today: {
        energyKwh: parseFloat(today?.energy_today_kwh ?? "0"),
        runtimeHours: today?.runtime_today_hours ?? 0,
        status: today?.is_on_now ? "On" : "Off",
        temperature: today?.temp_setting || 24,
      },
      charts: {
        day: dayData.map((r) => {
          const dAvg = districtByHour.get(r.hour) ?? null;
          return {
            time: r.time_label,
            value: parseFloat(r.kwh),
            isOn: Boolean(r.is_on),
            districtAvg: dAvg !== null ? Math.round(dAvg * 1000) / 1000 : null,
            singaporeAvg:
              dAvg !== null ? Math.round(dAvg * 0.88 * 1000) / 1000 : null,
          };
        }),
        week: weekData.map((r) => {
          const dAvg = districtByDate.get(r.reading_date) ?? null;
          return {
            time: r.day_label,
            value: parseFloat(r.kwh),
            isOn: true,
            districtAvg: dAvg !== null ? Math.round(dAvg * 100) / 100 : null,
            singaporeAvg:
              dAvg !== null ? Math.round(dAvg * 0.88 * 100) / 100 : null,
          };
        }),
        month: monthData.map((r) => {
          const dAvg = districtByWeekStart.get(r.week_start) ?? null;
          return {
            time: r.time,
            value: parseFloat(r.value),
            isOn: Boolean(r.isOn),
            districtAvg: dAvg !== null ? Math.round(dAvg * 100) / 100 : null,
            singaporeAvg:
              dAvg !== null ? Math.round(dAvg * 0.88 * 100) / 100 : null,
          };
        }),
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
      spikeEvents: spikesData.map((s) => ({
        datetimeLabel: s.datetime_label,
        kwh: parseFloat(s.kwh),
        pctAboveAvg: parseFloat(s.pct_above_avg),
      })),
      comparisons: {
        vsLastWeek: {
          thisWeekKwh: Math.round(thisWeekAcKwh * 100) / 100,
          lastWeekKwh: Math.round(lastWeekKwh * 100) / 100,
          percentChange: Math.round(vsLastWeekPct * 10) / 10,
        },
        vsLastMonth: {
          thisWeekKwh: spThisWeek,
          sameWeekLastMonthKwh: lastMonthKwh,
          percentChange: Math.round(vsLastMonthPct * 10) / 10,
        },
        vsDistrict: {
          // Uses total SP energy for apples-to-apples vs district rollup
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
      // Legacy flat fields kept for backward compat
      usageDay: dayData.map((r) => ({
        time: r.time_label,
        value: parseFloat(r.kwh),
        isOn: Boolean(r.is_on),
      })),
      usageWeek: weekData.map((r) => ({
        time: r.day_label,
        value: parseFloat(r.kwh),
        isOn: true,
      })),
      usageMonth: monthData.map((r) => ({
        time: r.time,
        value: parseFloat(r.value),
        isOn: Boolean(r.isOn),
      })),
      vsLastWeek: {
        thisWeekKwh: Math.round(thisWeekAcKwh * 100) / 100,
        lastWeekKwh: Math.round(lastWeekKwh * 100) / 100,
        percentChange: Math.round(vsLastWeekPct * 10) / 10,
      },
      spEnergy: {
        thisWeekKwh: spThisWeek,
        lastWeekKwh: spLastWeek,
        thisWeekCostSgd: parseFloat(sp?.this_week_cost ?? "0"),
        thisWeekCarbonKg: parseFloat(sp?.this_week_carbon ?? "0"),
        vsLastWeekPct: Math.round(spVsLastWeekPct * 10) / 10,
      },
    };
  },
  ["aircon-household"],
  { revalidate: 300 }, // 5-min TTL — AC readings arrive every 30 min
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
    const data = await fetchHouseholdData(householdId);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/aircon/household]", err);
    return NextResponse.json(
      { error: "Failed to fetch data", details: String(err) },
      { status: 500 },
    );
  }
}
