/**
 * GET /api/aircon/impact/activity?granularity=30m|1h|day|month|year
 * Fetches aircon ON/OFF activity from ClickHouse for all households (1001-1004).
 */

import { NextRequest, NextResponse } from "next/server";
import { getClickHouseClient, isClickHouseEnabled } from "@/lib/clickhouse";

const GRANULARITIES = ["30m", "1h", "day", "month", "year"] as const;
const HOUSEHOLD_IDS = [1001, 1002, 1003, 1004];

export async function GET(request: NextRequest) {
  const granularity =
    (request.nextUrl.searchParams.get("granularity") as (typeof GRANULARITIES)[number]) ??
    "1h";
  const dateParam = request.nextUrl.searchParams.get("date"); // YYYY-MM-DD for 30m/1h

  if (!GRANULARITIES.includes(granularity)) {
    return NextResponse.json({ error: "Invalid granularity" }, { status: 400 });
  }

  if (!isClickHouseEnabled()) {
    return NextResponse.json(
      { error: "ClickHouse disabled", data: [] },
      { status: 200 }
    );
  }

  try {
    const client = getClickHouseClient();
    let query: string;
    let result;

    const householdFilter = `household_id IN (${HOUSEHOLD_IDS.join(", ")})`;

    const dayFilter =
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
        ? `reading_date = '${dateParam}'`
        : "ts >= now() - INTERVAL 1 DAY";

    switch (granularity) {
      case "30m": {
        query = `
          SELECT
            toStartOfInterval(ts, INTERVAL 30 MINUTE) as slot_ts,
            formatDateTime(slot_ts, '%H:%M') as time_label,
            round(sum(kwh), 3) as kwh,
            countIf(is_on) > 0 as is_on
          FROM ac_readings
          WHERE ${householdFilter}
            AND ${dayFilter}
          GROUP BY slot_ts
          ORDER BY slot_ts
        `;
        result = await client.query({ query });
        break;
      }
      case "1h": {
        query = `
          SELECT
            toStartOfHour(ts) as slot_ts,
            formatDateTime(slot_ts, '%H:%M') as time_label,
            round(sum(kwh), 3) as kwh,
            countIf(is_on) > 0 as is_on
          FROM ac_readings
          WHERE ${householdFilter}
            AND ${dayFilter}
          GROUP BY slot_ts
          ORDER BY slot_ts
        `;
        result = await client.query({ query });
        break;
      }
      case "day": {
        query = `
          SELECT
            reading_date as slot_ts,
            formatDateTime(reading_date, '%a %d') as time_label,
            round(sum(kwh), 3) as kwh,
            countIf(is_on) > 0 as is_on
          FROM ac_readings
          WHERE ${householdFilter}
            AND reading_date >= today() - 30
            AND reading_date < today()
          GROUP BY reading_date
          ORDER BY reading_date
        `;
        result = await client.query({ query });
        break;
      }
      case "month": {
        query = `
          SELECT
            toStartOfMonth(reading_date) as slot_ts,
            formatDateTime(slot_ts, '%b %Y') as time_label,
            round(sum(kwh), 3) as kwh,
            countIf(is_on) > 0 as is_on
          FROM ac_readings
          WHERE ${householdFilter}
            AND reading_date >= subtractMonths(today(), 12)
            AND reading_date < today()
          GROUP BY slot_ts
          ORDER BY slot_ts
        `;
        result = await client.query({ query });
        break;
      }
      case "year": {
        query = `
          SELECT
            toStartOfYear(reading_date) as slot_ts,
            toString(toYear(reading_date)) as time_label,
            round(sum(kwh), 3) as kwh,
            countIf(is_on) > 0 as is_on
          FROM ac_readings
          WHERE ${householdFilter}
            AND reading_date >= subtractYears(today(), 5)
            AND reading_date < today()
          GROUP BY slot_ts, time_label
          ORDER BY slot_ts
        `;
        result = await client.query({ query });
        break;
      }
    }

    const json = (await result!.json()) as {
      data?: Array<{
        slot_ts: string;
        time_label: string;
        kwh: string;
        is_on: number;
      }>;
    };
    const rows = json.data ?? [];

    const data = rows.map((r) => ({
      time: r.time_label,
      value: parseFloat(r.kwh),
      isOn: Boolean(r.is_on),
    }));

    return NextResponse.json({ granularity, data });
  } catch (err) {
    console.error("[api/aircon/impact/activity]", err);
    return NextResponse.json(
      { error: "Failed to fetch activity", data: [] },
      { status: 500 }
    );
  }
}
