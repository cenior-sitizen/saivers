"use client";

import type { ReactElement } from "react";

interface StreakDay {
 date: string;
 achieved: boolean;
}

interface StreakCalendarRowProps {
 days: StreakDay[];
 label?: string;
}

export function StreakCalendarRow({
 days,
 label = "Last 7 days",
}: StreakCalendarRowProps): ReactElement {
 return (
 <div>
 {label && (
 <p className="mb-2 text-xs font-medium text-[#666666]">
 {label}
 </p>
 )}
 <div className="flex gap-2">
 {days.map((day, i) => (
 <div
 key={i}
 className={`flex flex-1 flex-col items-center rounded-lg py-2 ${
 day.achieved
 ? "bg-[#86CCD2]/30 text-[#86CCD2]"
 : "bg-[#eef6f6] text-[#6f8c91]"
 }`}
 >
 <span className="text-lg">{day.achieved ? "✓" : "—"}</span>
 <span className="mt-1 text-xs font-medium">{day.date}</span>
 </div>
 ))}
 </div>
 </div>
 );
}
