interface InsightCardProps {
 savedThisWeek: string;
 projectedMonthly: string;
}

export function InsightCard({
 savedThisWeek,
 projectedMonthly,
}: InsightCardProps) {
 return (
 <div className="rounded-2xl border border-[#86CCD2]/30 p-5">
 <h3 className="text-sm font-semibold text-[#10363b]">
 Savings insight
 </h3>
 <p className="mt-3 text-sm text-[#666666]">
 {savedThisWeek}
 </p>
 <p className="mt-2 text-sm text-[#666666]">
 {projectedMonthly}
 </p>
 </div>
 );
}
