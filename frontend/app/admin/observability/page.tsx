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
      <div className="flex items-center justify-center gap-2 py-20 text-[#6f8c91]">
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading observability…
      </div>
    );
  }

  const affectedCount = households.filter((h) => h.anomaly_count > 0).length;
  const totalAnomalies = anomalies?.total_anomalies ?? 0;
  const maxScore = anomalies?.max_score ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#10363b]">
          Observability
        </h1>
        <p className="mt-1 text-sm text-[#6f8c91]">
          Energy anomaly detection and data health — alerts, freshness,
          telemetry gaps
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          title="Active Anomalies"
          value={totalAnomalies}
          subtitle="Last 7 days (score > 2.0)"
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

      <div className="mt-6 overflow-hidden rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-white/95 to-[rgba(243,249,249,0.88)] shadow-[0_4px_16px_rgba(0,123,138,0.06)]">
        <div className="border-b border-[rgba(157,207,212,0.25)] px-6 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
            Telemetry Health — Households
          </h3>
          <p className="mt-1 text-xs text-[#9bb5b9]">
            Today&apos;s kWh, baseline, and anomaly count per household
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(157,207,212,0.25)]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6f8c91]">
                  Household
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#6f8c91]">
                  Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#6f8c91]">
                  Today kWh
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#6f8c91]">
                  Baseline
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#6f8c91]">
                  Anomalies
                </th>
              </tr>
            </thead>
            <tbody>
              {households.length > 0 ? (
                households.map((h) => (
                  <tr
                    key={h.household_id}
                    className="border-b border-[rgba(157,207,212,0.15)]"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-[#6f8c91]">
                      {h.household_id}
                    </td>
                    <td className="px-6 py-3 font-medium text-[#10363b]">
                      {h.name}{" "}
                      <span className="font-normal text-[#9bb5b9]">
                        ({h.flat_type})
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-[#10363b]">
                      {h.today_kwh.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-[#6f8c91]">
                      {h.today_baseline_kwh.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          h.anomaly_count > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {h.anomaly_count}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#6f8c91]">
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
