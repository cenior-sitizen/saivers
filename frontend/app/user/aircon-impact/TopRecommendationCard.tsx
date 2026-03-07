"use client";

import { useState } from "react";
import { InfoButton } from "@/components/InfoButton";
import type { Recommendation } from "./RecommendationsSection";

interface TopRecommendationCardProps {
  recommendation: Recommendation & { estimatedSavings?: string };
}

export function TopRecommendationCard({
  recommendation,
}: TopRecommendationCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  function handleApprove(optionId?: string) {
    if (optionId) {
      setApprovedIds((prev) => new Set(prev).add(optionId));
    } else if (recommendation.options) {
      recommendation.options.forEach((o) =>
        setApprovedIds((prev) => new Set(prev).add(o.id)),
      );
    } else {
      setApprovedIds(new Set(["single"]));
    }
  }

  const approved = recommendation.options
    ? approvedIds.size === recommendation.options.length
    : approvedIds.has("single");
  const approvedCount = recommendation.options
    ? recommendation.options.filter((o) => approvedIds.has(o.id)).length
    : 0;

  const estimatedSavings = recommendation.estimatedSavings ?? null;

  const cardSuggestion = recommendation.options
    ? recommendation.options.map((o) => o.label).join(" • ")
    : (recommendation.suggestion ?? "");

  return (
    <>
      <div
        className={`relative rounded-2xl border p-4 shadow-sm transition-colors hover:opacity-95 ${
          approved
            ? "border-emerald-200 bg-emerald-50"
            : "border-[#86CCD2]/30 bg-[#86CCD2]/10"
        }`}
      >
        <div className="absolute right-3 top-3">
          <InfoButton />
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full text-left"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[#86CCD2]">
            Top recommendation
          </p>
          <h3
            className={`mt-1 font-semibold ${
              approved ? "text-emerald-800" : "text-[#10363b]"
            }`}
          >
            {recommendation.title}
          </h3>
          <p
            className={`mt-1 text-sm ${
              approved ? "text-emerald-700" : "text-[#666666]"
            }`}
          >
            {cardSuggestion}
          </p>
          {estimatedSavings && !approved && (
            <p className="mt-2 text-xs font-medium text-[#007B8A]">
              Est. savings: {estimatedSavings}
            </p>
          )}
          {(approved || approvedCount > 0) && (
            <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {approved
                ? "Applied ✓"
                : `${approvedCount} of ${recommendation.options!.length} applied`}
            </span>
          )}
          {!approved && (
            <p className="mt-2 text-xs text-[#007B8A]">
              Tap to review and apply →
            </p>
          )}
        </button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setShowModal(false)}
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
                  {recommendation.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
                {recommendation.options ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-[#6f8c91]">
                      Apply one or both settings in your Xiaomi Home app:
                    </p>
                    {recommendation.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`rounded-xl border p-3.5 transition-colors ${
                          approvedIds.has(opt.id)
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
                          {approvedIds.has(opt.id) && (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Applied ✓
                            </span>
                          )}
                        </div>
                        {!approvedIds.has(opt.id) && (
                          <button
                            type="button"
                            onClick={() => handleApprove(opt.id)}
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
                      {recommendation.suggestion}
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
                  {recommendation.reason}
                </p>
              </div>

              {/* Estimated savings */}
              {estimatedSavings && (
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
                    Estimated savings: {estimatedSavings}
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="border-t border-[rgba(157,207,212,0.25)] px-5 pb-6 pt-4 sm:pb-5">
              {recommendation.options ? (
                /* For multi-option: just a close button since each option has its own apply */
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-xl border border-[rgba(157,207,212,0.50)] px-4 py-3 text-sm font-medium text-[#4d6b70] hover:bg-[#86CCD2]/10"
                >
                  {approvedIds.size > 0 ? "Done" : "Not now"}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl border border-[rgba(157,207,212,0.50)] px-4 py-3 text-sm font-medium text-[#4d6b70] hover:bg-[#86CCD2]/10"
                  >
                    Not now
                  </button>
                  {!approved ? (
                    <button
                      type="button"
                      onClick={() => handleApprove()}
                      className="flex-1 rounded-xl bg-gradient-to-b from-[#86CCD2] to-[#007B8A] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,123,138,0.30)] hover:opacity-90"
                    >
                      Apply this change
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
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
