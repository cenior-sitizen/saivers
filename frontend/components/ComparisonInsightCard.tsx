import type { ReactElement } from "react";

interface ComparisonInsightCardProps {
  label: string;
  value: string;
  isPositive: boolean;
  period?: "week" | "month";
}

export function ComparisonInsightCard({
  label,
  value,
  isPositive,
  period = "week",
}: ComparisonInsightCardProps): ReactElement {
  const Icon = isPositive ? (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ) : (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
    </svg>
  );

  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border px-5 py-4 shadow-sm ${
        isPositive
          ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-800/40 dark:bg-emerald-950/20"
          : "border-amber-200 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-950/20"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isPositive
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
            : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
        }`}
      >
        {Icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          vs last {period === "week" ? "week" : "month"}
        </p>
        <p className="mt-1 text-base font-bold text-zinc-900 dark:text-zinc-50">
          {value}
        </p>
        <p className="mt-0.5 text-sm text-[#666666] dark:text-zinc-400 leading-snug">
          {label}
        </p>
      </div>
    </div>
  );
}
