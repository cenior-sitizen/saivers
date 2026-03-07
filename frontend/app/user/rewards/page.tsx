"use client";

import Link from "next/link";
import {
  userPointsBalance,
  currentStreak,
  longestStreak,
  currentTier,
  nextMilestonePoints,
  pointsToNextMilestone,
  pointsMilestones,
  streakCalendarLast7,
  motivationMessages,
} from "./mockData";

export default function RewardsPage() {
  const percent = Math.min(100, (userPointsBalance / nextMilestonePoints) * 100);
  const nextReward = pointsMilestones.find((m) => !m.achieved)?.reward ?? "Reward";

  return (
    <div className="min-h-screen bg-[#F3F9F9] px-4 pb-24 dark:bg-zinc-950 sm:mx-auto sm:max-w-md sm:px-0">
      {/* Hero - gamified stats */}
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#86CCD2] to-[#86CCD2]/70 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/90">Points</p>
            <p className="text-4xl font-black text-white">{userPointsBalance}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white/90">Streak</p>
            <p className="flex items-center gap-1 text-4xl font-black text-white">
              🔥 {currentStreak}
              <span className="text-lg font-medium">/ {longestStreak}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white">
            {currentTier}
          </span>
        </div>
      </div>

      {/* One-liner motivation */}
      <p className="mb-6 text-center text-sm font-medium text-[#666666] dark:text-zinc-400">
        {motivationMessages[0]}
      </p>

      {/* Next level progress - visual */}
      <div className="mb-8 rounded-2xl border border-[#86CCD2]/30 bg-white p-5 dark:border-[#86CCD2]/20 dark:bg-zinc-900">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            Next: {nextReward}
          </span>
          <span className="text-[#666666] dark:text-zinc-400">
            {pointsToNextMilestone} pts to go
          </span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-[#86CCD2] transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Streak calendar - compact */}
      <div className="mb-8 rounded-2xl border border-[#86CCD2]/30 bg-white p-4 dark:border-[#86CCD2]/20 dark:bg-zinc-900">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            Last 7 days
          </span>
        </div>
        <div className="flex gap-2">
          {streakCalendarLast7.map((d, i) => (
            <div
              key={i}
              className={`flex flex-1 flex-col items-center rounded-lg py-2 ${
                d.achieved ? "bg-amber-100 dark:bg-amber-900/30" : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              <span className="text-lg">{d.achieved ? "✓" : "—"}</span>
              <span className="text-xs font-medium text-[#666666] dark:text-zinc-400">
                {d.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick nav - game hub style */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/user/rewards/vouchers"
          className="flex flex-col items-center rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] dark:border-[#86CCD2]/20 dark:bg-zinc-900"
        >
          <span className="mb-2 text-3xl">🎫</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            Vouchers
          </span>
          <span className="mt-1 text-xs text-[#666666] dark:text-zinc-400">
            Redeem
          </span>
        </Link>
        <Link
          href="/user/rewards/badges"
          className="flex flex-col items-center rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] dark:border-[#86CCD2]/20 dark:bg-zinc-900"
        >
          <span className="mb-2 text-3xl">🏆</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            Badges
          </span>
          <span className="mt-1 text-xs text-[#666666] dark:text-zinc-400">
            Achievements
          </span>
        </Link>
        <Link
          href="/user/rewards/activity"
          className="flex flex-col items-center rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98] dark:border-[#86CCD2]/20 dark:bg-zinc-900"
        >
          <span className="mb-2 text-3xl">📜</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            Activity
          </span>
          <span className="mt-1 text-xs text-[#666666] dark:text-zinc-400">
            History
          </span>
        </Link>
      </div>
    </div>
  );
}
