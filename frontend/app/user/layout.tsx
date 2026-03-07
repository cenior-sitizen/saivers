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
    icon: (active: boolean) => (
      <svg
        className="h-6 w-6"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: "/user/rewards",
    label: "Rewards",
    exact: false,
    icon: (active: boolean) => (
      <svg
        className="h-6 w-6"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 2}
          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
        />
      </svg>
    ),
  },
  {
    href: "/user/profile",
    label: "Profile",
    exact: false,
    icon: (active: boolean) => (
      <svg
        className="h-6 w-6"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 2}
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
      <div className="min-h-screen bg-[#eef6f6]">
        <UserHeader />
        {/* pb-28 clears the fixed bottom nav (~65px) + breathing room */}
        <main className="pb-28">{children}</main>

        {/* Bottom nav — fixed, full-width, safe-area aware */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#86CCD2]/30 bg-[#007B8A]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Main navigation"
        >
          <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
            {NAV_ITEMS.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-all ${
                    active ? "text-white" : "text-white/60 hover:text-white/90"
                  }`}
                >
                  {item.icon(active)}
                  <span
                    className={`text-[11px] font-medium ${active ? "font-semibold" : ""}`}
                  >
                    {item.label}
                  </span>
                  {active && (
                    <span className="mt-0.5 h-1 w-1 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </HouseholdProvider>
  );
}
