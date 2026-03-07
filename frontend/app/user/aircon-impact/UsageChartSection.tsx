"use client";

import { useState, useEffect } from "react";
import { UsageChart } from "@/components/UsageChart";

type UsagePeriod = "week" | "month" | "year";

const PERIOD_LABELS: Record<UsagePeriod, { title: string; unit: string }> = {
  week: { title: "Usage by Day", unit: "hours per day" },
  month: { title: "Usage by Week", unit: "hours per week" },
  year: { title: "Usage by Month", unit: "hours per month" },
};

interface UsageChartSectionProps {
  embedded?: boolean;
}

export function UsageChartSection({ embedded }: UsageChartSectionProps = {}) {
  const [period, setPeriod] = useState<UsagePeriod>("week");
  const [data, setData] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    fetch(`/api/aircon/impact/usage?period=${period}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => res?.data && setData(res.data))
      .catch(() => setData([]));
  }, [period]);

  return (
    <section className={embedded ? "" : "mb-6"}>
      <div className={`mb-3 flex flex-wrap items-center justify-between gap-2 ${embedded ? "justify-end" : ""}`}>
        {!embedded && (
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Usage Trend
          </h2>
        )}
        <div className="flex gap-1">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                period === p
                  ? "bg-[#86CCD2] text-white shadow-sm"
                  : "bg-white text-[#666666] hover:bg-[#86CCD2]/10 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-[#86CCD2]/20"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <UsageChart
        data={data}
        title={PERIOD_LABELS[period].title}
        unit={PERIOD_LABELS[period].unit}
      />
    </section>
  );
}
