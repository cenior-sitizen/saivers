"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/monitoring", label: "Monitoring" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/observability", label: "Observability" },
  { href: "/admin/incidents", label: "Incidents" },
  { href: "/admin/investigation", label: "AI Assistant" },
  { href: "/admin/recommendations", label: "Recommendations" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div
      className="min-h-screen bg-[#f3f9f9]"
      style={{ colorScheme: "light" }}
    >
      {/* ── Top accent stripe ── */}
      <div className="h-0.5 w-full bg-gradient-to-r from-[#007B8A] via-[#00a3ad] to-[#33b4bd]" />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-20 border-b border-[rgba(157,207,212,0.35)] bg-white/96 shadow-[0_2px_16px_rgba(0,123,138,0.07)] backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-0 sm:px-6 lg:px-8">

          {/* Brand */}
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-2.5 py-3.5"
          >
            {/* Teal monogram */}
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#00a3ad] to-[#007B8A] shadow-[0_2px_8px_rgba(0,123,138,0.30)]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-white"
              >
                <path
                  d="M7 1L2 4v6l5 3 5-3V4L7 1z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.5 7.5l1.5 1.5 3-3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="flex flex-col leading-none">
              <span
                className="text-sm font-bold tracking-tight text-[#10363b]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Saivers
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#007B8A]">
                Admin
              </span>
            </div>
          </Link>

          {/* Divider */}
          <div className="h-6 w-px bg-[rgba(157,207,212,0.45)] shrink-0" />

          {/* Nav links — scrollable on small screens */}
          <div className="flex flex-1 items-center gap-0.5 overflow-x-auto scrollbar-none">
            {NAV_LINKS.map(({ href, label, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? "bg-[rgba(0,163,173,0.10)] text-[#007B8A]"
                      : "text-[#4d6b70] hover:bg-[rgba(157,207,212,0.12)] hover:text-[#10363b]"
                  }`}
                >
                  {label}
                  {/* Active underline indicator */}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#00a3ad]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side — grid status + back home */}
          <div className="flex shrink-0 items-center gap-3 py-3.5">
            {/* Live grid indicator */}
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium text-[#6f8c91]">
                Grid Live
              </span>
            </div>

            <div className="h-4 w-px bg-[rgba(157,207,212,0.40)] hidden sm:block" />

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-[rgba(157,207,212,0.45)] bg-white px-3 py-1.5 text-[12px] font-medium text-[#4d6b70] shadow-sm transition-all hover:border-[#86CCD2] hover:text-[#10363b] hover:shadow-[0_2px_8px_rgba(0,123,138,0.10)]"
            >
              <svg
                className="h-3.5 w-3.5"
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
              Home
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
