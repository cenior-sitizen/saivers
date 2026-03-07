import type { ReactElement } from "react";

interface StatusSummaryCardProps {
 status: "On" | "Off";
 temperature?: number;
 runtimeTodayHours: number;
 energyTodayKwh: number;
}

export function StatusSummaryCard({
 status,
 temperature,
 runtimeTodayHours,
 energyTodayKwh,
}: StatusSummaryCardProps): ReactElement {
 return (
 <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-[#10363b]">
 Appliance Status
 </h3>
 <span
 className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
 status === "On"
 ? "bg-emerald-100 text-emerald-700"
 : "bg-[#eef6f6] text-[#4d6b70]"
 }`}
 >
 <span
 className={`inline-block h-2 w-2 rounded-full ${
 status === "On" ? "bg-emerald-500" : "bg-[#6f8c91]"
 }`}
 />
 {status}
 </span>
 </div>
 <div className="mt-4 grid grid-cols-2 gap-4">
 {temperature != null && (
 <div>
 <p className="text-xs text-[#666666]">
 Temperature
 </p>
 <p className="text-lg font-semibold text-[#10363b]">
 {temperature}°C
 </p>
 </div>
 )}
 <div>
 <p className="text-xs text-[#666666]">
 Runtime today
 </p>
 <p className="text-lg font-semibold text-[#10363b]">
 {runtimeTodayHours}h
 </p>
 </div>
 <div>
 <p className="text-xs text-[#666666]">
 Energy used today
 </p>
 <p className="text-lg font-semibold text-[#10363b]">
 {energyTodayKwh} kWh
 </p>
 </div>
 </div>
 </div>
 );
}
