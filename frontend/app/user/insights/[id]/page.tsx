"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Insight {
  insight_id: string;
  household_id: number;
  week_start: string;
  generated_at: string;
  signal_type: string;
  ac_night_anomaly: boolean;
  nights_observed: number;
  weekly_increase: boolean;
  this_week_kwh: number;
  last_week_kwh: number;
  change_pct: number;
  weekly_cost_sgd: number;
  weekly_carbon_kg: number;
  ai_summary: string;
  recommendation_type: string;
  recommendation_json: string;
  recommendation: { action: string; start_time?: string; end_time?: string; temp_c?: number };
  notification_title: string;
  notification_body: string;
  status: "unread" | "read" | "approved" | "dismissed";
}

const SIGNAL_META: Record<string, { label: string; color: string; icon: string }> = {
  ac_night_anomaly: {
    label: "Overnight AC anomaly",
    color: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/20 dark:border-red-800/40",
    icon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
  },
  weekly_increase: {
    label: "Weekly usage increase",
    color: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-800/40",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
  efficient: {
    label: "Energy champion",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-800/40",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
};

const STATUS_DISPLAY: Record<string, { label: string; style: string }> = {
  unread: { label: "New", style: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400" },
  read: { label: "Read", style: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
  approved: { label: "Approved ✓", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  dismissed: { label: "Dismissed", style: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500" },
};

function formatWeek(weekStart: string) {
  return new Date(weekStart).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function InsightDetailPage() {
  const params = useParams();
  const router = useRouter();
  const insightId = params.id as string;

  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actioning, setActioning] = useState<"approve" | "dismiss" | null>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!insightId) return;
    // Mark as read
    fetch(`/api/insights/weekly/${insightId}/read`, { method: "POST" }).catch(() => {});
    // Fetch detail
    fetch(`/api/insights/detail/${insightId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setInsight(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [insightId]);

  async function handleApprove() {
    if (!insight) return;
    setActioning("approve");
    try {
      const res = await fetch(`/api/insights/weekly/${insightId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ household_id: insight.household_id }),
      });
      const data = await res.json();
      setInsight((prev) => prev && { ...prev, status: "approved" });
      const msg = data.schedule?.start_time
        ? `AC scheduled ${data.schedule.start_time}–${data.schedule.end_time} at ${data.schedule.temp_c}°C`
        : "Recommendation applied!";
      setResult({ type: "success", message: msg });
    } catch {
      setResult({ type: "error", message: "Failed to apply — please try again." });
    } finally {
      setActioning(null);
    }
  }

  async function handleDismiss() {
    if (!insight) return;
    setActioning("dismiss");
    try {
      await fetch(`/api/insights/weekly/${insightId}/dismiss`, { method: "POST" });
      setInsight((prev) => prev && { ...prev, status: "dismissed" });
      setResult({ type: "success", message: "Insight dismissed." });
      setTimeout(() => router.back(), 1200);
    } catch {
      setResult({ type: "error", message: "Failed to dismiss — please try again." });
    } finally {
      setActioning(null);
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
        <div className="mb-6 h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
        <Link href="/user" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
          ← Back
        </Link>
        <p className="text-sm text-zinc-500">Insight not found.</p>
      </div>
    );
  }

  const signal = SIGNAL_META[insight.signal_type] ?? SIGNAL_META.efficient;
  const status = STATUS_DISPLAY[insight.status] ?? STATUS_DISPLAY.read;
  const canAct = insight.status !== "approved" && insight.status !== "dismissed";
  const hasSchedule = insight.recommendation?.action === "ac_schedule";
  const rec = insight.recommendation;

  const vsLastWeekPositive = insight.change_pct > 0;

  return (
    <div className="min-h-screen bg-[#F3F9F9] pb-20 dark:bg-zinc-950">
      <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
        {/* Back */}
        <Link
          href="/user"
          className="mb-4 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to My Home
        </Link>

        {/* Title + status */}
        <div className="mb-5">
          <div className="mb-2 flex items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${signal.color}`}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={signal.icon} />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold leading-snug text-zinc-900 dark:text-zinc-50">
                {insight.notification_title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${status.style}`}>
                  {status.label}
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${signal.color}`}>
                  {signal.label}
                </span>
                {canAct && hasSchedule && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Action required
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="pl-12 text-xs text-zinc-400">
            Week of {formatWeek(insight.week_start)}
          </p>
        </div>

        {/* Summary */}
        <section className="mb-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {insight.notification_body}
            </p>
          </div>
        </section>

        {/* Data basis — what triggered this */}
        <section className="mb-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            What triggered this insight
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#86CCD2]/30 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[10px] font-medium text-zinc-400">This Week</p>
              <p className="mt-0.5 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {insight.this_week_kwh.toFixed(1)}
                <span className="ml-1 text-sm font-normal text-zinc-400">kWh</span>
              </p>
            </div>
            <div className="rounded-2xl border border-[#86CCD2]/30 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[10px] font-medium text-zinc-400">Last Week</p>
              <p className="mt-0.5 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {insight.last_week_kwh.toFixed(1)}
                <span className="ml-1 text-sm font-normal text-zinc-400">kWh</span>
              </p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 shadow-sm ${
              vsLastWeekPositive
                ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
                : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
            }`}>
              <p className="text-[10px] font-medium text-zinc-400">vs Last Week</p>
              <p className={`mt-0.5 text-xl font-bold ${
                vsLastWeekPositive ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {vsLastWeekPositive ? "+" : ""}{insight.change_pct.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-2xl border border-[#86CCD2]/30 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-[10px] font-medium text-zinc-400">Est. Cost</p>
              <p className="mt-0.5 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                S${insight.weekly_cost_sgd.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Extra context rows */}
          <div className="mt-3 space-y-2">
            {insight.ac_night_anomaly && insight.nights_observed > 0 && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
                <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                  AC detected running past midnight on {insight.nights_observed} night{insight.nights_observed !== 1 ? "s" : ""} this week
                </p>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-[#86CCD2]/20 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Carbon footprint: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{insight.weekly_carbon_kg.toFixed(2)} kg CO₂</span> this week
              </p>
            </div>
          </div>
        </section>

        {/* AI Analysis */}
        <section className="mb-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            AI Analysis
          </h2>
          <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E0F4F5] dark:bg-[#007B8A]/20">
                <svg className="h-3 w-3 text-[#007B8A]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#007B8A]">
                Saivers AI
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              &ldquo;{insight.ai_summary}&rdquo;
            </p>
          </div>
        </section>

        {/* Recommendation detail */}
        {hasSchedule && rec?.start_time && (
          <section className="mb-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Recommended Action
            </h2>
            <div className="rounded-2xl border border-[#007B8A]/30 bg-[#E0F4F5]/60 p-4 dark:border-[#007B8A]/20 dark:bg-[#007B8A]/10">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#007B8A]/10 dark:bg-[#007B8A]/20">
                  <svg className="h-5 w-5 text-[#007B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#007B8A] dark:text-[#86CCD2]">
                    AC Schedule Adjustment
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Run AC from <span className="font-semibold">{rec.start_time}</span> to <span className="font-semibold">{rec.end_time}</span> at <span className="font-semibold">{rec.temp_c}°C</span>
                  </p>
                  <p className="mt-1.5 text-xs text-zinc-400">
                    Tapping Approve will apply this schedule automatically to your AC unit.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Result message */}
        {result && (
          <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-medium ${
            result.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-400"
              : "border border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-400"
          }`}>
            {result.type === "success" ? "✓ " : "✗ "}{result.message}
          </div>
        )}

        {/* Decision buttons */}
        {canAct && hasSchedule && !result && (
          <section className="mb-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Your Decision
            </h2>
            <div className="flex gap-3">
              <button
                disabled={actioning !== null}
                onClick={handleApprove}
                className="flex-1 rounded-xl bg-[#007B8A] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {actioning === "approve" ? "Applying…" : "✓ Approve recommendation"}
              </button>
              <button
                disabled={actioning !== null}
                onClick={handleDismiss}
                className="rounded-xl border border-zinc-200 px-4 py-3.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        {/* Already actioned state */}
        {insight.status === "approved" && !result && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
            <svg className="h-5 w-5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              You approved this recommendation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
