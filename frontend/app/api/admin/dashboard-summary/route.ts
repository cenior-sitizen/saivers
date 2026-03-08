/**
 * Proxy GET /api/admin/dashboard-summary to Saivers backend.
 */

import { NextResponse } from "next/server";

const BASE = process.env.WATTCOACH_API_URL || "http://localhost:8000";

export async function GET() {
  const target = `${BASE}/api/admin/dashboard-summary`;

  try {
    const res = await fetch(target, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/admin/dashboard-summary proxy]", err);
    return NextResponse.json(
      { error: "Backend unavailable", details: (err as Error).message },
      { status: 502 }
    );
  }
}
