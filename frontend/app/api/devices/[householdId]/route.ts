/**
 * GET /api/devices/[householdId]
 * Returns the device registry for a household from ClickHouse.
 * Used to display real brand/model names in the room page.
 */

import { NextRequest, NextResponse } from "next/server";
import { getClickHouseClient, isClickHouseEnabled } from "@/lib/clickhouse";

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
    const client = getClickHouseClient();

    const result = await client.query({
      query: `
        SELECT
          device_id,
          room,
          device_type,
          brand,
          model_name
        FROM device_registry
        FINAL
        WHERE household_id = ${householdId}
        ORDER BY room, device_type
      `,
    });

    const json = (await result.json()) as {
      data?: Array<{
        device_id: string;
        room: string;
        device_type: string;
        brand: string;
        model_name: string;
      }>;
    };

    const devices = json.data ?? [];

    return NextResponse.json({
      householdId,
      devices,
      // Convenience map: device_id → { room, brand, model_name, device_type }
      byDeviceId: Object.fromEntries(
        devices.map((d) => [
          d.device_id,
          {
            room: d.room,
            brand: d.brand,
            modelName: d.model_name,
            deviceType: d.device_type,
          },
        ]),
      ),
    });
  } catch (err) {
    console.error("[api/devices/household]", err);
    return NextResponse.json(
      { error: "Failed to fetch device registry", details: String(err) },
      { status: 500 },
    );
  }
}
