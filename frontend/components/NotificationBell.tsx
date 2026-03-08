"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface WeeklyInsight {
  insight_id: string;
  household_id: number;
  week_start: string;
  notification_title: string;
  notification_body: string;
  status: "unread" | "read" | "approved" | "dismissed";
}

const STATUS_LABELS: Record<string, string> = {
  unread: "New",
  read: "Read",
  approved: "Approved ✓",
  dismissed: "Dismissed",
};

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-sky-100 text-sky-700",
  read: "bg-[#eef6f6] text-[#6f8c91]",
  approved: "bg-emerald-100 text-emerald-700",
  dismissed: "bg-[#eef6f6] text-[#6f8c91]",
};

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart);
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

export function NotificationBell({ householdId }: { householdId: number }) {
  const [open, setOpen]         = useState(false);
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [loading, setLoading]   = useState(false);
  const dropdownRef             = useRef<HTMLDivElement>(null);

  const unreadCount = insights.filter((i) => i.status === "unread").length;

  // Fetch
  useEffect(() => {
    setLoading(true);
    setInsights([]);
    fetch(`/api/insights/weekly/${householdId}`)
      .then((r) => r.json())
      .then((d) => setInsights(Array.isArray(d) ? d : []))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, [householdId]);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Mark all unread → read when dropdown opens
  async function markAllRead() {
    const unread = insights.filter((i) => i.status === "unread");
    if (!unread.length) return;
    await Promise.all(
      unread.map((i) =>
        fetch(`/api/insights/weekly/${i.insight_id}/read`, { method: "POST" }).catch(() => {}),
      ),
    );
    setInsights((prev) =>
      prev.map((i) => (i.status === "unread" ? { ...i, status: "read" } : i)),
    );
  }

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) markAllRead();
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell button */}
        <button
          onClick={handleOpen}
          className="relative rounded-full p-2 text-[#4d6b70] transition-all hover:bg-[#86CCD2]/10 hover:text-[#007B8A]"
          aria-label="Notifications"
        >
          <svg
            className={`h-5 w-5 ${unreadCount > 0 ? "bell-wiggle" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#d94f5c] to-[#b83a45] text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(217,79,92,0.50)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-11 z-50 max-h-[75vh] w-[min(340px,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-[rgba(157,207,212,0.40)] bg-[rgba(251,254,254,0.96)] shadow-[0_24px_60px_rgba(0,74,82,0.16)] backdrop-blur-xl sm:w-[380px]">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-[rgba(157,207,212,0.25)] bg-[rgba(251,254,254,0.95)] px-4 py-3 backdrop-blur-xl">
              <div>
                <span className="text-sm font-bold text-[#10363b]">AI Insights</span>
                {unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-[rgba(217,79,92,0.10)] px-2 py-0.5 text-[10px] font-semibold text-[#d94f5c]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <span className="text-xs text-[#6f8c91]">{insights.length} total</span>
            </div>

            {loading && (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-[#eef6f6]" />
                ))}
              </div>
            )}

            {!loading && insights.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-[#6f8c91]">No insights yet.</p>
              </div>
            )}

            <div className="divide-y divide-[rgba(157,207,212,0.20)]">
              {insights.map((insight) => (
                <Link
                  key={insight.insight_id}
                  href={`/user/insights/${insight.insight_id}`}
                  onClick={() => setOpen(false)}
                  className={`block p-4 transition-colors hover:bg-[rgba(134,204,210,0.06)] ${
                    insight.status === "unread" ? "bg-[rgba(134,204,210,0.08)]" : ""
                  }`}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <p className="flex-1 text-sm font-semibold leading-snug text-[#10363b]">
                      {insight.notification_title}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[insight.status]}`}>
                      {STATUS_LABELS[insight.status]}
                    </span>
                  </div>
                  <p className="mb-1 text-[11px] text-[#6f8c91]">
                    Week of {formatWeek(insight.week_start)}
                  </p>
                  <p className="text-xs leading-relaxed text-[#4d6b70] line-clamp-2">
                    {insight.notification_body}
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-[#007B8A]">Tap to view →</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bell wiggle keyframes */}
      <style>{`
        @keyframes bellWigglePeriodic {
          0%        { transform: rotate(0deg); }
          2%        { transform: rotate(-18deg); }
          4%        { transform: rotate(18deg); }
          6%        { transform: rotate(-12deg); }
          8%        { transform: rotate(12deg); }
          10%, 100% { transform: rotate(0deg); }
        }
        .bell-wiggle {
          animation: bellWigglePeriodic 5s ease-in-out infinite;
          transform-origin: top center;
        }
      `}</style>
    </>
  );
}
