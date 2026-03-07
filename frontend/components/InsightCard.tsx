interface InsightCardProps {
  savedThisWeek: string;
  projectedMonthly: string;
}

export function InsightCard({
  savedThisWeek,
  projectedMonthly,
}: InsightCardProps) {
  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-[#86CCD2]/15 p-5 dark:border-[#86CCD2]/20 dark:bg-[#86CCD2]/10">
      <h3 className="text-sm font-semibold text-[#007B8A] dark:text-[#86CCD2]">
        Savings insight
      </h3>
      <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
        {savedThisWeek}
      </p>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        {projectedMonthly}
      </p>
    </div>
  );
}
