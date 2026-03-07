"use client";

import type { ReactElement } from "react";

interface PointsMilestoneCardProps {
 points: number;
 reward: string;
 achieved: boolean;
}

export function PointsMilestoneCard({
 points,
 reward,
 achieved,
}: PointsMilestoneCardProps): ReactElement {
 return (
 <div
 className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
 achieved
 ? "border-[#86CCD2]/40 bg-[#86CCD2]/10"
 : "border-[#86CCD2]/20 bg-white"
 }`}
 >
 <div className="flex items-center gap-3">
 <span
 className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
 achieved
 ? "bg-[#86CCD2] text-white"
 : "bg-[rgba(207,228,230,0.40)] text-[#6f8c91]"
 }`}
 >
 {achieved ? "✓" : points}
 </span>
 <div>
 <p className="font-semibold text-[#10363b]">
 {reward}
 </p>
 <p className="text-xs text-[#666666]">
 {points} points
 </p>
 </div>
 </div>
 {achieved && (
 <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
 Unlocked
 </span>
 )}
 </div>
 );
}
