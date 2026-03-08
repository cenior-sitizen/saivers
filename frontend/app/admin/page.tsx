"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getRegionSummary,
  getGridContribution,
  getPeakHeatmap,
  getDashboardSummary,
  type RegionSummary,
  type GridContribution,
  type HeatmapSlot,
} from "@/lib/admin-api";
import { StatCard } from "@/components/admin/StatCard";

function formatKwh(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(1);
}

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
  // "2026-03-08" → "8 Mar 2026"
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPage() {
  const [region, setRegion] = useState<RegionSummary | null>(null);
  const [grid, setGrid] = useState<GridContribution | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapSlot[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getRegionSummary().catch((e) => {
        setError(e.message);
        return null;
      }),
      getGridContribution().catch(() => null),
      getPeakHeatmap().catch(() => []),
      getDashboardSummary().catch(() => ({ summary: "", ai_available: false })),
    ]).then(([r, g, h, summaryRes]) => {
      setRegion(r ?? null);
      setGrid(g ?? null);
      setHeatmap(h ?? []);
      setAiSummary(summaryRes?.summary ?? "");
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-zinc-500">
          <svg
            className="h-5 w-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading dashboard…
        </div>
      </div>
    );
  }

  const chartData =
    heatmap.length > 0
      ? Object.entries(
          heatmap.reduce<Record<string, { date: string; kwh: number }>>(
            (acc, s) => {
              const key = s.interval_date;
              if (!acc[key]) acc[key] = { date: fmtDate(key), kwh: 0 };
              acc[key].kwh += s.total_kwh;
              return acc;
            },
            {},
          ),
        ).map(([, v]) => v)
      : [];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#10363b]">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-[#6f8c91]">
          Regional energy overview — Punggol neighbourhood
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}. Ensure the Saivers backend is running on port 8000.
        </div>
      )}

      {aiSummary && (
        <div className="mb-6 rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-[rgba(0,163,173,0.06)] to-[rgba(243,249,249,0.88)] p-4 shadow-[0_4px_16px_rgba(0,123,138,0.06)]">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(0,163,173,0.12)]">
              <svg className="h-4 w-4 text-[#007B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">AI Summary</p>
              <p className="mt-1 text-sm leading-relaxed text-[#10363b]">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Energy (7d)"
          value={region ? `${formatKwh(region.total_kwh)} kWh` : "—"}
          subtitle={region ? `${region.household_count} households` : undefined}
          accent="teal"
        />
        <StatCard
          title="Est. Cost"
          value={region ? `S$${region.total_cost_sgd.toFixed(2)}` : "—"}
          subtitle={region ? "7-day period" : undefined}
          accent="sky"
        />
        <StatCard
          title="Carbon"
          value={region ? `${region.total_carbon_kg.toFixed(1)} kg` : "—"}
          subtitle={region ? "CO₂ equivalent" : undefined}
          accent="zinc"
        />
        <StatCard
          title="Peak Reduction"
          value={
            grid ? `${grid.neighborhood_total_reduction_pct.toFixed(1)}%` : "—"
          }
          subtitle={grid ? "vs 4-week baseline" : undefined}
          accent={
            grid && grid.neighborhood_total_reduction_pct > 0
              ? "emerald"
              : "zinc"
          }
          trend={
            grid
              ? grid.neighborhood_total_reduction_pct > 0
                ? "down"
                : grid.neighborhood_total_reduction_pct < 0
                  ? "up"
                  : "neutral"
              : undefined
          }
        />
      </div>

      {/* Energy trend chart */}
      <div className="mt-6 rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-white/95 to-[rgba(243,249,249,0.88)] p-6 shadow-[0_4px_16px_rgba(0,123,138,0.06)]">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
          Daily Energy Trend (7 days)
        </h3>
        <div className="mt-4 h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="kwhGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#86ccd2" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#86ccd2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#86CCD2"
                  strokeOpacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6f8c91" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6f8c91" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F3F9F9",
                    border: "1px solid #86CCD2",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(v) => [
                    `${Number(v ?? 0).toFixed(2)} kWh`,
                    "Usage",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="kwh"
                  stroke="#86ccd2"
                  strokeWidth={2}
                  fill="url(#kwhGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#6f8c91]">
              No trend data — run seed scripts to populate ClickHouse
            </div>
          )}
        </div>
      </div>

      {/* Household peak reduction table */}
      {grid && grid.households.length > 0 && (
        <div className="mt-6 rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-white/95 to-[rgba(243,249,249,0.88)] p-6 shadow-[0_4px_16px_rgba(0,123,138,0.06)]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
            Household Peak Reduction
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(157,207,212,0.35)]">
                  <th className="py-2.5 text-left text-xs font-semibold text-[#6f8c91]">
                    ID
                  </th>
                  <th className="py-2.5 text-left text-xs font-semibold text-[#6f8c91]">
                    Address
                  </th>
                  <th className="py-2.5 text-right text-xs font-semibold text-[#6f8c91]">
                    This Week
                  </th>
                  <th className="py-2.5 text-right text-xs font-semibold text-[#6f8c91]">
                    Baseline
                  </th>
                  <th className="py-2.5 text-right text-xs font-semibold text-[#6f8c91]">
                    Reduction
                  </th>
                </tr>
              </thead>
              <tbody>
                {grid.households.slice(0, 10).map((h) => (
                  <tr
                    key={h.household_id}
                    className="border-b border-[rgba(157,207,212,0.18)]"
                  >
                    <td className="py-2.5 font-mono text-xs text-[#6f8c91]">
                      {h.household_id}
                    </td>
                    <td className="py-2.5 font-medium text-[#10363b]">
                      {HOUSEHOLD_NAMES[h.household_id] ??
                        `Household ${h.household_id}`}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[#10363b]">
                      {h.this_week_peak_kwh.toFixed(2)} kWh
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[#6f8c91]">
                      {h.baseline_peak_kwh.toFixed(2)} kWh
                    </td>
                    <td
                      className={`py-2.5 text-right tabular-nums font-semibold ${
                        h.reduction_pct >= 0
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {h.reduction_pct >= 0 ? "−" : "+"}
                      {Math.abs(h.reduction_pct).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
