"use client";

import { useEffect, useRef, useState } from "react";

interface WeeklyInsight {
  insight_id: string;
  household_id: number;
  week_start: string;
  signal_type: string;
  notification_title: string;
  notification_body: string;
  ai_summary: string;
  recommendation_type: string;
  recommendation: { action: string; start_time?: string; end_time?: string; temp_c?: number };
  status: "unread" | "read" | "approved" | "dismissed";
  this_week_kwh: number;
  change_pct: number;
}

const STATUS_LABELS: Record<string, string> = {
  unread: "New",
  read: "Read",
  approved: "Approved ✓",
  dismissed: "Dismissed",
};

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-sky-100 text-sky-700",
  read: "bg-zinc-100 text-zinc-500",
  approved: "bg-emerald-100 text-emerald-700",
  dismissed: "bg-zinc-100 text-zinc-400",
};

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart);
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

export function NotificationBell({ householdId }: { householdId: number }) {
  const [open, setOpen] = useState(false);
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [approveResult, setApproveResult] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = insights.filter((i) => i.status === "unread").length;

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Fetch insights on mount
  useEffect(() => {
    setLoading(true);
    fetch(`/api/insights/weekly/${householdId}`)
      .then((r) => r.json())
      .then((data) => setInsights(Array.isArray(data) ? data : []))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, [householdId]);

  // Mark all unread as read when dropdown opens
  async function markAllRead(currentInsights: WeeklyInsight[]) {
    const unread = currentInsights.filter((i) => i.status === "unread");
    if (!unread.length) return;
    await Promise.all(
      unread.map((i) =>
        fetch(`/api/insights/weekly/${i.insight_id}/read`, { method: "POST" }).catch(() => {})
      )
    );
    setInsights((prev) =>
      prev.map((i) => (i.status === "unread" ? { ...i, status: "read" } : i))
    );
  }

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) markAllRead(insights);
  }

  async function handleApprove(insight: WeeklyInsight) {
    setActioning(insight.insight_id);
    try {
      const res = await fetch(`/api/insights/weekly/${insight.insight_id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ household_id: householdId }),
      });
      const data = await res.json();
      setInsights((prev) =>
        prev.map((i) => (i.insight_id === insight.insight_id ? { ...i, status: "approved" } : i))
      );
      const msg = data.schedule?.start_time
        ? `AC scheduled: ${data.schedule.start_time}–${data.schedule.end_time} at ${data.schedule.temp_c}°C`
        : "Recommendation applied!";
      setApproveResult((prev) => ({ ...prev, [insight.insight_id]: msg }));
    } catch {
      setApproveResult((prev) => ({ ...prev, [insight.insight_id]: "Failed — try again" }));
    } finally {
      setActioning(null);
    }
  }

  async function handleDismiss(insight: WeeklyInsight) {
    setActioning(insight.insight_id);
    try {
      await fetch(`/api/insights/weekly/${insight.insight_id}/dismiss`, { method: "POST" });
      setInsights((prev) =>
        prev.map((i) => (i.insight_id === insight.insight_id ? { ...i, status: "dismissed" } : i))
      );
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[340px] max-h-[480px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:w-[380px]">
          <div className="sticky top-0 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              AI Insights
            </span>
            <span className="text-xs text-zinc-400">{insights.length} total</span>
          </div>

          {loading && (
            <div className="p-6 text-center text-sm text-zinc-400">Loading insights…</div>
          )}

          {!loading && insights.length === 0 && (
            <div className="p-6 text-center text-sm text-zinc-400">No insights yet.</div>
          )}

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {insights.map((insight) => {
              const isActioning = actioning === insight.insight_id;
              const resultMsg = approveResult[insight.insight_id];
              const canAct = insight.status !== "approved" && insight.status !== "dismissed";
              const hasScheduleAction = insight.recommendation?.action === "ac_schedule";

              return (
                <div
                  key={insight.insight_id}
                  className={`p-4 ${insight.status === "unread" ? "bg-sky-50/60 dark:bg-sky-950/20" : ""}`}
                >
                  {/* Header row */}
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                      {insight.notification_title}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[insight.status]}`}
                    >
                      {STATUS_LABELS[insight.status]}
                    </span>
                  </div>

                  {/* Week label */}
                  <p className="mb-2 text-[11px] text-zinc-400">
                    Week of {formatWeek(insight.week_start)}
                  </p>

                  {/* Body */}
                  <p className="mb-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {insight.notification_body}
                  </p>

                  {/* AI summary (collapsed for old insights) */}
                  {(insight.status === "unread" || insight.status === "read") && (
                    <p className="mb-3 rounded-xl bg-zinc-50 px-3 py-2 text-xs italic leading-relaxed text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      "{insight.ai_summary}"
                    </p>
                  )}

                  {/* Result message after approve */}
                  {resultMsg && (
                    <p className="mb-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      ✓ {resultMsg}
                    </p>
                  )}

                  {/* Approve / Dismiss buttons */}
                  {canAct && hasScheduleAction && (
                    <div className="flex gap-2">
                      <button
                        disabled={isActioning}
                        onClick={() => handleApprove(insight)}
                        className="flex-1 rounded-lg bg-[#86CCD2] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {isActioning ? "Applying…" : "Approve"}
                      </button>
                      <button
                        disabled={isActioning}
                        onClick={() => handleDismiss(insight)}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
