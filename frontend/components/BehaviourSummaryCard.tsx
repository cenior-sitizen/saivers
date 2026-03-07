import type { ReactElement } from "react";

interface BehaviourSummaryCardProps {
  label: string;
  value: string;
}

export function BehaviourSummaryCard({ label, value }: BehaviourSummaryCardProps): ReactElement {
  return (
    <div className="rounded-xl border border-[#86CCD2]/30 bg-white px-4 py-3 shadow-sm dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      <p className="text-xs text-[#666666] dark:text-zinc-400">{label}</p>
      <p className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}
