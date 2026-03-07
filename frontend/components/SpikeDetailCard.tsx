import type { ReactElement } from "react";

interface SpikeDetailCardProps {
  dateTime: string;
  room: string;
  appliance: string;
  magnitude: string;
  cause: string;
}

export function SpikeDetailCard({
  dateTime,
  room,
  appliance,
  magnitude,
  cause,
}: SpikeDetailCardProps): ReactElement {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/20">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            {dateTime}
          </p>
          <p className="mt-0.5 text-sm text-[#666666] dark:text-zinc-400">
            {room} • {appliance}
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {cause}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-800/50 dark:text-amber-200">
          {magnitude}
        </span>
      </div>
    </div>
  );
}
