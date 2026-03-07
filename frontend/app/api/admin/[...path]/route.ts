/**
 * Proxy /api/admin/* to WattCoach backend.
 * Set WATTCOACH_API_URL in .env (default: http://localhost:8000)
 */

import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.WATTCOACH_API_URL || "http://localhost:8000";

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
  method: string
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const url = new URL(request.url);
  const search = url.searchParams.toString();
  const target = `${BASE}/api/admin/${pathStr}${search ? `?${search}` : ""}`;

  try {
    const init: RequestInit = {
      method,
      headers: { Accept: "application/json" },
    };
    if (method === "POST" && request.body) {
      init.headers = {
        ...init.headers,
        "Content-Type": "application/json",
      } as HeadersInit;
      init.body = await request.text();
    } else if (method === "GET") {
      (init as RequestInit & { next?: object }).next = { revalidate: 30 };
    }
    const res = await fetch(target, init);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[api/admin proxy]", err);
    return NextResponse.json(
      { error: "Backend unavailable", details: (err as Error).message },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, ctx, "GET");
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  return proxy(request, ctx, "POST");
}
