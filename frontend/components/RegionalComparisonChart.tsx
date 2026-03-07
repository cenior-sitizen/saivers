"use client";

import type { ReactElement } from "react";

interface RegionalComparisonChartProps {
  yourKwh: number;
  districtAvgKwh: number;
  singaporeAvgKwh: number;
}

export function RegionalComparisonChart({
  yourKwh,
  districtAvgKwh,
  singaporeAvgKwh,
}: RegionalComparisonChartProps): ReactElement {
  const maxKwh = Math.max(yourKwh, districtAvgKwh, singaporeAvgKwh, 1);
  const yourWidth = (yourKwh / maxKwh) * 100;
  const districtWidth = (districtAvgKwh / maxKwh) * 100;
  const singaporeWidth = (singaporeAvgKwh / maxKwh) * 100;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Electricity used today
      </p>
      <div className="space-y-2">
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">You</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {yourKwh} kWh
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#F3F9F9] dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-[#86CCD2] transition-all"
              style={{ width: `${yourWidth}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">District avg</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {districtAvgKwh} kWh
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#F3F9F9] dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-400 dark:bg-zinc-500"
              style={{ width: `${districtWidth}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Singapore avg</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {singaporeAvgKwh} kWh
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#F3F9F9] dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-300 dark:bg-zinc-600"
              style={{ width: `${singaporeWidth}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
