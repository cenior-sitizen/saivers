interface InsightCardProps {
  savedThisWeek: string;
  projectedMonthly: string;
}

export function InsightCard({
  savedThisWeek,
  projectedMonthly,
}: InsightCardProps) {
  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-[#F3F9F9] p-5 dark:border-[#86CCD2]/20 dark:bg-[#86CCD2]/10">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Savings insight
      </h3>
      <p className="mt-3 text-sm text-[#666666] dark:text-zinc-400">
        {savedThisWeek}
      </p>
      <p className="mt-2 text-sm text-[#666666] dark:text-zinc-400">
        {projectedMonthly}
      </p>
    </div>
  );
}
