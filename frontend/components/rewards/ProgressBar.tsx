"use client";

import type { ReactElement } from "react";

interface ProgressBarProps {
  current: number;
  target: number;
  label?: string;
}

export function ProgressBar({
  current,
  target,
  label,
}: ProgressBarProps): ReactElement {
  const percent = Math.min(100, (current / target) * 100);

  return (
    <div>
      {label && (
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {label}
          </span>
          <span className="text-[#666666] dark:text-zinc-400">
            {current} / {target} pts
          </span>
        </div>
      )}
      <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-[#86CCD2] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
