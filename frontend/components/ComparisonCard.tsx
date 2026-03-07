interface ComparisonCardProps {
 thisWeek: number;
 lastWeek: number;
 percentChange: number;
 thisWeekCost: string;
 lastWeekCost: string;
}

export function ComparisonCard({
 thisWeek,
 lastWeek,
 percentChange,
 thisWeekCost,
 lastWeekCost,
}: ComparisonCardProps) {
 const isDown = percentChange < 0;

 return (
 <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm">
 <h3 className="text-sm font-semibold text-[#10363b]">
 This Week vs Last Week
 </h3>
 <div className="mt-4 flex flex-wrap items-end gap-6">
 <div>
 <p className="text-xs text-[#666666]">
 This week
 </p>
 <p className="text-xl font-semibold text-[#10363b]">
 {thisWeek} kWh
 </p>
 <p className="text-sm text-[#666666]">
 {thisWeekCost}
 </p>
 </div>
 <div>
 <p className="text-xs text-[#666666]">
 Last week
 </p>
 <p className="text-lg font-medium text-[#4d6b70]">
 {lastWeek} kWh
 </p>
 <p className="text-sm text-[#666666]">
 {lastWeekCost}
 </p>
 </div>
 <div className="ml-auto flex items-center gap-2">
 <span
 className={`text-lg font-semibold ${
 isDown ? "text-emerald-600" : "text-amber-600"
 }`}
 >
 {isDown ? "↓" : "↑"} {Math.abs(percentChange).toFixed(1)}%
 </span>
 <span className="text-sm text-[#666666]">
 {isDown ? "Down" : "Up"}
 </span>
 </div>
 </div>
 </div>
 );
}
