"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  getPeakHeatmap,
  getGridContribution,
  type HeatmapSlot,
  type GridContribution,
} from "@/lib/admin-api";

// Household address map — matches ClickHouse households table
const HOUSEHOLD_NAMES: Record<number, string> = {
  1001: "Blk 601 Punggol Drive",
  1002: "Blk 612 Punggol Way",
  1003: "Blk 623 Punggol Central",
  1004: "Blk 634 Punggol Road",
  1005: "Blk 645 Punggol Field",
  1006: "Blk 656 Punggol Place",
  1007: "Blk 667 Punggol Park",
  1008: "Blk 678 Punggol East",
  1009: "Blk 689 Punggol West",
  1010: "Waterway Terraces I",
};

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AnalyticsPage() {
  const [heatmap, setHeatmap] = useState<HeatmapSlot[]>([]);
  const [grid, setGrid] = useState<GridContribution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPeakHeatmap().catch(() => []),
      getGridContribution().catch(() => null),
    ]).then(([h, g]) => {
      setHeatmap(h ?? []);
      setGrid(g ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-[#6f8c91]">
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading analytics…
      </div>
    );
  }

  const dailyData = Object.entries(
    heatmap.reduce<Record<string, number>>((acc, s) => {
      acc[s.interval_date] = (acc[s.interval_date] ?? 0) + s.total_kwh;
      return acc;
    }, {})
  )
    .map(([date, kwh]) => ({ date: fmtDate(date), kwh }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const householdData =
    grid?.households.map((h) => ({
      name: HOUSEHOLD_NAMES[h.household_id] ?? `Household ${h.household_id}`,
      reduction: h.reduction_pct,
      kwh: h.this_week_peak_kwh,
    })) ?? [];

  const TOOLTIP_STYLE = {
    backgroundColor: "#F3F9F9",
    border: "1px solid #86CCD2",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#10363b",
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#10363b]">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-[#6f8c91]">
          Data visualisation — time-series, regional comparison, heatmaps
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Demand Time-Series */}
        <div className="rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-white/95 to-[rgba(243,249,249,0.88)] p-6 shadow-[0_4px_16px_rgba(0,123,138,0.06)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
            Demand Time-Series
          </h3>
          <p className="mt-1 text-xs text-[#9bb5b9]">Daily kWh (7 days)</p>
          <div className="mt-4 h-64">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#86CCD2"
                    strokeOpacity={0.2}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#6f8c91" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6f8c91" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [`${Number(v ?? 0).toFixed(2)} kWh`, "Usage"]}
                  />
                  <Bar dataKey="kwh" fill="#00a3ad" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#6f8c91]">
                No data — run seed scripts to populate ClickHouse
              </div>
            )}
          </div>
        </div>

        {/* Regional Comparison */}
        <div className="rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-white/95 to-[rgba(243,249,249,0.88)] p-6 shadow-[0_4px_16px_rgba(0,123,138,0.06)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
            Regional Comparison — Peak Reduction %
          </h3>
          <p className="mt-1 text-xs text-[#9bb5b9]">
            This week vs 4-week baseline per household
          </p>
          <div className="mt-4 h-64">
            {householdData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={householdData}
                  layout="vertical"
                  margin={{ left: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#86CCD2"
                    strokeOpacity={0.2}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6f8c91" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6f8c91" }}
                    axisLine={false}
                    tickLine={false}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v) => [
                      `${Number(v ?? 0).toFixed(1)}%`,
                      "Reduction",
                    ]}
                  />
                  <Bar dataKey="reduction" radius={[0, 4, 4, 0]}>
                    {householdData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.reduction >= 0 ? "#10b981" : "#f59e0b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#6f8c91]">
                No household data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Baseline vs Actual info card */}
      <div className="mt-6 rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-white/95 to-[rgba(243,249,249,0.88)] p-6 shadow-[0_4px_16px_rgba(0,123,138,0.06)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
          Baseline vs Actual
        </h3>
        <p className="mt-2 text-xs text-[#9bb5b9] leading-relaxed">
          The <code className="rounded bg-[rgba(0,163,173,0.08)] px-1 py-0.5 font-mono text-[#007B8A]">energy_features</code> table provides{" "}
          <code className="rounded bg-[rgba(0,163,173,0.08)] px-1 py-0.5 font-mono text-[#007B8A]">baseline_kwh</code> and{" "}
          <code className="rounded bg-[rgba(0,163,173,0.08)] px-1 py-0.5 font-mono text-[#007B8A]">excess_kwh</code> per half-hour slot.
          Use the AI Assistant to query:{" "}
          <code className="rounded bg-[rgba(0,163,173,0.08)] px-1 py-0.5 font-mono text-[#007B8A]">
            SELECT household_id, ts, baseline_kwh, excess_kwh, anomaly_score FROM energy_features WHERE anomaly_score &gt; 2
          </code>
        </p>
      </div>
    </div>
  );
}
