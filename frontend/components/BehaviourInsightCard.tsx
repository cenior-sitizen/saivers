import type { ReactElement } from "react";

interface BehaviourInsightCardProps {
  text: string;
}

export function BehaviourInsightCard({ text }: BehaviourInsightCardProps): ReactElement {
  return (
    <div className="rounded-xl border border-[#86CCD2]/30 bg-[#F3F9F9] px-4 py-3 dark:border-[#86CCD2]/20 dark:bg-[#86CCD2]/10">
      <p className="text-sm text-[#666666] dark:text-zinc-300">{text}</p>
    </div>
  );
}
