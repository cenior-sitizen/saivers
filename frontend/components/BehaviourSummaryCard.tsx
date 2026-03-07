import type { ReactElement } from "react";

interface BehaviourSummaryCardProps {
 label: string;
 value: string;
}

export function BehaviourSummaryCard({ label, value }: BehaviourSummaryCardProps): ReactElement {
 return (
 <div className="rounded-xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
 <p className="text-xs text-[#666666]">{label}</p>
 <p className="mt-1 font-semibold text-[#10363b]">
 {value}
 </p>
 </div>
 );
}
