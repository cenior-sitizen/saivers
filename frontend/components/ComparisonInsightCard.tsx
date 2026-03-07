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
 <div className="rounded-xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
 <p className="text-sm text-[#666666]">{label}</p>
 <p
 className={`mt-1 font-semibold ${
 isPositive
 ? "text-emerald-600"
 : "text-amber-600"
 }`}
 >
 {value}
 </p>
 </div>
 );
}
