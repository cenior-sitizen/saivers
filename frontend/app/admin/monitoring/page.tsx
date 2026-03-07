"use client";

import { useEffect, useState } from "react";
import {
  getRegionSummary,
  getPeakHeatmap,
  type RegionSummary,
  type HeatmapSlot,
} from "@/lib/admin-api";
import { StatCard } from "@/components/admin/StatCard";

const SLOT_LABELS: Record<number, string> = {};
for (let h = 0; h < 24; h++) {
  SLOT_LABELS[h * 2] = `${h.toString().padStart(2, "0")}:00`;
  SLOT_LABELS[h * 2 + 1] = `${h.toString().padStart(2, "0")}:30`;
}

export default function MonitoringPage() {
  const [region, setRegion] = useState<RegionSummary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        getRegionSummary().catch(() => null),
        getPeakHeatmap().catch(() => []),
      ]).then(([r, h]) => {
        setRegion(r ?? null);
        setHeatmap(h ?? []);
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
          Loading monitoring…
        </div>
      </div>
    );
  }

  const byDate = heatmap.reduce<Record<string, HeatmapSlot[]>>((acc, s) => {
    (acc[s.interval_date] ??= []).push(s);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort();
  const maxKwh = Math.max(...heatmap.map((s) => s.total_kwh), 0.01);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Monitoring
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Real-time energy monitoring and trend analysis across regions
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Current Regional Load"
          value={region ? `${region.total_kwh.toFixed(1)} kWh` : "—"}
          subtitle="7-day total"
          accent="emerald"
        />
        <StatCard
          title="Peak Usage"
          value={region ? `${region.peak_kwh.toFixed(1)} kWh` : "—"}
          subtitle="Peak slots"
          accent="amber"
        />
        <StatCard
          title="Off-Peak"
          value={region ? `${region.offpeak_kwh.toFixed(1)} kWh` : "—"}
          subtitle="Off-peak slots"
          accent="sky"
        />
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Demand Heatmap — kWh by date × half-hour slot
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          Darker = higher usage. Refreshes every 60s.
        </p>
        <div className="mt-4 overflow-x-auto">
          {dates.length > 0 ? (
            <div className="inline-block min-w-full">
              <div className="mb-2 flex gap-1 text-[10px] text-zinc-500">
                {Array.from({ length: 48 }, (_, i) => (
                  <span
                    key={i}
                    className="w-3 shrink-0 text-center"
                    title={SLOT_LABELS[i] ?? `${i}`}
                  >
                    {i % 4 === 0 ? (i / 2) % 24 : ""}
                  </span>
                ))}
              </div>
              {dates.map((date) => {
                const slots = byDate[date];
                const slotMap = Object.fromEntries(
                  slots.map((s) => [s.slot_idx, s])
                );
                return (
                  <div
                    key={date}
                    className="mb-1 flex items-center gap-2"
                  >
                    <span className="w-24 shrink-0 text-xs text-zinc-500">
                      {date.slice(5)}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 48 }, (_, i) => {
                        const s = slotMap[i];
                        const kwh = s?.total_kwh ?? 0;
                        const opacity = maxKwh > 0 ? kwh / maxKwh : 0;
                        return (
                          <div
                            key={i}
                            className="h-4 w-3 rounded-sm bg-[#86ccd2] transition-colors"
                            style={{
                              opacity: 0.2 + opacity * 0.8,
                            }}
                            title={`${date} ${SLOT_LABELS[i] ?? i}: ${kwh.toFixed(2)} kWh`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400">
              No heatmap data — run seed scripts to populate ClickHouse
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
