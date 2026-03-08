"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HouseholdProvider } from "@/context/HouseholdContext";
import { UserHeader } from "@/components/UserHeader";
import { PushToast } from "@/components/PushToast";

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
      <div className="relative min-h-screen bg-[#eef6f6]">

        {/* ── Animated background layer ─────────────────────────────────── */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          {/* Blob A — top-right corner glow */}
          <div
            className="absolute -right-32 -top-24 h-[500px] w-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle at center, rgba(134,204,210,0.26) 0%, transparent 65%)",
              animation: "blobDriftA 28s ease-in-out infinite",
              willChange: "transform",
            }}
          />
          {/* Blob B — bottom-left corner glow */}
          <div
            className="absolute -bottom-32 -left-24 h-[460px] w-[460px] rounded-full"
            style={{
              background: "radial-gradient(circle at center, rgba(0,123,138,0.15) 0%, transparent 65%)",
              animation: "blobDriftB 36s ease-in-out infinite",
              willChange: "transform",
            }}
          />
          {/* Blob C — CENTER of viewport, the main "alive" blob in the empty space */}
          <div
            className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "radial-gradient(circle at center, rgba(134,204,210,0.14) 0%, transparent 60%)",
              animation: "blobBreathe 18s ease-in-out infinite",
              willChange: "transform",
            }}
          />
          {/* Blob D — lower-center, drifts slowly upward and back */}
          <div
            className="absolute left-[40%] top-[65%] h-[360px] w-[360px] rounded-full"
            style={{
              background: "radial-gradient(circle at center, rgba(0,163,173,0.11) 0%, transparent 58%)",
              animation: "blobDriftD 42s ease-in-out infinite",
              willChange: "transform",
            }}
          />
          {/* Blob E — upper-center, slow wander */}
          <div
            className="absolute left-[30%] top-[20%] h-[280px] w-[280px] rounded-full"
            style={{
              background: "radial-gradient(circle at center, rgba(134,204,210,0.10) 0%, transparent 55%)",
              animation: "blobDriftC 24s ease-in-out infinite",
              willChange: "transform",
            }}
          />
        </div>

        {/* All content sits above the background */}
        <div className="relative z-10">
        <PushToast />
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
        </div>{/* end z-10 wrapper */}

        {/* Blob keyframes */}
        <style>{`
          @keyframes blobDriftA {
            0%   { transform: translate(0px,   0px)  scale(1);    }
            25%  { transform: translate(-28px, 22px) scale(1.06); }
            50%  { transform: translate(14px,  38px) scale(0.96); }
            75%  { transform: translate(32px, -18px) scale(1.03); }
            100% { transform: translate(0px,   0px)  scale(1);    }
          }
          @keyframes blobDriftB {
            0%   { transform: translate(0px,   0px)  scale(1);    }
            30%  { transform: translate(24px, -30px) scale(1.05); }
            60%  { transform: translate(-18px, 20px) scale(0.97); }
            100% { transform: translate(0px,   0px)  scale(1);    }
          }
          @keyframes blobDriftC {
            0%   { transform: translate(0px,   0px)  scale(1);    }
            33%  { transform: translate(20px, -25px) scale(1.08); }
            66%  { transform: translate(-15px, 18px) scale(0.94); }
            100% { transform: translate(0px,   0px)  scale(1);    }
          }
          @keyframes blobDriftD {
            0%   { transform: translate(0px,  0px)   scale(1);    }
            25%  { transform: translate(-22px, -30px) scale(1.07); }
            50%  { transform: translate(20px,  -15px) scale(0.95); }
            75%  { transform: translate(-10px,  20px) scale(1.04); }
            100% { transform: translate(0px,   0px)  scale(1);    }
          }
          /* Center blob breathes in and out like a slow pulse */
          @keyframes blobBreathe {
            0%   { transform: translate(-50%, -50%) scale(1);    opacity: 1;    }
            40%  { transform: translate(-50%, -50%) scale(1.18); opacity: 0.75; }
            70%  { transform: translate(-50%, -50%) scale(0.88); opacity: 0.90; }
            100% { transform: translate(-50%, -50%) scale(1);    opacity: 1;    }
          }
        `}</style>
      </div>
    </HouseholdProvider>
  );
}
