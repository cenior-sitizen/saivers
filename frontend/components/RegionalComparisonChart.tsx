"use client";

import type { ReactElement } from "react";

interface RegionalComparisonChartProps {
 yourKwh: number;
 districtAvgKwh: number;
 singaporeAvgKwh: number;
}

export function RegionalComparisonChart({
 yourKwh,
 districtAvgKwh,
 singaporeAvgKwh,
}: RegionalComparisonChartProps): ReactElement {
 const maxKwh = Math.max(yourKwh, districtAvgKwh, singaporeAvgKwh, 1);
 const yourWidth = (yourKwh / maxKwh) * 100;
 const districtWidth = (districtAvgKwh / maxKwh) * 100;
 const singaporeWidth = (singaporeAvgKwh / maxKwh) * 100;

 return (
 <div className="space-y-3">
 <p className="text-xs font-medium text-[#4d6b70]">
 Electricity used today
 </p>
 <div className="space-y-2">
 <div>
 <div className="mb-1 flex justify-between text-xs">
 <span className="text-[#4d6b70]">You</span>
 <span className="font-semibold text-[#10363b]">
 {yourKwh} kWh
 </span>
 </div>
 <div className="h-2 overflow-hidden rounded-full">
 <div
 className="h-full rounded-full bg-[#86CCD2] transition-all"
 style={{ width: `${yourWidth}%` }}
 />
 </div>
 </div>
 <div>
 <div className="mb-1 flex justify-between text-xs">
 <span className="text-[#4d6b70]">District avg</span>
 <span className="font-medium text-[#4d6b70]">
 {districtAvgKwh} kWh
 </span>
 </div>
 <div className="h-2 overflow-hidden rounded-full">
 <div
 className="h-full rounded-full bg-[#6f8c91]"
 style={{ width: `${districtWidth}%` }}
 />
 </div>
 </div>
 <div>
 <div className="mb-1 flex justify-between text-xs">
 <span className="text-[#4d6b70]">Singapore avg</span>
 <span className="font-medium text-[#4d6b70]">
 {singaporeAvgKwh} kWh
 </span>
 </div>
 <div className="h-2 overflow-hidden rounded-full">
 <div
 className="h-full rounded-full bg-[rgba(157,207,212,0.40)]"
 style={{ width: `${singaporeWidth}%` }}
 />
 </div>
 </div>
 </div>
 </div>
 );
}
