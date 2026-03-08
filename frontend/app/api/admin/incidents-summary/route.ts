/**
 * Proxy GET /api/admin/incidents-summary to Saivers backend.
 */

import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.WATTCOACH_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") ?? "7";
  const target = `${BASE}/api/admin/incidents-summary?days=${days}`;

  try {
    const res = await fetch(target, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/admin/incidents-summary proxy]", err);
    return NextResponse.json(
      { error: "Backend unavailable", details: (err as Error).message },
      { status: 502 }
    );
  }
}
