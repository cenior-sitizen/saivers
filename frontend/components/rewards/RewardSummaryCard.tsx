"use client";

import type { ReactElement } from "react";

interface RewardSummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}

export function RewardSummaryCard({
  icon,
  label,
  value,
  subtitle,
}: RewardSummaryCardProps): ReactElement {
  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#86CCD2]/20 text-[#86CCD2]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#666666] dark:text-zinc-400">
            {label}
          </p>
          <p className="mt-0.5 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-[#666666] dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
