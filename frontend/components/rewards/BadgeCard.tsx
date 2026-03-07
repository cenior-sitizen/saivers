"use client";

import type { ReactElement } from "react";

interface BadgeCardProps {
 title: string;
 description: string;
 unlocked: boolean;
 dateEarned?: string;
 icon: string;
}

const iconMap: Record<string, React.ReactNode> = {
 leaf: (
 <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
 </svg>
 ),
 flame: (
 <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
 </svg>
 ),
 bolt: (
 <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
 </svg>
 ),
 snow: (
 <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
 </svg>
 ),
 trophy: (
 <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm2 4h10M7 9v2a5 5 0 0010 0V9M12 19v2M8 21h8" />
 </svg>
 ),
};

export function BadgeCard({
 title,
 description,
 unlocked,
 dateEarned,
 icon,
}: BadgeCardProps): ReactElement {
 const IconComponent = iconMap[icon] ?? iconMap.leaf;

 return (
 <div
 className={`rounded-2xl border p-4 ${
 unlocked
 ? "border-[#86CCD2]/40 bg-white shadow-sm"
 : "border-[rgba(157,207,212,0.30)] bg-[#f3f9f9]/50 opacity-70"
 }`}
 >
 <div className="flex items-start gap-3">
 <div
 className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
 unlocked
 ? "bg-[#86CCD2]/20 text-[#86CCD2]"
 : "bg-[rgba(207,228,230,0.40)] text-[#6f8c91]"
 }`}
 >
 {IconComponent}
 </div>
 <div className="min-w-0 flex-1">
 <p className="font-semibold text-[#10363b]">
 {title}
 </p>
 <p className="mt-0.5 text-sm text-[#666666]">
 {description}
 </p>
 {unlocked && dateEarned && (
 <p className="mt-1 text-xs text-[#666666]">
 {dateEarned}
 </p>
 )}
 </div>
 </div>
 </div>
 );
}
