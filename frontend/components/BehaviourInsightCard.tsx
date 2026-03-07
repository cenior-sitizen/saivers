import type { ReactElement } from "react";

interface BehaviourInsightCardProps {
 text: string;
}

export function BehaviourInsightCard({ text }: BehaviourInsightCardProps): ReactElement {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#86CCD2]/30 bg-gradient-to-br from-[#F3F9F9] to-white px-4 py-3.5 dark:border-[#86CCD2]/20 dark:from-[#86CCD2]/10 dark:to-zinc-900">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#86CCD2]/20">
          <svg className="h-4 w-4 text-[#86CCD2]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#86CCD2] dark:text-[#86CCD2]">
            AI insight
          </p>
          <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
