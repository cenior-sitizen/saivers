"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useHousehold } from "@/context/HouseholdContext";

interface FocusAction {
  action_title: string;
  action_subtitle: string;
  category: "schedule" | "temperature" | "habit";
  potential_saving_sgd: number;
  effort_level: string;
  impact_level: string;
}

// Static fallback per persona — card always shows even before seed runs
const FALLBACK: Record<number, FocusAction> = {
  1001: {
    action_title: "Set AC auto-off at 2am tonight",
    action_subtitle: "Your AC runs past 2am every night — that's ~S$0.60 wasted",
    category: "schedule",
    potential_saving_sgd: 4.20,
    effort_level: "low",
    impact_level: "high",
  },
  1002: {
    action_title: "Raise AC from 23°C to 25°C after 9pm",
    action_subtitle: "2 degrees cooler uses ~10% more electricity all night",
    category: "temperature",
    potential_saving_sgd: 4.00,
    effort_level: "low",
    impact_level: "medium",
  },
  1003: {
    action_title: "Pre-cool to 24°C before 7pm, raise to 26°C by 9pm",
    action_subtitle: "Charge your room's thermal mass and coast through the night",
    category: "habit",
    potential_saving_sgd: 3.00,
    effort_level: "medium",
    impact_level: "medium",
  },
};

const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string }> = {
  schedule: {
    label: "Schedule",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  temperature: {
    label: "Temperature",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  },
  habit: {
    label: "Habit",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
};

export function WeeklyFocusCard() {
  const { householdId } = useHousehold();
  const [action, setAction] = useState<FocusAction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setAction(null);
    fetch(`/api/focus/${householdId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAction(d ?? FALLBACK[householdId] ?? FALLBACK[1001]))
      .catch(() => setAction(FALLBACK[householdId] ?? FALLBACK[1001]))
      .finally(() => setLoading(false));
  }, [householdId]);

  const display = action ?? (loading ? null : (FALLBACK[householdId] ?? FALLBACK[1001]));
  const meta = CATEGORY_META[display?.category ?? "habit"];

  return (
    <Link href="/user/focus" className="mb-5 block">
      {loading ? (
        <div className="h-[148px] animate-pulse rounded-2xl bg-[rgba(0,123,138,0.08)]" />
      ) : display ? (
        <div className="group relative overflow-hidden rounded-2xl border border-[rgba(0,123,138,0.15)] bg-white shadow-[0_4px_24px_rgba(0,74,82,0.10)] transition-all duration-200 active:scale-[0.985]">

          {/* Left accent bar */}
          <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-[#86CCD2] to-[#007B8A]" />

          <div className="px-5 pb-4 pl-6 pt-4">
            {/* Top row: "Focus Action" label + saving badge */}
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {/* Pulsing active dot */}
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#007B8A] opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#007B8A]" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#007B8A]">
                  Focus Action · This Week
                </span>
              </div>
              {display.potential_saving_sgd > 0 && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  ~S${display.potential_saving_sgd.toFixed(2)}/wk
                </span>
              )}
            </div>

            {/* The ONE action */}
            <p className="text-[16px] font-bold leading-snug text-[#10363b]">
              {display.action_title}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#6f8c91]">
              {display.action_subtitle}
            </p>

            {/* Footer: category tag + CTA */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-full border border-[rgba(157,207,212,0.40)] bg-[rgba(134,204,210,0.08)] px-2.5 py-1 text-[#4d6b70]">
                {meta.icon}
                <span className="text-[11px] font-medium">{meta.label}</span>
                <span className="text-[11px] text-[#9bb5b9]">·</span>
                <span className="text-[11px] font-medium">
                  {display.effort_level === "low" ? "Quick win" : "Build a habit"}
                </span>
              </div>
              <span className="flex items-center gap-0.5 text-[12px] font-semibold text-[#007B8A] transition-all group-hover:gap-1.5">
                Why this works
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </Link>
  );
}
