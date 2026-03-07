interface SummaryCardProps {
  label: string;
  value: string;
}

export function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-4 shadow-sm dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-[#666666] dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
