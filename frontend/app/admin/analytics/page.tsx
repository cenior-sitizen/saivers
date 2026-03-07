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
          Loading analytics…
        </div>
      </div>
    );
  }

  const dailyData = Object.entries(
    heatmap.reduce<Record<string, number>>((acc, s) => {
      acc[s.interval_date] = (acc[s.interval_date] ?? 0) + s.total_kwh;
      return acc;
    }, {})
  )
    .map(([date, kwh]) => ({ date: date.slice(5), kwh }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const householdData =
    grid?.households.map((h) => ({
      name: `HH ${h.household_id}`,
      reduction: h.reduction_pct,
      kwh: h.this_week_peak_kwh,
    })) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Analytics
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Data visualisation — time-series, regional comparison, heatmaps
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Demand Time-Series
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Daily kWh (7 days)
          </p>
          <div className="mt-4 h-64">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
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
                    tickFormatter={(v) => `${v}`}
                    className="text-zinc-500"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid rgb(228 228 231)",
                    }}
                    formatter={(v) => [`${Number(v ?? 0).toFixed(2)} kWh`, "Usage"]}
                  />
                  <Bar dataKey="kwh" fill="#86ccd2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-400">
                No data
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Regional Comparison — Peak Reduction %
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            This week vs 4-week baseline per household
          </p>
          <div className="mt-4 h-64">
            {householdData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={householdData}
                  layout="vertical"
                  margin={{ left: 40 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-zinc-200 dark:stroke-zinc-700"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${v}%`}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid rgb(228 228 231)",
                    }}
                    formatter={(v) => [
                      `${Number(v ?? 0).toFixed(1)}%`,
                      "Reduction",
                    ]}
                  />
                  <Bar dataKey="reduction" radius={[0, 4, 4, 0]}>
                    {householdData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          householdData[i].reduction >= 0
                            ? "#10b981"
                            : "#f59e0b"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-400">
                No household data
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Baseline vs Actual
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          energy_features table provides baseline_kwh and excess_kwh per
          half-hour slot. Use the AI Assistant to query: SELECT household_id,
          ts, baseline_kwh, excess_kwh, anomaly_score FROM energy_features WHERE
          anomaly_score &gt; 2.
        </p>
      </div>
    </div>
  );
}
