"use client";

import type { ReactElement } from "react";

interface ActivityItemProps {
 type: "points" | "streak" | "badge" | "voucher";
 title: string;
 description: string;
 date: string;
}

const typeConfig = {
 points: { color: "bg-[#86CCD2]/20 text-[#86CCD2]", icon: "★" },
 streak: { color: "bg-amber-100 text-amber-600", icon: "🔥" },
 badge: { color: "bg-violet-100 text-violet-600", icon: "🏆" },
 voucher: { color: "bg-emerald-100 text-emerald-600", icon: "🎫" },
};

export function ActivityItem({
 type,
 title,
 description,
 date,
}: ActivityItemProps): ReactElement {
 const config = typeConfig[type];

 return (
 <div className="flex gap-3 border-b border-[rgba(157,207,212,0.20)] py-3 last:border-0">
 <div
 className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${config.color}`}
 >
 {config.icon}
 </div>
 <div className="min-w-0 flex-1">
 <p className="font-medium text-[#10363b]">{title}</p>
 <p className="text-xs text-[#666666]">
 {description} • {date}
 </p>
 </div>
 </div>
 );
}
