"use client";

import { useState } from "react";
import { RecommendationCard } from "@/components/RecommendationCard";

export interface RecommendationOption {
  id: string;
  label: string;
  suggestion: string;
}

export interface Recommendation {
  id: string;
  title: string;
  suggestion?: string;
  reason: string;
  estimatedSavings?: string;
  /** When present, user can approve each option independently (one, both, or neither) */
  options?: RecommendationOption[];
}

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  embedded?: boolean;
}

export function RecommendationsSection({
  recommendations,
  embedded,
}: RecommendationsSectionProps) {
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [approvedOptionIds, setApprovedOptionIds] = useState<Set<string>>(
    new Set(),
  );

  function handleApprove(rec: Recommendation, optionId?: string) {
    if (optionId) {
      setApprovedOptionIds((prev) => new Set(prev).add(optionId));
    } else if (rec.options) {
      // Approve all options
      rec.options.forEach((o) =>
        setApprovedOptionIds((prev) => new Set(prev).add(o.id)),
      );
    } else {
      setApprovedIds((prev) => new Set(prev).add(rec.id));
      setSelected(null);
    }
  }

  const isFullyApproved = (rec: Recommendation) => {
    if (rec.options) {
      const approved = rec.options.filter((o) =>
        approvedOptionIds.has(o.id),
      ).length;
      return approved === rec.options.length;
    }
    return approvedIds.has(rec.id);
  };

  const approvedCount = (rec: Recommendation) =>
    rec.options
      ? rec.options.filter((o) => approvedOptionIds.has(o.id)).length
      : 0;

  return (
    <>
      <section className={embedded ? "" : "mb-8"}>
        {!embedded && (
          <h2 className="mb-3 text-sm font-semibold text-[#10363b]">
            Recommendations
          </h2>
        )}
        <div className="flex flex-col gap-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(rec)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(rec);
                }
              }}
              className="cursor-pointer text-left transition-opacity hover:opacity-90"
            >
              <RecommendationCard
                title={rec.title}
                suggestion={
                  rec.options
                    ? rec.options.map((o) => o.label).join(" • ")
                    : (rec.suggestion ?? "")
                }
                reason={rec.reason}
                isApproved={isFullyApproved(rec)}
                approvedCount={rec.options ? approvedCount(rec) : undefined}
                optionsCount={rec.options?.length}
                showInfoButton={false}
              />
            </div>
          ))}
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Recommendation details"
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-[rgba(157,207,212,0.5)]" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[rgba(157,207,212,0.25)] px-5 pb-4 pt-4 sm:pt-5">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E0F4F5] px-2.5 py-1 text-[11px] font-semibold text-[#007B8A]">
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
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    AI Recommendation
                  </span>
                </div>
                <h3 className="text-base font-bold leading-snug text-[#10363b]">
                  {selected.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="shrink-0 rounded-full p-1.5 text-[#6f8c91] hover:bg-[#86CCD2]/10 hover:text-[#10363b]"
                aria-label="Close"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body — scrollable on small screens */}
            <div className="max-h-[55vh] overflow-y-auto px-5 py-4 sm:max-h-none">
              {/* What will change */}
              <div className="mb-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#007B8A]">
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  What will change
                </p>
                {selected.options ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-[#6f8c91]">
                      Apply one or both settings in your Xiaomi Home app:
                    </p>
                    {selected.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`rounded-xl border p-3.5 transition-colors ${
                          approvedOptionIds.has(opt.id)
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-[rgba(157,207,212,0.40)] bg-[rgba(134,204,210,0.08)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#86CCD2]">
                              {opt.label}
                            </p>
                            <p className="mt-1 text-sm font-medium text-[#10363b]">
                              {opt.suggestion}
                            </p>
                          </div>
                          {approvedOptionIds.has(opt.id) && (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Applied ✓
                            </span>
                          )}
                        </div>
                        {!approvedOptionIds.has(opt.id) && (
                          <button
                            type="button"
                            onClick={() => handleApprove(selected, opt.id)}
                            className="mt-3 w-full rounded-lg bg-gradient-to-b from-[#86CCD2] to-[#007B8A] py-2 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(0,123,138,0.25)] hover:opacity-90"
                          >
                            Apply this setting
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[rgba(157,207,212,0.40)] bg-[rgba(134,204,210,0.08)] p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#86CCD2]">
                      Set up in Xiaomi Home
                    </p>
                    <p className="mt-1.5 text-sm font-medium text-[#10363b]">
                      {selected.suggestion}
                    </p>
                  </div>
                )}
              </div>

              {/* Why we suggest this */}
              <div className="rounded-xl border border-[rgba(157,207,212,0.25)] bg-[rgba(243,249,249,0.60)] px-3.5 py-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6f8c91]">
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
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Why we suggest this
                </p>
                <p className="text-sm leading-relaxed text-[#4d6b70]">
                  {selected.reason}
                </p>
              </div>

              {/* Estimated savings if available */}
              {selected.estimatedSavings && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-[rgba(15,159,110,0.07)] px-3.5 py-2.5">
                  <svg
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-emerald-700">
                    Estimated savings: {selected.estimatedSavings}
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="border-t border-[rgba(157,207,212,0.25)] px-5 pb-6 pt-4 sm:pb-5">
              {selected.options ? (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="w-full rounded-xl border border-[rgba(157,207,212,0.50)] px-4 py-3 text-sm font-medium text-[#4d6b70] hover:bg-[#86CCD2]/10"
                >
                  {approvedOptionIds.size > 0 ? "Done" : "Not now"}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="flex-1 rounded-xl border border-[rgba(157,207,212,0.50)] px-4 py-3 text-sm font-medium text-[#4d6b70] hover:bg-[#86CCD2]/10"
                  >
                    Not now
                  </button>
                  {!approvedIds.has(selected.id) ? (
                    <button
                      type="button"
                      onClick={() => handleApprove(selected)}
                      className="flex-1 rounded-xl bg-gradient-to-b from-[#86CCD2] to-[#007B8A] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,123,138,0.30)] hover:opacity-90"
                    >
                      Apply this change
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                    >
                      Applied ✓
                    </button>
                  )}
                </div>
              )}
              <p className="mt-3 text-center text-[11px] text-[#9bb5b9]">
                Changes apply to your Xiaomi Home smart AC settings
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
