interface ChartDataPoint {
  label: string;
  value: number;
}

interface UsageChartProps {
  data: ChartDataPoint[];
  title: string;
  /** Unit for Y-axis, e.g. "hours per day" */
  unit?: string;
}

export function UsageChart({ data, title, unit = "hours" }: UsageChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <div className="mt-4 flex items-end gap-2">
        {data.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full flex-col items-center justify-end">
              <span className="mb-1 text-[10px] font-medium text-[#666666] dark:text-zinc-400">
                {point.value.toFixed(1)}h
              </span>
              <div
                className="w-full min-w-0 max-w-12 rounded-t-lg bg-[#86CCD2]/70 transition-all dark:bg-[#86CCD2]/50"
                style={{
                  height: `${Math.max((point.value / maxValue) * 80, 8)}px`,
                }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-[#666666] dark:text-zinc-400">
              {point.label}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#666666] dark:text-zinc-400">
        {unit}
      </p>
    </div>
  );
}
