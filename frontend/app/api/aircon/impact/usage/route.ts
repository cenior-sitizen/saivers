/**
 * GET /api/aircon/impact/usage?period=week|month|year
 * Returns runtime hours for the usage chart:
 * - week: days (last 7), value = hours per day
 * - month: weeks (last 4–5), value = hours per week
 * - year: months (last 12), value = hours per month
 */

import { NextRequest, NextResponse } from "next/server";
import { getClickHouseClient, isClickHouseEnabled } from "@/lib/clickhouse";

const HOUSEHOLD_IDS = [1001, 1002, 1003, 1004];

export async function GET(request: NextRequest) {
  const period = (request.nextUrl.searchParams.get("period") ?? "week") as "week" | "month" | "year";

  if (!["week", "month", "year"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  if (!isClickHouseEnabled()) {
    return NextResponse.json({ error: "ClickHouse disabled", data: [] }, { status: 200 });
  }

  try {
    const client = getClickHouseClient();
    const householdFilter = `household_id IN (${HOUSEHOLD_IDS.join(", ")})`;

    let query: string;

    switch (period) {
      case "week": {
        query = `
          SELECT
            formatDateTime(reading_date, '%a') as label,
            round(countIf(is_on) * 0.5, 2) as runtime_hours
          FROM ac_readings
          WHERE ${householdFilter}
            AND reading_date >= today() - 7
            AND reading_date < today()
          GROUP BY reading_date
          ORDER BY reading_date
        `;
        break;
      }
      case "month": {
        query = `
          SELECT
            formatDateTime(toStartOfWeek(reading_date), '%d %b') as label,
            round(countIf(is_on) * 0.5, 2) as runtime_hours
          FROM ac_readings
          WHERE ${householdFilter}
            AND reading_date >= today() - INTERVAL 4 WEEK
            AND reading_date < today()
          GROUP BY toStartOfWeek(reading_date)
          ORDER BY toStartOfWeek(reading_date)
        `;
        break;
      }
      case "year": {
        query = `
          SELECT
            formatDateTime(toStartOfMonth(reading_date), '%b') as label,
            round(countIf(is_on) * 0.5, 2) as runtime_hours
          FROM ac_readings
          WHERE ${householdFilter}
            AND reading_date >= subtractMonths(today(), 12)
            AND reading_date < today()
          GROUP BY toStartOfMonth(reading_date)
          ORDER BY toStartOfMonth(reading_date)
        `;
        break;
      }
    }

    const result = await client.query({ query });
    const json = (await result.json()) as {
      data?: Array<{ label: string; runtime_hours: string }>;
    };
    const rows = json.data ?? [];

    const data = rows.map((r) => ({
      label: r.label,
      value: parseFloat(r.runtime_hours),
    }));

    return NextResponse.json({ period, data });
  } catch (err) {
    console.error("[api/aircon/impact/usage]", err);
    return NextResponse.json({ error: "Failed to fetch usage", data: [] }, { status: 500 });
  }
}
