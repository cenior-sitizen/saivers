interface ComparisonCardProps {
  thisWeek: number;
  lastWeek: number;
  percentChange: number;
  thisWeekCost: string;
  lastWeekCost: string;
}

export function ComparisonCard({
  thisWeek,
  lastWeek,
  percentChange,
  thisWeekCost,
  lastWeekCost,
}: ComparisonCardProps) {
  const isDown = percentChange < 0;

  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        This Week vs Last Week
      </h3>
      <div className="mt-4 flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs text-[#666666] dark:text-zinc-400">
            This week
          </p>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {thisWeek} kWh
          </p>
          <p className="text-sm text-[#666666] dark:text-zinc-400">
            {thisWeekCost}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#666666] dark:text-zinc-400">
            Last week
          </p>
          <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
            {lastWeek} kWh
          </p>
          <p className="text-sm text-[#666666] dark:text-zinc-400">
            {lastWeekCost}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`text-lg font-semibold ${
              isDown ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {isDown ? "↓" : "↑"} {Math.abs(percentChange).toFixed(1)}%
          </span>
          <span className="text-sm text-[#666666] dark:text-zinc-400">
            {isDown ? "Down" : "Up"}
          </span>
        </div>
      </div>
    </div>
  );
}
