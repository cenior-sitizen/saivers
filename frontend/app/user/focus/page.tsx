"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useHousehold } from "@/context/HouseholdContext";

interface FocusAction {
  action_title: string;
  action_subtitle: string;
  category: string;
  potential_saving_sgd: number;
  why_headline: string;
  why_body: string;
  how_steps: string[];
  effort_level: string;
  impact_level: string;
}

interface WhyResult {
  explanation: string;
  factors: string[];
  action_title: string;
  how_steps: string[];
}

const FALLBACK_WHY: Record<number, string> = {
  1001: "Your AC runs past 2am every night — that's ~S$0.60 wasted while you're in deep sleep. Between 2am and 5am your body temperature naturally drops and you don't need active cooling. A single timer setting eliminates this waste entirely.",
  1002: "Air conditioners use roughly 5% more electricity for every 1°C lower you set. Going from 23°C to 25°C cuts nighttime cooling load by ~10%. Research shows 25–26°C is actually optimal for sleep quality — you're paying more for a temperature that's working against you.",
  1003: "HDB concrete walls and furniture act as thermal batteries. Running at 24°C before 7pm charges them up, and raising to 26°C at 9pm cuts electricity use by ~15% while the room stays comfortable. You're already a top saver — this technique keeps you there while using less energy.",
};

// Fallback per persona (same as card)
const FALLBACK_STEPS: Record<number, string[]> = {
  1001: [
    "Pick up your AC remote (or open the app if you have a smart AC)",
    "Press the 'Timer' or 'Sleep' button",
    "Set the OFF timer to 2:00am",
    "Set your temperature to 25°C now — you'll be asleep before it matters",
    "That's it. Check tomorrow's SP app — you'll see the drop immediately",
  ],
  1002: [
    "At 9pm tonight, grab your remote",
    "Press the ▲ temperature button twice — from 23°C to 25°C",
    "If you feel warm initially, use a light cotton blanket",
    "Notice how you sleep — most people find 25°C more comfortable than they expect",
    "Do this 5 nights in a row and check your weekly cost on the Aircon Impact page",
  ],
  1003: [
    "At 6:30pm, turn on AC at 24°C — let it run for the first hour",
    "The room and walls absorb the cold — don't open windows during this phase",
    "At 9pm exactly, raise temperature to 26°C on your remote",
    "You'll notice the room feels the same — that's the thermal mass working",
    "Track it: your usage chart should show a drop after 9pm on the room page",
  ],
};

const FALLBACK_TITLES: Record<number, string> = {
  1001: "Set AC auto-off at 2am tonight",
  1002: "Raise AC from 23°C to 25°C after 9pm",
  1003: "Pre-cool to 24°C before 7pm, raise to 26°C by 9pm",
};

function AutomateSection({ householdId, actionTitle }: { householdId: number; actionTitle: string }) {
  const [status, setStatus] = useState<"idle" | "allowed" | "declined">("idle");

  if (status === "allowed") {
    return (
      <div className="animate-[fadeIn_0.3s_ease_both] rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
        <p className="text-sm font-semibold text-emerald-700">Saivers will configure this tonight ✓</p>
        <p className="mt-0.5 text-xs text-emerald-600">We&apos;ll apply the setting automatically and confirm via notification.</p>
      </div>
    );
  }

  if (status === "declined") {
    return (
      <div className="animate-[fadeIn_0.3s_ease_both] rounded-2xl border border-[rgba(157,207,212,0.30)] bg-[rgba(243,249,249,0.60)] px-5 py-4 text-center">
        <p className="text-sm text-[#6f8c91]">No problem — the steps above are still available whenever you&apos;re ready.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* OR divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[rgba(157,207,212,0.35)]" />
        <span className="text-xs font-semibold uppercase tracking-widest text-[#9bb5b9]">or</span>
        <div className="h-px flex-1 bg-[rgba(157,207,212,0.35)]" />
      </div>

      {/* Automation card */}
      <section className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.97)] to-[rgba(243,249,249,0.90)] px-5 py-5 shadow-[0_4px_20px_rgba(0,123,138,0.08)]">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(0,123,138,0.10)]">
            <svg className="h-4 w-4 text-[#007B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#10363b]">Let Saivers configure this for you</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#6f8c91]">
              We&apos;ll apply the optimal AC settings automatically tonight — no manual steps needed.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStatus("allowed")}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.97] hover:bg-emerald-700"
          >
            Allow
          </button>
          <button
            onClick={() => setStatus("declined")}
            className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 transition-all active:scale-[0.97] hover:bg-red-100"
          >
            Decline
          </button>
        </div>
      </section>
    </div>
  );
}

export default function FocusPage() {
  const { householdId } = useHousehold();

  // Phase 1: static action data (instant)
  const [action, setAction] = useState<FocusAction | null>(null);
  const [actionLoading, setActionLoading] = useState(true);

  // Phase 2: AI-generated personalised "Why" (slower)
  const [why, setWhy] = useState<WhyResult | null>(null);
  const [whyLoading, setWhyLoading] = useState(true);
  const [whyError, setWhyError] = useState(false);

  // Phase 1: load focus action immediately
  useEffect(() => {
    setActionLoading(true);
    fetch(`/api/focus/${householdId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAction(d))
      .catch(() => {})
      .finally(() => setActionLoading(false));
  }, [householdId]);

  // Phase 2: load AI explanation (may take 2-4s)
  useEffect(() => {
    setWhyLoading(true);
    setWhyError(false);
    fetch(`/api/focus/${householdId}/why`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setWhy(d))
      .catch(() => setWhyError(true))
      .finally(() => setWhyLoading(false));
  }, [householdId]);

  const title = why?.action_title ?? action?.action_title ?? FALLBACK_TITLES[householdId] ?? "Focus Action";
  const steps = why?.how_steps ?? action?.how_steps ?? FALLBACK_STEPS[householdId] ?? [];
  const saving = action?.potential_saving_sgd;

  return (
    <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
      {/* Header */}
      <div className="mb-5">
        <Link
          href="/user"
          className="mb-3 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-[#10363b]"
        >
          ← My Home
        </Link>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#007B8A]">
          This week&apos;s focus
        </p>
        <h1 className="mt-1 text-[19px] font-bold leading-snug text-[#10363b]">
          {actionLoading
            ? <span className="inline-block h-6 w-64 animate-pulse rounded bg-[rgba(207,228,230,0.38)]" />
            : title}
        </h1>
        {saving != null && saving > 0 && (
          <p className="mt-1.5 text-sm text-[#6f8c91]">
            Potential saving: <span className="font-semibold text-emerald-700">~S${saving.toFixed(2)}/week</span>
          </p>
        )}
      </div>

      <div className="space-y-4">
        {/* ── Why this works — AI-personalised ─────────────────────────── */}
        <section className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.97)] to-[rgba(243,249,249,0.90)] px-5 py-5 shadow-[0_4px_20px_rgba(0,123,138,0.08)]">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#007B8A]">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold text-[#10363b]">Why this works for you</h2>
            </div>
            {why && !whyLoading && (
              <span className="shrink-0 rounded-full border border-[rgba(0,123,138,0.20)] bg-[rgba(0,123,138,0.06)] px-2 py-0.5 text-[10px] font-semibold text-[#007B8A]">
                AI · Personalised
              </span>
            )}
          </div>

          {/* Loading state */}
          {whyLoading && (
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded-full bg-[rgba(134,204,210,0.20)]" />
              <div className="h-4 w-5/6 animate-pulse rounded-full bg-[rgba(134,204,210,0.20)]" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-[rgba(134,204,210,0.20)]" />
              <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-[rgba(134,204,210,0.15)]" />
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-[rgba(134,204,210,0.15)]" />
              <p className="mt-2 text-[11px] text-[#9bb5b9]">Analysing your usage data…</p>
            </div>
          )}

          {/* AI explanation */}
          {!whyLoading && why && (
            <div className="animate-[fadeIn_0.4s_ease_both]">
              {/* Explanation text — split on double newlines into paragraphs */}
              <div className="space-y-3">
                {why.explanation.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-[#4d6b70]">{para}</p>
                ))}
              </div>

              {/* Factors that informed this explanation */}
              {why.factors.length > 0 && (
                <div className="mt-4 border-t border-[rgba(157,207,212,0.20)] pt-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#9bb5b9]">
                    Based on
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {why.factors.map((f, i) => (
                      <span key={i} className="rounded-full border border-[rgba(157,207,212,0.35)] bg-[rgba(134,204,210,0.07)] px-2.5 py-0.5 text-[11px] text-[#4d6b70]">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback if AI fails */}
          {!whyLoading && whyError && (
            <p className="text-sm leading-relaxed text-[#4d6b70]">
              {action?.why_body ?? FALLBACK_WHY[householdId] ?? "This action is one of the most effective ways to reduce your electricity bill based on your usage patterns."}
            </p>
          )}
        </section>

        {/* ── How to do it — shown immediately ─────────────────────────── */}
        <section className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.97)] to-[rgba(243,249,249,0.90)] px-5 py-5 shadow-[0_4px_20px_rgba(0,123,138,0.08)]">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(134,204,210,0.22)]">
              <svg className="h-4 w-4 text-[#007B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-[#10363b]">How to do it</h2>
          </div>

          {steps.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded-full bg-[rgba(134,204,210,0.20)]" />
              ))}
            </div>
          ) : (
            <ol className="space-y-3.5">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#007B8A] text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-[#4d6b70]">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ── OR: Let Saivers automate it ──────────────────────────────────── */}
        <AutomateSection householdId={householdId} actionTitle={title} />

        {/* ── Track progress nudge ──────────────────────────────────────── */}
        <Link
          href="/user/aircon-impact"
          className="flex items-center justify-between rounded-2xl border border-[rgba(157,207,212,0.40)] bg-white px-4 py-3.5 shadow-sm transition-colors hover:border-[#86CCD2]"
        >
          <div>
            <p className="text-sm font-semibold text-[#10363b]">Track your progress</p>
            <p className="text-xs text-[#6f8c91]">See if this week&apos;s action is working</p>
          </div>
          <svg className="h-4 w-4 text-[#6f8c91]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
