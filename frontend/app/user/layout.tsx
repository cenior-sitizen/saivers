"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HouseholdProvider } from "@/context/HouseholdContext";
import { UserHeader } from "@/components/UserHeader";

const NAV_ITEMS = [
 {
 href: "/user",
 label: "Home",
 exact: true,
 icon: (
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
 d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
 />
 </svg>
 ),
 },
 {
 href: "/user/rewards",
 label: "Rewards",
 exact: false,
 icon: (
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
 d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
 />
 </svg>
 ),
 },
 {
 href: "/user/profile",
 label: "Profile",
 exact: false,
 icon: (
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
 d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
 />
 </svg>
 ),
 },
];

export default function UserLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const pathname = usePathname();

 return (
 <HouseholdProvider>
 <div className="min-h-screen">
 <UserHeader />
 <main className="pb-28">{children}</main>

 {/* Floating pill bottom nav */}
 <nav
 className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-around rounded-[30px] border border-[rgba(157,207,212,0.55)] bg-[rgba(251,254,254,0.88)] px-3 py-2 shadow-[0_24px_60px_rgba(0,123,138,0.18)] backdrop-blur-2xl safe-bottom sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px]"
 aria-label="Main navigation"
 >
 {NAV_ITEMS.map((item) => {
 const isActive = item.exact
 ? pathname === item.href
 : pathname.startsWith(item.href);
 return (
 <Link
 key={item.href}
 href={item.href}
 className={`relative flex flex-col items-center gap-1 rounded-[22px] px-5 py-2 text-[11px] font-semibold transition-all duration-200 ${
 isActive
 ? "bg-gradient-to-b from-[#86CCD2] to-[#007B8A] text-white shadow-[0_6px_18px_rgba(0,123,138,0.30)]"
 : "text-[#4d6b70] hover:text-[#007B8A]"
 }`}
 >
 {item.icon}
 <span>{item.label}</span>
 </Link>
 );
 })}
 </nav>
 </div>
 </HouseholdProvider>
 );
}
