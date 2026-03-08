import { NextResponse } from "next/server";

const PURIFIER_API_URL = process.env.PURIFIER_API_URL ?? "http://127.0.0.1:8002";

export async function POST() {
  try {
    const res = await fetch(`${PURIFIER_API_URL}/api/test/xiaomi/purifier/off`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : 502 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Purifier service unreachable", detail: String(err) },
      { status: 503 }
    );
  }
}
