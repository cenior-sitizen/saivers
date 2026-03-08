import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const { householdId, deviceId, action, temp_c, start_time, end_time } =
      await req.json();

    if (!householdId || !deviceId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let res: Response;

    if (action === "temp" && temp_c != null) {
      res = await fetch(
        `${BACKEND}/api/aircon/${householdId}/${deviceId}/temp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ temp_c }),
        }
      );
    } else if (action === "timer" && start_time && end_time) {
      res = await fetch(
        `${BACKEND}/api/aircon/${householdId}/${deviceId}/timer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start_time, end_time, temp_c }),
        }
      );
    } else if (action === "timer_cancel") {
      res = await fetch(
        `${BACKEND}/api/aircon/${householdId}/${deviceId}/timer`,
        { method: "DELETE" }
      );
    } else if (action === "on") {
      res = await fetch(
        `${BACKEND}/api/aircon/${householdId}/${deviceId}/on`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ temp_c: temp_c ?? 25 }),
        }
      );
    } else if (action === "off") {
      res = await fetch(
        `${BACKEND}/api/aircon/${householdId}/${deviceId}/off`,
        { method: "POST" }
      );
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
