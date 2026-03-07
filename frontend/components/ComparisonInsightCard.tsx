import type { ReactElement } from "react";

interface ComparisonInsightCardProps {
  label: string;
  value: string;
  isPositive: boolean;
}

export function ComparisonInsightCard({
  label,
  value,
  isPositive,
}: ComparisonInsightCardProps): ReactElement {
  return (
    <div className="rounded-xl border border-[#86CCD2]/30 bg-white px-4 py-3 shadow-sm dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      <p className="text-sm text-[#666666] dark:text-zinc-400">{label}</p>
      <p
        className={`mt-1 font-semibold ${
          isPositive
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-amber-600 dark:text-amber-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
