import Link from "next/link";
import { HouseholdProvider } from "@/context/HouseholdContext";
import { UserHeader } from "@/components/UserHeader";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HouseholdProvider>
      <div className="min-h-screen bg-[#F3F9F9] dark:bg-zinc-950">
        <UserHeader />
        <main className="pb-20">{children}</main>

        {/* Mobile bottom nav bar */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#86CCD2]/30 bg-[#86CCD2] safe-area-inset-bottom"
          aria-label="Main navigation"
        >
          <div className="mx-auto flex max-w-md items-center justify-around px-4 py-3 sm:px-6">
          <Link
            href="/user"
            className="flex flex-col items-center gap-1 text-white/90 transition-colors hover:text-white"
          >
            <svg
              className="h-6 w-6"
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
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link
            href="/user/rewards"
            className="flex flex-col items-center gap-1 text-white/90 transition-colors hover:text-white"
          >
            <svg
              className="h-6 w-6"
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
            <span className="text-xs font-medium">Rewards</span>
          </Link>
          <Link
            href="/user/profile"
            className="flex flex-col items-center gap-1 text-white/90 transition-colors hover:text-white"
          >
            <svg
              className="h-6 w-6"
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
            <span className="text-xs font-medium">Profile</span>
          </Link>
          </div>
        </nav>
      </div>
    </HouseholdProvider>
  );
}
