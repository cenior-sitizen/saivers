"use client";

import type { ReactElement } from "react";

interface PointsMilestoneCardProps {
  points: number;
  reward: string;
  achieved: boolean;
}

export function PointsMilestoneCard({
  points,
  reward,
  achieved,
}: PointsMilestoneCardProps): ReactElement {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
        achieved
          ? "border-[#86CCD2]/40 bg-[#86CCD2]/10 dark:bg-[#86CCD2]/5"
          : "border-[#86CCD2]/20 bg-white dark:border-[#86CCD2]/10 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            achieved
              ? "bg-[#86CCD2] text-white"
              : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
          }`}
        >
          {achieved ? "✓" : points}
        </span>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
            {reward}
          </p>
          <p className="text-xs text-[#666666] dark:text-zinc-400">
            {points} points
          </p>
        </div>
      </div>
      {achieved && (
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Unlocked
        </span>
      )}
    </div>
  );
}
