/**
 * GET /api/insights/detail/[id]
 * Fetch a single weekly insight by insight_id from ClickHouse.
 */
import { NextRequest, NextResponse } from "next/server";
import { getClickHouseClient, isClickHouseEnabled } from "@/lib/clickhouse";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing insight id" }, { status: 400 });
  }

  if (!isClickHouseEnabled()) {
    return NextResponse.json({ error: "ClickHouse not enabled" }, { status: 503 });
  }

  try {
    const client = getClickHouseClient();
    const result = await client.query({
      query: `
        SELECT
          insight_id,
          household_id,
          toString(week_start)       AS week_start,
          toString(generated_at)     AS generated_at,
          signal_type,
          ac_night_anomaly,
          nights_observed,
          weekly_increase,
          toFloat64(this_week_kwh)   AS this_week_kwh,
          toFloat64(last_week_kwh)   AS last_week_kwh,
          toFloat32(change_pct)      AS change_pct,
          toFloat64(weekly_cost_sgd) AS weekly_cost_sgd,
          toFloat64(weekly_carbon_kg) AS weekly_carbon_kg,
          ai_summary,
          recommendation_type,
          recommendation_json,
          notification_title,
          notification_body,
          status
        FROM weekly_insights FINAL
        WHERE insight_id = {id:String}
        LIMIT 1
      `,
      query_params: { id },
    });

    const json = (await result.json()) as { data?: unknown[] };
    if (!json.data || json.data.length === 0) {
      return NextResponse.json({ error: "Insight not found" }, { status: 404 });
    }

    const row = json.data[0] as Record<string, unknown>;
    return NextResponse.json({
      ...row,
      recommendation: JSON.parse((row.recommendation_json as string) || "{}"),
    });
  } catch (err) {
    console.error("[api/insights/detail]", err);
    return NextResponse.json(
      { error: "Failed to fetch insight", details: String(err) },
      { status: 500 }
    );
  }
}
