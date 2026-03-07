"use client";

import type { ReactElement } from "react";
import Link from "next/link";

interface RoomCardProps {
  name: string;
  slug: string;
}

function RoomIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

export function RoomCard({ name, slug }: RoomCardProps): ReactElement {
  return (
    <Link
      href={`/user/aircon/${slug}`}
      className="group flex items-center justify-between rounded-2xl border border-[#86CCD2]/30 bg-white px-4 py-4 shadow-sm transition-all duration-200 hover:border-[#86CCD2] hover:shadow-md active:scale-[0.98] dark:border-[#86CCD2]/20 dark:bg-zinc-900 dark:hover:border-[#86CCD2]/50"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#86CCD2]/20 transition-colors group-hover:bg-[#86CCD2]/30">
          <RoomIcon className="h-6 w-6 text-[#86CCD2]" />
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
            {name}
          </p>
          <p className="text-sm text-[#666666] dark:text-zinc-400">
            Tap to view appliances
          </p>
        </div>
      </div>
      <svg
        className="h-5 w-5 text-[#666666] transition-transform group-hover:translate-x-0.5 dark:text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}
