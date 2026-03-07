"use client";

import type { ReactElement } from "react";

export type ActivityPeriod = "day" | "month" | "year";
export type DaySubGranularity = "1h" | "30m";

interface ActivityGranularityToggleProps {
  period: ActivityPeriod;
  onPeriodChange: (period: ActivityPeriod) => void;
}

const PERIOD_OPTIONS: { value: ActivityPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export function ActivityGranularityToggle({
  period,
  onPeriodChange,
}: ActivityGranularityToggleProps): ReactElement {
  return (
    <div className="flex flex-wrap gap-1">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onPeriodChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            period === opt.value
              ? "bg-[#86CCD2] text-white shadow-sm"
              : "bg-white text-[#666666] hover:bg-[#86CCD2]/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
