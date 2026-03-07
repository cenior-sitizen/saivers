"use client";

import type { ReactElement } from "react";

interface StreakCardProps {
 currentStreak: number;
 longestStreak: number;
 daysToLongest?: number;
}

export function StreakCard({
 currentStreak,
 longestStreak,
 daysToLongest,
}: StreakCardProps): ReactElement {
 return (
 <div className="rounded-2xl border border-[#86CCD2]/30 bg-gradient-to-br from-amber-50/80 to-white p-5 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
 <svg
 className="h-8 w-8 text-amber-600"
 fill="currentColor"
 viewBox="0 0 24 24"
 >
 <path d="M12 23c-1.1 0-2-.9-2-2v-1H7c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2h3v-2H7c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h3V5c0-1.1.9-2 2-2s2 .9 2 2v1h3c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-3v2h3c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-3v1c0 1.1-.9 2-2 2z" />
 </svg>
 </div>
 <div>
 <p className="text-3xl font-bold text-[#10363b]">
 {currentStreak}
 <span className="ml-1 text-lg font-medium text-[#666666]">
 days
 </span>
 </p>
 <p className="text-sm text-[#666666]">
 Current streak
 </p>
 {daysToLongest != null && daysToLongest > 0 && (
 <p className="mt-1 text-xs font-medium text-amber-700">
 {daysToLongest} days away from your longest streak
 </p>
 )}
 </div>
 </div>
 <p className="mt-3 text-xs text-[#666666]">
 Longest streak: {longestStreak} days
 </p>
 </div>
 );
}
