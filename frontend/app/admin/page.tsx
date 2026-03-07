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
  type RegionSummary,
  type GridContribution,
  type HeatmapSlot,
} from "@/lib/admin-api";
import { StatCard } from "@/components/admin/StatCard";

function formatKwh(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(1);
}

export default function AdminPage() {
  const [region, setRegion] = useState<RegionSummary | null>(null);
  const [grid, setGrid] = useState<GridContribution | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapSlot[]>([]);
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
    ]).then(([r, g, h]) => {
      setRegion(r ?? null);
      setGrid(g ?? null);
      setHeatmap(h ?? []);
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
              if (!acc[key]) acc[key] = { date: key.slice(5), kwh: 0 };
              acc[key].kwh += s.total_kwh;
              return acc;
            },
            {}
          )
        ).map(([, v]) => v)
      : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Regional energy overview — Punggol neighbourhood
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {error}. Ensure the WattCoach backend is running on port 8000.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Energy (7d)"
          value={region ? `${formatKwh(region.total_kwh)} kWh` : "—"}
          subtitle={region ? `${region.household_count} households` : undefined}
          accent="emerald"
        />
        <StatCard
          title="Cost"
          value={region ? `S$ ${region.total_cost_sgd.toFixed(2)}` : "—"}
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
            grid
              ? `${grid.neighborhood_total_reduction_pct >= 0 ? "" : ""}${grid.neighborhood_total_reduction_pct.toFixed(1)}%`
              : "—"
          }
          subtitle={grid ? "vs 4-week baseline" : undefined}
          accent={grid && grid.neighborhood_total_reduction_pct > 0 ? "emerald" : "zinc"}
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

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
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
                  className="stroke-zinc-200 dark:stroke-zinc-700"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="text-zinc-500"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${v} kWh`}
                  className="text-zinc-500"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid rgb(228 228 231)",
                  }}
                  formatter={(v) => [`${Number(v ?? 0).toFixed(2)} kWh`, "Usage"]}
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
            <div className="flex h-full items-center justify-center text-zinc-400">
              No trend data — run seed scripts to populate ClickHouse
            </div>
          )}
        </div>
      </div>

      {grid && grid.households.length > 0 && (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Household Peak Reduction
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                    Household
                  </th>
                  <th className="py-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    This Week
                  </th>
                  <th className="py-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Baseline
                  </th>
                  <th className="py-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Reduction
                  </th>
                </tr>
              </thead>
              <tbody>
                {grid.households.slice(0, 10).map((h) => (
                  <tr
                    key={h.household_id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="py-2 font-medium">{h.household_id}</td>
                    <td className="py-2 text-right tabular-nums">
                      {h.this_week_peak_kwh.toFixed(2)} kWh
                    </td>
                    <td className="py-2 text-right tabular-nums text-zinc-500">
                      {h.baseline_peak_kwh.toFixed(2)} kWh
                    </td>
                    <td
                      className={`py-2 text-right tabular-nums font-medium ${
                        h.reduction_pct >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {h.reduction_pct >= 0 ? "" : "+"}
                      {h.reduction_pct.toFixed(1)}%
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
