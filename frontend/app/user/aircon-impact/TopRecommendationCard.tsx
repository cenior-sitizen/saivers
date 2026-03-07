"use client";

import { useState } from "react";
import { InfoButton } from "@/components/InfoButton";
import type { Recommendation } from "./RecommendationsSection";

interface TopRecommendationCardProps {
  recommendation: Recommendation & { estimatedSavings?: string };
}

export function TopRecommendationCard({ recommendation }: TopRecommendationCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  function handleApprove(optionId?: string) {
    if (optionId) {
      setApprovedIds((prev) => new Set(prev).add(optionId));
    } else if (recommendation.options) {
      recommendation.options.forEach((o) => setApprovedIds((prev) => new Set(prev).add(o.id)));
    } else {
      setApprovedIds(new Set(["single"]));
    }
  }

  const approved =
    recommendation.options
      ? approvedIds.size === recommendation.options.length
      : approvedIds.has("single");
  const approvedCount = recommendation.options
    ? recommendation.options.filter((o) => approvedIds.has(o.id)).length
    : 0;

  const estimatedSavings = recommendation.estimatedSavings ?? null;

  const cardSuggestion = recommendation.options
    ? recommendation.options.map((o) => o.label).join(" • ")
    : recommendation.suggestion ?? "";

  return (
    <>
      <div
        className={`relative rounded-2xl border p-4 shadow-sm transition-colors hover:opacity-95 ${
          approved
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20"
            : "border-[#86CCD2]/30 bg-[#86CCD2]/10 dark:border-[#86CCD2]/20 dark:bg-[#86CCD2]/5"
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
        <p className="text-xs font-medium uppercase tracking-wide text-[#86CCD2] dark:text-[#86CCD2]/90">
          Top recommendation
        </p>
        <h3
          className={`mt-1 font-semibold ${
            approved ? "text-emerald-800 dark:text-emerald-300" : "text-zinc-900 dark:text-zinc-50"
          }`}
        >
          {recommendation.title}
        </h3>
        <p
          className={`mt-1 text-sm ${
            approved ? "text-emerald-700 dark:text-emerald-400" : "text-[#666666] dark:text-zinc-400"
          }`}
        >
          {cardSuggestion}
        </p>
        {estimatedSavings && !approved && (
          <p className="mt-2 text-xs font-medium text-[#007B8A] dark:text-[#86CCD2]">
            Est. savings: {estimatedSavings}
          </p>
        )}
        {(approved || approvedCount > 0) && (
          <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            {approved ? "Approved" : `${approvedCount} of ${recommendation.options!.length} approved`}
          </span>
        )}
        </button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setShowModal(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setShowModal(false)}
          aria-label="Close"
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-[#86CCD2]/30 bg-white p-6 shadow-xl dark:border-[#86CCD2]/20 dark:bg-zinc-900 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[#86CCD2] dark:text-[#86CCD2]/90">
              Top recommendation
            </p>
            <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {recommendation.title}
            </h3>
            {recommendation.options ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#86CCD2] dark:text-[#86CCD2]/90">
                  Set up in Xiaomi Home — choose one or both
                </p>
                {recommendation.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`rounded-xl border p-4 ${
                      approvedIds.has(opt.id)
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20"
                        : "border-[#86CCD2]/40 bg-[#86CCD2]/10 dark:bg-[#86CCD2]/5"
                    }`}
                  >
                    <p className="text-xs font-medium text-[#86CCD2] dark:text-[#86CCD2]/90">
                      {opt.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {opt.suggestion}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleApprove(opt.id)}
                      disabled={approvedIds.has(opt.id)}
                      className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-medium ${
                        approvedIds.has(opt.id)
                          ? "cursor-default bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-[#86CCD2] text-white hover:bg-[#86CCD2]/90"
                      }`}
                    >
                      {approvedIds.has(opt.id) ? "Approved" : "Approve"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-[#86CCD2]/40 bg-[#86CCD2]/10 p-4 dark:bg-[#86CCD2]/5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#86CCD2] dark:text-[#86CCD2]/90">
                  Set up in Xiaomi Home
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {recommendation.suggestion}
                </p>
              </div>
            )}
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[#666666] dark:text-zinc-500">
              Why we suggest this
            </p>
            <p className="mt-1 text-sm font-normal italic text-[#666666] dark:text-zinc-400">
              {recommendation.reason}
            </p>
            {estimatedSavings && (
              <p className="mt-3 text-sm font-medium text-[#007B8A] dark:text-[#86CCD2]">
                Est. savings: {estimatedSavings}
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              {!recommendation.options && (
                <button
                  type="button"
                  onClick={() => handleApprove()}
                  className="flex-1 rounded-xl bg-[#86CCD2] px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#86CCD2]/90"
                >
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
