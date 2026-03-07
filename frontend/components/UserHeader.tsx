"use client";

import Link from "next/link";
import { NotificationBell } from "@/components/NotificationBell";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { useHousehold } from "@/context/HouseholdContext";

export function UserHeader() {
  const { householdId } = useHousehold();

  return (
    <header className="sticky top-0 z-10 border-b border-[#86CCD2]/20 bg-[#F3F9F9]/95 backdrop-blur dark:border-[#86CCD2]/10 dark:bg-zinc-950/95">
      <nav className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/user"
            className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Saivers
          </Link>
          <HouseholdSwitcher />
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell householdId={householdId} />
          <Link
            href="/user/settings"
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Settings"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Home
          </Link>
        </div>
      </nav>
    </header>
  );
}
