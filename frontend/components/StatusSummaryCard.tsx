import type { ReactElement } from "react";

interface StatusSummaryCardProps {
  status: "On" | "Off";
  temperature: number;
  runtimeTodayHours: number;
  energyTodayKwh: number;
}

export function StatusSummaryCard({
  status,
  temperature,
  runtimeTodayHours,
  energyTodayKwh,
}: StatusSummaryCardProps): ReactElement {
  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Appliance Status
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            status === "On"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              status === "On" ? "bg-emerald-500" : "bg-zinc-400"
            }`}
          />
          {status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[#666666] dark:text-zinc-400">
            Temperature
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {temperature}°C
          </p>
        </div>
        <div>
          <p className="text-xs text-[#666666] dark:text-zinc-400">
            Runtime today
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {runtimeTodayHours}h
          </p>
        </div>
        <div>
          <p className="text-xs text-[#666666] dark:text-zinc-400">
            Energy used today
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {energyTodayKwh} kWh
          </p>
        </div>
      </div>
    </div>
  );
}
