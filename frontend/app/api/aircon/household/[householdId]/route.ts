/**
 * GET /api/aircon/household/[householdId]
 * Returns AC data for a specific household directly by ID.
 * Used by the persona-switched user view.
 */

import { NextRequest, NextResponse } from "next/server";
import { getClickHouseClient, isClickHouseEnabled } from "@/lib/clickhouse";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ householdId: string }> }
) {
  const { householdId: hIdStr } = await params;
  const householdId = parseInt(hIdStr, 10);

  if (!householdId || isNaN(householdId)) {
    return NextResponse.json({ error: "Invalid householdId" }, { status: 400 });
  }

  if (!isClickHouseEnabled()) {
    return NextResponse.json({ error: "ClickHouse not enabled" }, { status: 503 });
  }

  try {
    const client = getClickHouseClient();

    const [todayResult, weekResult, dayResult, lastWeekResult, spResult] = await Promise.all([
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
      // Last 7 days by day (for week chart)
      client.query({
        query: `
          SELECT
            reading_date,
            formatDateTime(reading_date, '%a') as day_label,
            round(sum(kwh), 2) as kwh
          FROM ac_readings
          WHERE household_id = ${householdId}
            AND reading_date >= today() - 7
            AND reading_date < today()
          GROUP BY reading_date
          ORDER BY reading_date
        `,
      }),
      // Today by hour (for day chart)
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
      // Last week total
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
    ]);

    const todayJson = (await todayResult.json()) as {
      data?: Array<{ energy_today_kwh: string; runtime_today_hours: number; is_on_now: number; temp_setting: number }>;
    };
    const weekJson = (await weekResult.json()) as {
      data?: Array<{ reading_date: string; day_label: string; kwh: string }>;
    };
    const dayJson = (await dayResult.json()) as {
      data?: Array<{ hour: number; time_label: string; kwh: string; is_on: number }>;
    };
    const lastWeekJson = (await lastWeekResult.json()) as { data?: Array<{ total: string }> };
    const spJson = (await spResult.json()) as {
      data?: Array<{ this_week_kwh: string; last_week_kwh: string; this_week_cost: string; this_week_carbon: string }>;
    };

    const today = todayJson.data?.[0];
    const weekData = weekJson.data ?? [];
    const dayData = dayJson.data ?? [];
    const lastWeekKwh = parseFloat(lastWeekJson.data?.[0]?.total ?? "0");
    const sp = spJson.data?.[0];

    const thisWeekAcKwh = weekData.reduce((s, r) => s + parseFloat(r.kwh), 0);
    const vsLastWeekPct = lastWeekKwh > 0 ? ((thisWeekAcKwh - lastWeekKwh) / lastWeekKwh) * 100 : 0;

    const spThisWeek = parseFloat(sp?.this_week_kwh ?? "0");
    const spLastWeek = parseFloat(sp?.last_week_kwh ?? "0");
    const spVsLastWeekPct = spLastWeek > 0 ? ((spThisWeek - spLastWeek) / spLastWeek) * 100 : 0;

    return NextResponse.json({
      householdId,
      today: {
        energyKwh: parseFloat(today?.energy_today_kwh ?? "0"),
        runtimeHours: today?.runtime_today_hours ?? 0,
        status: today?.is_on_now ? "On" : "Off",
        temperature: today?.temp_setting || 24,
      },
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
    });
  } catch (err) {
    console.error("[api/aircon/household]", err);
    return NextResponse.json({ error: "Failed to fetch data", details: String(err) }, { status: 500 });
  }
}
