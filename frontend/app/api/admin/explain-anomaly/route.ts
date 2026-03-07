/**
 * Proxy POST /api/admin/explain-anomaly to WattCoach backend.
 */

import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.WATTCOACH_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const target = `${BASE}/api/admin/explain-anomaly`;

  try {
    const body = await request.text();
    const res = await fetch(target, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/admin/explain-anomaly proxy]", err);
    return NextResponse.json(
      { error: "Backend unavailable", details: (err as Error).message },
      { status: 502 }
    );
  }
}
