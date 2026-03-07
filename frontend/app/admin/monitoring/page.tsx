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

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
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
      <div className="flex items-center justify-center gap-2 py-20 text-[#6f8c91]">
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading monitoring…
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#10363b]">
          Monitoring
        </h1>
        <p className="mt-1 text-sm text-[#6f8c91]">
          Real-time energy monitoring and trend analysis — Punggol neighbourhood
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          title="Current Regional Load"
          value={region ? `${region.total_kwh.toFixed(1)} kWh` : "—"}
          subtitle="7-day total"
          accent="teal"
        />
        <StatCard
          title="Peak Usage"
          value={region ? `${region.peak_kwh.toFixed(1)} kWh` : "—"}
          subtitle="Peak-hour slots"
          accent="amber"
        />
        <StatCard
          title="Off-Peak"
          value={region ? `${region.offpeak_kwh.toFixed(1)} kWh` : "—"}
          subtitle="Off-peak slots"
          accent="sky"
        />
      </div>

      {/* Demand heatmap */}
      <div className="mt-6 rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-white/95 to-[rgba(243,249,249,0.88)] p-6 shadow-[0_4px_16px_rgba(0,123,138,0.06)]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
              Demand Heatmap — kWh by date × half-hour slot
            </h3>
            <p className="mt-1 text-xs text-[#9bb5b9]">
              Darker teal = higher usage. Refreshes every 60s.
            </p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-2 text-[10px] text-[#6f8c91]">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((o) => (
                <div key={o} className="h-3 w-4 rounded-sm bg-[#86ccd2]" style={{ opacity: o }} />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {dates.length > 0 ? (
            <div className="inline-block min-w-full">
              {/* Hour labels */}
              <div className="mb-2 ml-36 flex gap-0.5 text-[10px] text-[#9bb5b9]">
                {Array.from({ length: 48 }, (_, i) => (
                  <span key={i} className="w-3 shrink-0 text-center">
                    {i % 4 === 0 ? (i / 2) % 24 : ""}
                  </span>
                ))}
              </div>
              {dates.map((date) => {
                const slots = byDate[date];
                const slotMap = Object.fromEntries(slots.map((s) => [s.slot_idx, s]));
                return (
                  <div key={date} className="mb-1.5 flex items-center gap-2">
                    <span className="w-32 shrink-0 text-right text-xs text-[#6f8c91]">
                      {fmtDate(date)}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 48 }, (_, i) => {
                        const s = slotMap[i];
                        const kwh = s?.total_kwh ?? 0;
                        const opacity = maxKwh > 0 ? kwh / maxKwh : 0;
                        return (
                          <div
                            key={i}
                            className="h-4 w-3 rounded-sm bg-[#00a3ad] transition-colors"
                            style={{ opacity: 0.15 + opacity * 0.85 }}
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
            <div className="py-12 text-center text-sm text-[#6f8c91]">
              No heatmap data — run seed scripts to populate ClickHouse
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
