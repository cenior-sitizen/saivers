import type { ReactElement } from "react";

interface BehaviourInsightCardProps {
 text: string;
}

export function BehaviourInsightCard({ text }: BehaviourInsightCardProps): ReactElement {
 return (
 <div className="rounded-xl border border-[#86CCD2]/30 px-4 py-3">
 <p className="text-sm text-[#666666]">{text}</p>
 </div>
 );
}
