"use client";

import type { ReactElement } from "react";

interface HowToEarnCardProps {
  title: string;
  points: string;
  achieved: boolean;
}

export function HowToEarnCard({
  title,
  points,
  achieved,
}: HowToEarnCardProps): ReactElement {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
        achieved
          ? "border-[#86CCD2]/30 bg-white dark:border-[#86CCD2]/20 dark:bg-zinc-900"
          : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/50"
      }`}
    >
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {title}
      </p>
      <span
        className={`text-sm font-semibold ${
          achieved ? "text-[#86CCD2]" : "text-zinc-400 dark:text-zinc-500"
        }`}
      >
        {points}
      </span>
    </div>
  );
}
