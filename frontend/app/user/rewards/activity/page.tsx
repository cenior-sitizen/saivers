"use client";

import Link from "next/link";
import { ActivityItem } from "@/components/rewards/ActivityItem";
import { activityHistory } from "../mockData";

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-[#F3F9F9] px-4 pb-24 dark:bg-zinc-950 sm:mx-auto sm:max-w-md sm:px-0">
      <Link
        href="/user/rewards"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Back
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        📜 Activity
      </h1>
      <p className="mb-6 text-sm text-[#666666] dark:text-zinc-400">
        Recent wins
      </p>
      <div className="rounded-2xl border border-[#86CCD2]/30 bg-white px-4 dark:border-[#86CCD2]/20 dark:bg-zinc-900">
        {activityHistory.map((item) => (
          <ActivityItem
            key={item.id}
            type={item.type}
            title={item.title}
            description={item.description}
            date={item.date}
          />
        ))}
      </div>
    </div>
  );
}
