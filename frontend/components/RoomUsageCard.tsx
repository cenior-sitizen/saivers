interface RoomUsageCardProps {
 name: string;
 status: "Running" | "Idle" | "Recently Active";
 usageKwh: number;
 percentOfTotal: number;
 runtimeHours: number;
 avgTempC: number;
 trendNote: string;
}

const statusColors = {
 Running: "bg-emerald-500",
 Idle: "bg-[rgba(157,207,212,0.40)]",
 "Recently Active": "bg-amber-500",
};

export function RoomUsageCard({
 name,
 status,
 usageKwh,
 percentOfTotal,
 runtimeHours,
 avgTempC,
 trendNote,
}: RoomUsageCardProps) {
 return (
 <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-4 shadow-sm">
 <div className="flex items-start justify-between">
 <div>
 <h4 className="font-semibold text-[#10363b]">
 {name}
 </h4>
 <div className="mt-1 flex items-center gap-2">
 <span
 className={`inline-block h-2 w-2 rounded-full ${statusColors[status]}`}
 />
 <span className="text-sm text-[#666666]">
 {status}
 </span>
 </div>
 </div>
 <div className="text-right">
 <p className="text-lg font-semibold text-[#10363b]">
 {usageKwh} kWh
 </p>
 <p className="text-xs text-[#666666]">
 {percentOfTotal}% of total
 </p>
 </div>
 </div>

 <div className="mt-3 h-2 overflow-hidden rounded-full">
 <div
 className="h-full rounded-full bg-[#86CCD2] transition-all"
 style={{ width: `${Math.min(percentOfTotal, 100)}%` }}
 />
 </div>

 <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#666666]">
 <span>{runtimeHours}h runtime this week</span>
 <span>~{avgTempC}°C avg</span>
 </div>
 <p className="mt-2 text-xs text-emerald-600">
 {trendNote}
 </p>
 </div>
 );
}
