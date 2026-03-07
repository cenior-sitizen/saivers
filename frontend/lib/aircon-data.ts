/**
 * Server-side data fetchers for aircon-impact page.
 * Uses ClickHouse only.
 */

import { getClickHouseClient, HOUSEHOLD_TO_ROOM } from "./clickhouse";

const ROOM_NAMES: Record<string, string> = {
  "master-room": "Master Bedroom",
  "room-1": "Bedroom 2",
  "room-2": "Bedroom 3",
  "living-room": "Living Room",
};

const TARIFF = 0.2911;

const RECOMMENDATIONS = [
  {
    id: "1",
    title: "Raise set temperature by 1–2°C",
    description:
      "Small adjustments can reduce energy use without sacrificing comfort.",
  },
  {
    id: "2",
    title: "Use timer mode at night",
    description:
      "Set the AC to turn off after you fall asleep to avoid overnight waste.",
  },
  {
    id: "3",
    title: "Avoid cooling unused rooms",
    description:
      "Keep doors closed and turn off AC in rooms you are not using.",
  },
];

export async function fetchImpactData() {
  try {
    const client = getClickHouseClient();

    const [weeklyResult, chartResult, roomResult] = await Promise.all([
      client.query({
        query: `
          SELECT
            sumIf(kwh, reading_date >= today() - 7 AND reading_date < today()) as this_week,
            sumIf(kwh, reading_date >= today() - 14 AND reading_date < today() - 7) as last_week
          FROM ac_readings
          WHERE household_id IN (1001, 1002, 1003, 1004)
        `,
      }),
      client.query({
        query: `
          SELECT formatDateTime(reading_date, '%a') as day_label, round(sum(kwh), 2) as kwh
          FROM ac_readings
          WHERE household_id IN (1001, 1002, 1003, 1004)
            AND reading_date >= today() - 7 AND reading_date < today()
          GROUP BY reading_date ORDER BY reading_date
        `,
      }),
      client.query({
        query: `
          SELECT household_id, round(sum(kwh), 2) as total_kwh,
            countIf(is_on) * 0.5 as runtime_hours,
            avgIf(temp_setting_c, is_on) as avg_temp
          FROM ac_readings
          WHERE household_id IN (1001, 1002, 1003, 1004)
            AND reading_date >= today() - 7 AND reading_date < today()
          GROUP BY household_id
        `,
      }),
    ]);

    const weeklyJson = (await weeklyResult.json()) as {
      data?: Array<{ this_week: string; last_week: string }>;
    };
    const chartJson = (await chartResult.json()) as {
      data?: Array<{ day_label: string; kwh: string }>;
    };
    const roomJson = (await roomResult.json()) as {
      data?: Array<{
        household_id: number;
        total_kwh: string;
        runtime_hours: number;
        avg_temp: number;
      }>;
    };

    const thisWeek = parseFloat(weeklyJson.data?.[0]?.this_week ?? "0");
    const lastWeek = parseFloat(weeklyJson.data?.[0]?.last_week ?? "0");
    const percentChange =
      lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

    const roomRows = roomJson.data ?? [];
    const totalKwh = roomRows.reduce((s, r) => s + parseFloat(r.total_kwh), 0);

    const savedVsLastWeek =
      lastWeek > thisWeek ? (lastWeek - thisWeek) * TARIFF : 0;
    const projectedMonthly = Math.round(savedVsLastWeek * 4.33 * 100) / 100;

    return {
      summary: {
        totalKwhThisWeek: Math.round(thisWeek * 100) / 100,
        costThisWeek: `S$${(thisWeek * TARIFF).toFixed(2)}`,
        savedVsLastWeek,
        savedThisWeekLabel: `S$${savedVsLastWeek.toFixed(2)} saved this week`,
        projectedMonthlySavings: `S$${projectedMonthly.toFixed(2)}`,
      },
      weeklyComparison: {
        thisWeek,
        lastWeek,
        percentChange: Math.round(percentChange * 10) / 10,
        thisWeekCost: `S$${(thisWeek * TARIFF).toFixed(2)}`,
        lastWeekCost: `S$${(lastWeek * TARIFF).toFixed(2)}`,
      },
      chartData: (chartJson.data ?? []).map((r) => ({
        label: r.day_label,
        value: parseFloat(r.kwh),
      })),
      roomUsageData: roomRows.map((r) => {
        const roomSlug = HOUSEHOLD_TO_ROOM[r.household_id];
        const kwh = parseFloat(r.total_kwh);
        const pct = totalKwh > 0 ? (kwh / totalKwh) * 100 : 0;
        return {
          id: roomSlug ?? `hh-${r.household_id}`,
          name: roomSlug ? ROOM_NAMES[roomSlug] : `Household ${r.household_id}`,
          status: (r.runtime_hours > 0 ? "Running" : "Idle") as "Running" | "Idle" | "Recently Active",
          usageKwh: kwh,
          percentOfTotal: Math.round(pct * 10) / 10,
          runtimeHours: Math.round(r.runtime_hours * 10) / 10,
          avgTempC: Math.round(r.avg_temp || 24),
          trendNote: "From ClickHouse",
        };
      }),
      savingsInsight: {
        savedThisWeek:
          savedVsLastWeek > 0
            ? `You have already saved S$${savedVsLastWeek.toFixed(2)} this week compared with last week.`
            : "Compare your usage with last week below.",
        projectedMonthly:
          savedVsLastWeek > 0
            ? `If you maintain this pattern, you may save around S$${projectedMonthly.toFixed(2)} this month.`
            : "Reduce usage to see projected savings.",
      },
      spikeEvents: [] as { id: string; time: string; description: string }[],
      recommendations: RECOMMENDATIONS,
    };
  } catch (err) {
    console.error("[lib/aircon-data] fetchImpactData:", err);
    throw err;
  }
}
