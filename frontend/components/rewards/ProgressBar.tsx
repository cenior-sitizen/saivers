"use client";

import type { ReactElement } from "react";

interface ProgressBarProps {
 current: number;
 target: number;
 label?: string;
}

export function ProgressBar({
 current,
 target,
 label,
}: ProgressBarProps): ReactElement {
 const percent = Math.min(100, (current / target) * 100);

 return (
 <div>
 {label && (
 <div className="mb-2 flex justify-between text-sm">
 <span className="font-medium text-[#10363b]">
 {label}
 </span>
 <span className="text-[#666666]">
 {current} / {target} pts
 </span>
 </div>
 )}
 <div className="h-3 overflow-hidden rounded-full bg-[rgba(207,228,230,0.40)]">
 <div
 className="h-full rounded-full bg-[#86CCD2] transition-all duration-500"
 style={{ width: `${percent}%` }}
 />
 </div>
 </div>
 );
}
