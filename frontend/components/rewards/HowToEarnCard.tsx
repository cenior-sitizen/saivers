"use client";

import type { ReactElement } from "react";

interface HowToEarnCardProps {
 title: string;
 points: string;
 achieved: boolean;
}

export function HowToEarnCard({
 title,
 points,
 achieved,
}: HowToEarnCardProps): ReactElement {
 return (
 <div
 className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
 achieved
 ? "border-[#86CCD2]/30 bg-white"
 : "border-[rgba(157,207,212,0.30)] bg-[#f3f9f9]/50"
 }`}
 >
 <p className="text-sm font-medium text-[#10363b]">
 {title}
 </p>
 <span
 className={`text-sm font-semibold ${
 achieved ? "text-[#86CCD2]" : "text-[#6f8c91]"
 }`}
 >
 {points}
 </span>
 </div>
 );
}
