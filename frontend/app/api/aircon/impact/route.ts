/**
 * GET /api/aircon/impact
 * Fetches household-level AC impact data from ClickHouse for the aircon-impact page.
 */

import { NextResponse } from "next/server";
import { getClickHouseClient, HOUSEHOLD_TO_ROOM } from "@/lib/clickhouse";

const ROOM_NAMES: Record<string, string> = {
  "master-room": "Master Bedroom",
  "room-1": "Bedroom 2",
  "room-2": "Bedroom 3",
  "living-room": "Living Room",
};

export async function GET() {
  try {
    const client = getClickHouseClient();

    // 1. This week vs last week totals (all households)
    const weeklyResult = await client.query({
      query: `
        SELECT
          sumIf(kwh, reading_date >= today() - 7 AND reading_date < today()) as this_week,
          sumIf(kwh, reading_date >= today() - 14 AND reading_date < today() - 7) as last_week
        FROM ac_readings
        WHERE household_id IN (1001, 1002, 1003, 1004)
      `,
    });
    const weeklyJson = (await weeklyResult.json()) as {
      data?: Array<{ this_week: string; last_week: string }>;
    };
    const weeklyRows = weeklyJson.data ?? [];
    const thisWeek = parseFloat(weeklyRows[0]?.this_week ?? "0");
    const lastWeek = parseFloat(weeklyRows[0]?.last_week ?? "0");
    const percentChange = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;
    const tariff = 0.2911;
    const thisWeekCost = (thisWeek * tariff).toFixed(2);
    const lastWeekCost = (lastWeek * tariff).toFixed(2);

    // 2. Daily breakdown for chart (last 7 days)
    const chartResult = await client.query({
      query: `
        SELECT
          formatDateTime(reading_date, '%a') as day_label,
          round(sum(kwh), 2) as kwh
        FROM ac_readings
        WHERE household_id IN (1001, 1002, 1003, 1004)
          AND reading_date >= today() - 7
          AND reading_date < today()
        GROUP BY reading_date
        ORDER BY reading_date
      `,
    });
    const chartJson = (await chartResult.json()) as {
      data?: Array<{ day_label: string; kwh: string }>;
    };
    const chartData = chartJson.data ?? [];

    // 3. Per-household (room) breakdown
    const roomResult = await client.query({
      query: `
        SELECT
          household_id,
          round(sum(kwh), 2) as total_kwh,
          countIf(is_on) * 0.5 as runtime_hours,
          avgIf(temp_setting_c, is_on) as avg_temp
        FROM ac_readings
        WHERE household_id IN (1001, 1002, 1003, 1004)
          AND reading_date >= today() - 7
          AND reading_date < today()
        GROUP BY household_id
      `,
    });
    const roomJson = (await roomResult.json()) as {
      data?: Array<{
      household_id: number;
      total_kwh: string;
      runtime_hours: number;
      avg_temp: number;
    }>;
    };
    const roomRows = roomJson.data ?? [];

    const totalKwh = roomRows.reduce((s, r) => s + parseFloat(r.total_kwh), 0);
    const roomUsageData = roomRows.map((r) => {
      const roomSlug = HOUSEHOLD_TO_ROOM[r.household_id];
      const kwh = parseFloat(r.total_kwh);
      const pct = totalKwh > 0 ? (kwh / totalKwh) * 100 : 0;
      return {
        id: roomSlug ?? `hh-${r.household_id}`,
        name: roomSlug ? ROOM_NAMES[roomSlug] : `Household ${r.household_id}`,
        status: r.runtime_hours > 0 ? "Running" : "Idle",
        usageKwh: kwh,
        percentOfTotal: Math.round(pct * 10) / 10,
        runtimeHours: Math.round(r.runtime_hours * 10) / 10,
        avgTempC: Math.round(r.avg_temp || 24),
        trendNote: "From ClickHouse",
      };
    });

    return NextResponse.json({
      summary: {
        totalKwhThisWeek: Math.round(thisWeek * 100) / 100,
        costThisWeek: `S$${thisWeekCost}`,
        savedVsLastWeek: lastWeek > thisWeek ? (lastWeek - thisWeek) * tariff : 0,
      },
      weeklyComparison: {
        thisWeek,
        lastWeek,
        percentChange: Math.round(percentChange * 10) / 10,
        thisWeekCost: `S$${thisWeekCost}`,
        lastWeekCost: `S$${lastWeekCost}`,
      },
      chartData: chartData.map((r) => ({
        label: r.day_label,
        value: parseFloat(r.kwh),
      })),
      roomUsageData,
    });
  } catch (err) {
    console.error("[api/aircon/impact]", err);
    return NextResponse.json(
      { error: "Failed to fetch impact data", details: (err as Error).message },
      { status: 500 }
    );
  }
}
