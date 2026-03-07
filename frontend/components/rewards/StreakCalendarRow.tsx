"use client";

import type { ReactElement } from "react";

interface StreakDay {
  date: string;
  achieved: boolean;
}

interface StreakCalendarRowProps {
  days: StreakDay[];
  label?: string;
}

export function StreakCalendarRow({
  days,
  label = "Last 7 days",
}: StreakCalendarRowProps): ReactElement {
  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-medium text-[#666666] dark:text-zinc-400">
          {label}
        </p>
      )}
      <div className="flex gap-2">
        {days.map((day, i) => (
          <div
            key={i}
            className={`flex flex-1 flex-col items-center rounded-lg py-2 ${
              day.achieved
                ? "bg-[#86CCD2]/30 text-[#86CCD2] dark:bg-[#86CCD2]/20"
                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
            }`}
          >
            <span className="text-lg">{day.achieved ? "✓" : "—"}</span>
            <span className="mt-1 text-xs font-medium">{day.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
