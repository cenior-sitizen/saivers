"use client";

import { useEffect, useState } from "react";
import {
  getAnomaliesSummary,
  getHouseholds,
  type AnomaliesSummary,
  type HouseholdSummary,
} from "@/lib/admin-api";
import { StatCard } from "@/components/admin/StatCard";

export default function ObservabilityPage() {
  const [anomalies, setAnomalies] = useState<AnomaliesSummary | null>(null);
  const [households, setHouseholds] = useState<HouseholdSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        getAnomaliesSummary(7).catch(() => null),
        getHouseholds().catch(() => []),
      ]).then(([a, h]) => {
        setAnomalies(a ?? null);
        setHouseholds(h ?? []);
        setLoading(false);
      });
    };
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
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
          Loading observability…
        </div>
      </div>
    );
  }

  const affectedCount = households.filter((h) => h.anomaly_count > 0).length;
  const totalAnomalies = anomalies?.total_anomalies ?? 0;
  const maxScore = anomalies?.max_score ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Observability
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Energy anomaly detection and data health — alerts, freshness,
          telemetry gaps
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Active Anomalies"
          value={totalAnomalies}
          subtitle="Last 7 days (score &gt; 2.0)"
          accent={totalAnomalies > 0 ? "amber" : "emerald"}
        />
        <StatCard
          title="Data Freshness"
          value={affectedCount > 0 ? `${affectedCount} affected` : "OK"}
          subtitle="Households with anomalies today"
          accent={affectedCount > 0 ? "amber" : "emerald"}
        />
        <StatCard
          title="Max Anomaly Score"
          value={maxScore.toFixed(1)}
          subtitle="Highest z-score detected"
          accent={maxScore > 3 ? "amber" : "zinc"}
        />
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Telemetry Health — Households
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            Today&apos;s kWh, baseline, and anomaly count per household
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-6 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Household
                </th>
                <th className="px-6 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Name
                </th>
                <th className="px-6 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                  Today kWh
                </th>
                <th className="px-6 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                  Baseline
                </th>
                <th className="px-6 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                  Anomalies
                </th>
              </tr>
            </thead>
            <tbody>
              {households.length > 0 ? (
                households.map((h) => (
                  <tr
                    key={h.household_id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-6 py-3 font-medium">{h.household_id}</td>
                    <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                      {h.name} ({h.flat_type})
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">
                      {h.today_kwh.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-zinc-500">
                      {h.today_baseline_kwh.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          h.anomaly_count > 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }`}
                      >
                        {h.anomaly_count}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-400"
                  >
                    No household data — run seed scripts and ensure
                    energy_features is populated
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
