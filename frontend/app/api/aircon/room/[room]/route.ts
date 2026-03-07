/**
 * GET /api/aircon/room/[room]
 * Fetches room-level AC data from ClickHouse or FastAPI backend fallback.
 * Room slugs: master-room, room-1, room-2, living-room
 */

import { NextRequest, NextResponse } from "next/server";
import { getClickHouseClient, isClickHouseEnabled, ROOM_TO_HOUSEHOLD } from "@/lib/clickhouse";

const VALID_ROOMS = ["master-room", "room-1", "room-2", "living-room"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ room: string }> }
) {
  const { room } = await params;
  if (!room || !VALID_ROOMS.includes(room)) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  }

  const householdId = ROOM_TO_HOUSEHOLD[room];
  if (householdId === undefined) {
    return NextResponse.json({ error: "Room not mapped" }, { status: 400 });
  }

  // When ClickHouse disabled, proxy to FastAPI backend
  if (!isClickHouseEnabled()) {
    return fetchRoomFromBackend(room);
  }

  try {
    const client = getClickHouseClient();

    // 1. Today's summary (runtime, energy, status, temp)
    const todayResult = await client.query({
      query: `
        SELECT
          sum(kwh) as energy_today_kwh,
          countIf(is_on) * 0.5 as runtime_today_hours,
          argMax(is_on, ts) as is_on_now,
          argMax(temp_setting_c, ts) as temp_setting
        FROM ac_readings
        WHERE household_id = ${householdId}
          AND reading_date = today()
      `,
    });
    const todayJson = (await todayResult.json()) as {
      data?: Array<{
        energy_today_kwh: string;
        runtime_today_hours: number;
        is_on_now: number;
        temp_setting: number;
      }>;
    };
    const today = todayJson.data?.[0];

    // 2. Usage by day (last 7 days) - for week chart
    const weekResult = await client.query({
      query: `
        SELECT
          toDayOfWeek(reading_date) as dow,
          formatDateTime(reading_date, '%a') as day_label,
          round(sum(kwh), 2) as kwh
        FROM ac_readings
        WHERE household_id = ${householdId}
          AND reading_date >= today() - 7
          AND reading_date < today()
        GROUP BY reading_date, dow
        ORDER BY reading_date
      `,
    });
    const weekJson = (await weekResult.json()) as { data?: Array<{ dow: number; day_label: string; kwh: string }> };
    const weekData = weekJson.data ?? [];

    // 3. Usage by hour (today) - for day chart
    const dayResult = await client.query({
      query: `
        SELECT
          toHour(ts) as hour,
          formatDateTime(toStartOfHour(ts), '%H:%M') as time_label,
          round(sum(kwh), 2) as kwh,
          countIf(is_on) > 0 as is_on
        FROM ac_readings
        WHERE household_id = ${householdId}
          AND reading_date = today()
        GROUP BY toHour(ts)
        ORDER BY toHour(ts)
      `,
    });
    const dayJson = (await dayResult.json()) as {
      data?: Array<{ hour: number; time_label: string; kwh: string; is_on: number }>;
    };
    const dayData = dayJson.data ?? [];

    // 4. Last week total for comparison
    const lastWeekResult = await client.query({
      query: `
        SELECT round(sum(kwh), 2) as total
        FROM ac_readings
        WHERE household_id = ${householdId}
          AND reading_date >= today() - 14
          AND reading_date < today() - 7
      `,
    });
    const lastWeekJson = (await lastWeekResult.json()) as { data?: Array<{ total: string }> };
    const lastWeekRows = lastWeekJson.data ?? [];
    const lastWeekKwh = parseFloat(lastWeekRows[0]?.total ?? "0");

    const thisWeekKwh = weekData.reduce((s, r) => s + parseFloat(r.kwh), 0);
    const vsLastWeekPct =
      lastWeekKwh > 0 ? ((thisWeekKwh - lastWeekKwh) / lastWeekKwh) * 100 : 0;

    return NextResponse.json({
      room,
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
        thisWeekKwh,
        lastWeekKwh,
        percentChange: Math.round(vsLastWeekPct * 10) / 10,
      },
    });
  } catch (err) {
    console.error("[api/aircon/room]", err);
    return fetchRoomFromBackend(room);
  }
}

async function fetchRoomFromBackend(room: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${base}/api/aircon/room/${room}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend unavailable" },
        { status: 502 }
      );
    }
    const data = await res.json();
    if (data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: 502 }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/aircon/room] backend fetch:", err);
    return NextResponse.json(
      { error: "Failed to fetch from backend" },
      { status: 502 }
    );
  }
}
