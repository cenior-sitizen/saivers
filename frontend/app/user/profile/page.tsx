"use client";

import Link from "next/link";
import { PersonaGreeting } from "@/components/PersonaGreeting";

export default function ProfilePage() {
  return (
    <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#10363b]">Profile</h1>
        <p className="mt-1 text-sm text-[#666666]">Your household and energy overview</p>
      </div>

      <PersonaGreeting />

      <div className="mt-4 flex flex-col gap-3">
        <Link
          href="/user/rewards"
          className="flex items-center justify-between rounded-2xl border border-[#86CCD2]/40 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-[#86CCD2]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#86CCD2]/20">
              <svg className="h-5 w-5 text-[#007B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#10363b]">Rewards & Streaks</p>
              <p className="text-xs text-[#6f8c91]">Points, CDC vouchers, milestones</p>
            </div>
          </div>
          <svg className="h-4 w-4 text-[#6f8c91]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/user/aircon-impact"
          className="flex items-center justify-between rounded-2xl border border-[#86CCD2]/40 bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-[#86CCD2]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#86CCD2]/20">
              <svg className="h-5 w-5 text-[#007B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#10363b]">Aircon Impact</p>
              <p className="text-xs text-[#6f8c91]">Usage, trends & savings</p>
            </div>
          </div>
          <svg className="h-4 w-4 text-[#6f8c91]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
