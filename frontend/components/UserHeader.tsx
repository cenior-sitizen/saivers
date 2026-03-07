"use client";

import Link from "next/link";
import { NotificationBell } from "@/components/NotificationBell";
import { HouseholdSwitcher } from "@/components/HouseholdSwitcher";
import { useHousehold } from "@/context/HouseholdContext";

export function UserHeader() {
 const { householdId } = useHousehold();

 return (
 <header className="sticky top-0 z-10 border-b border-[rgba(157,207,212,0.30)] bg-[rgba(251,254,254,0.82)] backdrop-blur-xl">
 {/* Thin brand accent line at top */}
 <div className="h-[2px] w-full bg-gradient-to-r from-[#86CCD2] via-[#00A3AD] to-[#007B8A]" />
 <nav className="flex items-center justify-between px-4 py-3 sm:px-6">
 <div className="flex items-center gap-3">
 <Link href="/user" className="flex items-center gap-2">
 {/* SP Group–style energy bolt wordmark */}
 <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#86CCD2] to-[#007B8A] shadow-[0_4px_12px_rgba(0,123,138,0.30)]">
 <svg
 className="h-4 w-4 text-white"
 fill="currentColor"
 viewBox="0 0 24 24"
 >
 <path d="M13 10V3L4 14h7v7l9-11h-7z" />
 </svg>
 </div>
 <span className="font-display text-base font-bold tracking-tight text-[#10363b]">
 Saivers
 </span>
 </Link>
 <HouseholdSwitcher />
 </div>
 <div className="flex items-center gap-1.5">
 <NotificationBell householdId={householdId} />
 <Link
 href="/"
 className="rounded-full px-3 py-1.5 text-xs font-medium text-[#4d6b70] transition-colors hover:bg-[#86CCD2]/10 hover:text-[#007B8A]"
 >
 Exit
 </Link>
 </div>
 </nav>
 </header>
 );
}
