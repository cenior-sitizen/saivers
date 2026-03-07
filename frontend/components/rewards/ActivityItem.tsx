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
  streak: { color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400", icon: "🔥" },
  badge: { color: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400", icon: "🏆" },
  voucher: { color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400", icon: "🎫" },
};

export function ActivityItem({
  type,
  title,
  description,
  date,
}: ActivityItemProps): ReactElement {
  const config = typeConfig[type];

  return (
    <div className="flex gap-3 border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-800">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${config.color}`}
      >
        {config.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
        <p className="text-xs text-[#666666] dark:text-zinc-400">
          {description} • {date}
        </p>
      </div>
    </div>
  );
}
