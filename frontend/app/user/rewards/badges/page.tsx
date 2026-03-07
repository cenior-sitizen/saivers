"use client";

import Link from "next/link";
import { BadgeCard } from "@/components/rewards/BadgeCard";
import { badges } from "../mockData";

export default function BadgesPage() {
  const unlocked = badges.filter((b) => b.unlocked).length;

  return (
    <div className="min-h-screen bg-[#F3F9F9] px-4 pb-24 dark:bg-zinc-950 sm:mx-auto sm:max-w-md sm:px-0">
      <Link
        href="/user/rewards"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Back
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        🏆 Badges
      </h1>
      <p className="mb-6 text-sm text-[#666666] dark:text-zinc-400">
        {unlocked}/{badges.length} unlocked
      </p>
      <div className="space-y-3">
        {badges.map((b) => (
          <BadgeCard
            key={b.id}
            title={b.title}
            description={b.description}
            unlocked={b.unlocked}
            dateEarned={b.dateEarned}
            icon={b.icon}
          />
        ))}
      </div>
    </div>
  );
}
