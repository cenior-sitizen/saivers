"use client";

import type { ReactElement } from "react";

export interface ActivityDataPoint {
  time: string;
  value: number;
  isOn: boolean;
}

interface ActivityTimelineChartProps {
  data: ActivityDataPoint[];
  title?: string;
}

/**
 * Derives a plain-language insight from activity data.
 * Handles both hourly (day) and daily (week) data.
 */
export function deriveActivityInsight(data: ActivityDataPoint[]): string | null {
  if (!data?.length) return null;
  const isHourly = data.some((d) => d.time.includes(":"));
  const onPeriods: { start: number; end: number }[] = [];
  let inOn = false;
  let startIdx = 0;
  data.forEach((d, i) => {
    if (d.isOn && !inOn) {
      inOn = true;
      startIdx = i;
    } else if (!d.isOn && inOn) {
      inOn = false;
      onPeriods.push({ start: startIdx, end: i - 1 });
    }
  });
  if (inOn) onPeriods.push({ start: startIdx, end: data.length - 1 });

  if (onPeriods.length === 0) return "No active periods recorded.";
  const longest = onPeriods.reduce(
    (best, p) => (p.end - p.start > best.end - best.start ? p : best),
    onPeriods[0]
  );
  const startLabel = data[longest.start]?.time ?? "";
  const endLabel = data[longest.end]?.time ?? "";
  const span = longest.end - longest.start + 1;

  if (isHourly && span >= 2 && startLabel && endLabel) {
    return `Longest runtime occurred between ${startLabel} and ${endLabel} (${span} hours).`;
  }
  if (isHourly && onPeriods.length === 1) {
    return "The aircon was active for 1 continuous period today.";
  }
  if (isHourly) {
    return `The aircon was active for ${onPeriods.length} separate periods today.`;
  }
  const activeDays = data.filter((d) => d.isOn).length;
  if (activeDays === 0) return "No active days this week.";
  if (activeDays === 1) return "Most usage happened on 1 day this week.";
  return `Most usage happened across ${activeDays} days this week.`;
}

export function ActivityTimelineChart({
  data,
  title = "Aircon Activity Timeline",
}: ActivityTimelineChartProps): ReactElement {
  const insight = deriveActivityInsight(data);

  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-[#10363b]">
        {title}
      </h3>
      <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-0.5">
          {data.map((point, i) => (
            <div
              key={`${point.time}-${i}`}
              className="flex w-8 shrink-0 flex-col items-center gap-1"
              title={`${point.time}: ${point.isOn ? "On" : "Off"}`}
            >
              <div
                className={`h-8 w-6 rounded-sm ${
                  point.isOn ? "bg-[#86CCD2]" : "bg-[rgba(157,207,212,0.15)]"
                }`}
              />
              <span className="text-[9px] font-medium text-[#666666]">
                {point.time.replace(":00", "")}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-[#6f8c91]">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#86CCD2]" />
          On
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[rgba(157,207,212,0.20)]" />
          Off
        </span>
      </div>
      {insight && (
        <p className="mt-3 text-sm text-[#4d6b70]">
          {insight}
        </p>
      )}
    </div>
  );
}
