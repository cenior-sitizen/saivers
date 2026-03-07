"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

interface WeeklyInsight {
  insight_id: string;
  household_id: number;
  week_start: string;
  signal_type: string;
  notification_title: string;
  notification_body: string;
  ai_summary: string;
  recommendation_type: string;
  recommendation: {
    action: string;
    start_time?: string;
    end_time?: string;
    temp_c?: number;
  };
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
  read: "bg-[#eef6f6] text-[#6f8c91]",
  approved: "bg-emerald-100 text-emerald-700",
  dismissed: "bg-[#eef6f6] text-[#6f8c91]",
};

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart);
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

/** Pick the highest-priority insight to push:
 *  1. unread + ac_schedule (requires user decision)
 *  2. unread (informational)
 *  Excludes already approved/dismissed and already-shown IDs.
 */
function pickNextToast(
  insights: WeeklyInsight[],
  shown: Set<string>,
): WeeklyInsight | null {
  const eligible = insights.filter(
    (i) =>
      !shown.has(i.insight_id) &&
      i.status !== "approved" &&
      i.status !== "dismissed",
  );
  // Priority: actionable (has schedule recommendation) first
  const actionable = eligible.find(
    (i) => i.recommendation?.action === "ac_schedule",
  );
  return actionable ?? eligible[0] ?? null;
}

export function NotificationBell({ householdId }: { householdId: number }) {
  const [open, setOpen] = useState(false);
  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [approveResult, setApproveResult] = useState<Record<string, string>>(
    {},
  );

  // Push toast state
  const [toast, setToast] = useState<WeeklyInsight | null>(null);
  const [toastActioning, setToastActioning] = useState(false);
  const shownToastIds = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = insights.filter((i) => i.status === "unread").length;

  // ── Fetch insights ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setInsights([]);
    shownToastIds.current = new Set();
    setToast(null);
    fetch(`/api/insights/weekly/${householdId}`)
      .then((r) => r.json())
      .then((data) => setInsights(Array.isArray(data) ? data : []))
      .catch(() => setInsights([]))
      .finally(() => setLoading(false));
  }, [householdId]);

  // ── Push toast scheduler ──────────────────────────────────────────────────
  const showNextToast = useCallback(
    (currentInsights: WeeklyInsight[]) => {
      if (open) return; // don't interrupt open dropdown
      const next = pickNextToast(currentInsights, shownToastIds.current);
      if (!next) return;
      shownToastIds.current = new Set([
        ...shownToastIds.current,
        next.insight_id,
      ]);
      setToast(next);
      // Auto-dismiss after 15s
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToast(null), 15000);
    },
    [open],
  );

  useEffect(() => {
    if (insights.length === 0) return;

    // First toast after 5s
    const initial = setTimeout(() => showNextToast(insights), 5000);
    // Repeat every 30s
    pushIntervalRef.current = setInterval(() => showNextToast(insights), 30000);

    return () => {
      clearTimeout(initial);
      if (pushIntervalRef.current) clearInterval(pushIntervalRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [insights, showNextToast]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // ── Dismiss toast ─────────────────────────────────────────────────────────
  function dismissToast() {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  }

  // ── Mark unread → read when dropdown opens ────────────────────────────────
  async function markAllRead(currentInsights: WeeklyInsight[]) {
    const unread = currentInsights.filter((i) => i.status === "unread");
    if (!unread.length) return;
    await Promise.all(
      unread.map((i) =>
        fetch(`/api/insights/weekly/${i.insight_id}/read`, {
          method: "POST",
        }).catch(() => {}),
      ),
    );
    setInsights((prev) =>
      prev.map((i) => (i.status === "unread" ? { ...i, status: "read" } : i)),
    );
  }

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      setToast(null); // hide toast when dropdown opens
      markAllRead(insights);
    }
  }

  // ── Approve / Dismiss (dropdown) ──────────────────────────────────────────
  async function handleApprove(insight: WeeklyInsight) {
    setActioning(insight.insight_id);
    try {
      const res = await fetch(
        `/api/insights/weekly/${insight.insight_id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ household_id: householdId }),
        },
      );
      const data = await res.json();
      setInsights((prev) =>
        prev.map((i) =>
          i.insight_id === insight.insight_id
            ? { ...i, status: "approved" }
            : i,
        ),
      );
      const msg = data.schedule?.start_time
        ? `AC scheduled: ${data.schedule.start_time}–${data.schedule.end_time} at ${data.schedule.temp_c}°C`
        : "Recommendation applied!";
      setApproveResult((prev) => ({ ...prev, [insight.insight_id]: msg }));
    } catch {
      setApproveResult((prev) => ({
        ...prev,
        [insight.insight_id]: "Failed — try again",
      }));
    } finally {
      setActioning(null);
    }
  }

  async function handleDismiss(insight: WeeklyInsight) {
    setActioning(insight.insight_id);
    try {
      await fetch(`/api/insights/weekly/${insight.insight_id}/dismiss`, {
        method: "POST",
      });
      setInsights((prev) =>
        prev.map((i) =>
          i.insight_id === insight.insight_id
            ? { ...i, status: "dismissed" }
            : i,
        ),
      );
    } finally {
      setActioning(null);
    }
  }

  // ── Approve / Dismiss (toast) ─────────────────────────────────────────────
  async function handleToastApprove() {
    if (!toast) return;
    setToastActioning(true);
    try {
      const res = await fetch(
        `/api/insights/weekly/${toast.insight_id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ household_id: householdId }),
        },
      );
      const data = await res.json();
      setInsights((prev) =>
        prev.map((i) =>
          i.insight_id === toast.insight_id ? { ...i, status: "approved" } : i,
        ),
      );
      const msg = data.schedule?.start_time
        ? `✓ AC scheduled: ${data.schedule.start_time}–${data.schedule.end_time} at ${data.schedule.temp_c}°C`
        : "✓ Recommendation applied!";
      setApproveResult((prev) => ({ ...prev, [toast.insight_id]: msg }));
      dismissToast();
    } catch {
      setToastActioning(false);
    }
  }

  async function handleToastDismiss() {
    if (!toast) return;
    setToastActioning(true);
    try {
      await fetch(`/api/insights/weekly/${toast.insight_id}/dismiss`, {
        method: "POST",
      });
      setInsights((prev) =>
        prev.map((i) =>
          i.insight_id === toast.insight_id ? { ...i, status: "dismissed" } : i,
        ),
      );
      dismissToast();
    } catch {
      setToastActioning(false);
    }
  }

  const isActionable = (i: WeeklyInsight) =>
    i.status !== "approved" &&
    i.status !== "dismissed" &&
    i.recommendation?.action === "ac_schedule";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Push notification toast ───────────────────────────────────────── */}
      {toast && !open && (
        <div
          className="fixed left-1/2 z-[100] w-[calc(100vw-2rem)] max-w-sm"
          style={{
            bottom: "5.5rem",
            transform: "translateX(-50%)",
            animation: "slideUpFade 0.3s ease-out both",
          }}
        >
          <div
            className={`rounded-2xl border shadow-[0_20px_50px_rgba(0,74,82,0.18)] backdrop-blur-xl ${
              isActionable(toast)
                ? "border-[#007B8A]/30 bg-gradient-to-b from-[rgba(255,255,255,0.96)] to-[rgba(243,249,249,0.92)]"
                : "border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.96)] to-[rgba(243,249,249,0.92)]"
            }`}
          >
            {/* Toast header */}
            <div className="flex items-start gap-3 px-4 pb-3 pt-4">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isActionable(toast) ? "bg-[#E0F4F5]" : "bg-[#eef6f6]"
                }`}
              >
                <svg
                  className={`h-4 w-4 ${isActionable(toast) ? "text-[#007B8A]" : "text-[#6f8c91]"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-[#10363b]">
                  {toast.notification_title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#6f8c91]">
                  {toast.notification_body}
                </p>
              </div>
              <button
                onClick={dismissToast}
                className="shrink-0 rounded-full p-1 text-[#6f8c91] hover:bg-[#86CCD2]/10 hover:text-[#4d6b70]"
                aria-label="Dismiss notification"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Toast actions for ac_schedule insights */}
            {isActionable(toast) && (
              <div className="flex gap-2 border-t border-[rgba(157,207,212,0.25)] px-4 py-3">
                <button
                  disabled={toastActioning}
                  onClick={handleToastApprove}
                  className="flex-1 rounded-xl bg-gradient-to-b from-[#86CCD2] to-[#007B8A] px-3 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(0,123,138,0.25)] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {toastActioning ? "Applying…" : "✓ Approve"}
                </button>
                <button
                  disabled={toastActioning}
                  onClick={handleToastDismiss}
                  className="rounded-xl border border-[rgba(157,207,212,0.40)] px-3 py-2 text-xs font-medium text-[#4d6b70] hover:bg-[#86CCD2]/10 disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Progress bar: 15s auto-dismiss */}
            <div className="h-0.5 w-full overflow-hidden rounded-b-2xl bg-[rgba(134,204,210,0.15)]">
              <div
                className="h-full bg-gradient-to-r from-[#86CCD2] to-[#007B8A]"
                style={{ animation: "shrinkWidth 15s linear forwards" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Bell + dropdown ───────────────────────────────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleOpen}
          className={`relative rounded-full p-2 text-[#4d6b70] transition-all hover:bg-[#86CCD2]/10 hover:text-[#007B8A] ${unreadCount > 0 ? "bell-pulse" : ""}`}
          aria-label="Notifications"
        >
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
                <span className="font-display text-sm font-bold text-[#10363b]">
                  AI Insights
                </span>
                {unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-[rgba(217,79,92,0.10)] px-2 py-0.5 text-[10px] font-semibold text-[#d94f5c]">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <span className="text-xs text-[#6f8c91]">
                {insights.length} total
              </span>
            </div>

            {loading && (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-xl bg-[#eef6f6]"
                  />
                ))}
              </div>
            )}

            {!loading && insights.length === 0 && (
              <div className="p-8 text-center">
                <svg
                  className="mx-auto mb-3 h-8 w-8 text-[#86CCD2]/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-sm text-[#6f8c91]">No insights yet.</p>
              </div>
            )}

            <div className="divide-y divide-[rgba(157,207,212,0.20)]">
              {insights.map((insight) => {
                const isActioning = actioning === insight.insight_id;
                const resultMsg = approveResult[insight.insight_id];
                const canAct =
                  insight.status !== "approved" &&
                  insight.status !== "dismissed";
                const hasSchedule =
                  insight.recommendation?.action === "ac_schedule";
                const rec = insight.recommendation;

                return (
                  <div
                    key={insight.insight_id}
                    className={`p-4 ${
                      insight.status === "unread"
                        ? "bg-[rgba(134,204,210,0.08)]"
                        : ""
                    }`}
                  >
                    {/* Header row — title links to detail page */}
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <Link
                        href={`/user/insights/${insight.insight_id}`}
                        onClick={() => setOpen(false)}
                        className="flex-1 text-sm font-semibold leading-snug text-[#10363b] hover:text-[#007B8A]"
                      >
                        {insight.notification_title}
                      </Link>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[insight.status]}`}
                      >
                        {STATUS_LABELS[insight.status]}
                      </span>
                    </div>

                    {/* Week + signal */}
                    <div className="mb-2 flex items-center gap-2">
                      <p className="text-[11px] text-[#6f8c91]">
                        Week of {formatWeek(insight.week_start)}
                      </p>
                      {hasSchedule && canAct && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Action required
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <p className="mb-2 text-xs leading-relaxed text-[#4d6b70]">
                      {insight.notification_body}
                    </p>

                    {/* View details link */}
                    <Link
                      href={`/user/insights/${insight.insight_id}`}
                      onClick={() => setOpen(false)}
                      className="mb-3 inline-flex items-center gap-1 text-[11px] font-medium text-[#007B8A] hover:underline"
                    >
                      View full details
                      <svg
                        className="h-3 w-3"
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

                    {/* AI summary — shown for unread/read */}
                    {(insight.status === "unread" ||
                      insight.status === "read") && (
                      <div className="mb-3 rounded-xl border border-[rgba(134,204,210,0.25)] bg-[rgba(134,204,210,0.08)] px-3 py-2.5">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#86CCD2]">
                          AI Analysis
                        </p>
                        <p className="text-xs italic leading-relaxed text-[#4d6b70]">
                          &ldquo;{insight.ai_summary}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Schedule detail — shown when action available */}
                    {canAct && hasSchedule && rec?.start_time && (
                      <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#86CCD2]/30 bg-[#E0F4F5]/60 px-3 py-2">
                        <svg
                          className="h-3.5 w-3.5 shrink-0 text-[#007B8A]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-[11px] font-medium text-[#007B8A]">
                          Schedule AC: {rec.start_time}–{rec.end_time} at{" "}
                          {rec.temp_c}°C
                        </p>
                      </div>
                    )}

                    {/* Result message after approve */}
                    {resultMsg && (
                      <p className="mb-3 rounded-lg bg-[rgba(15,159,110,0.08)] px-3 py-2 text-xs font-medium text-[#0f9f6e]">
                        {resultMsg}
                      </p>
                    )}

                    {/* Approve / Dismiss */}
                    {canAct && hasSchedule && (
                      <div className="flex gap-2">
                        <button
                          disabled={isActioning}
                          onClick={() => handleApprove(insight)}
                          className="flex-1 rounded-xl bg-gradient-to-b from-[#86CCD2] to-[#007B8A] px-3 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(0,123,138,0.25)] transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {isActioning ? "Applying…" : "✓ Approve"}
                        </button>
                        <button
                          disabled={isActioning}
                          onClick={() => handleDismiss(insight)}
                          className="rounded-xl border border-[rgba(157,207,212,0.40)] px-3 py-2 text-xs font-medium text-[#4d6b70] hover:bg-[#86CCD2]/10 disabled:opacity-50"
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

      {/* ── CSS keyframes ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; translate: 0 16px; }
          to   { opacity: 1; translate: 0 0; }
        }
        @keyframes shrinkWidth {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .bell-pulse {
          animation: bellRing 0.5s ease-out 1s 2;
        }
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          60% { transform: rotate(15deg); }
        }
      `}</style>
    </>
  );
}
