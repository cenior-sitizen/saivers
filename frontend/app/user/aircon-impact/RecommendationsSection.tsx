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

export function RecommendationsSection({ recommendations, embedded }: RecommendationsSectionProps) {
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [approvedOptionIds, setApprovedOptionIds] = useState<Set<string>>(new Set());

  function handleApprove(rec: Recommendation, optionId?: string) {
    if (optionId) {
      setApprovedOptionIds((prev) => new Set(prev).add(optionId));
    } else if (rec.options) {
      // Approve all options
      rec.options.forEach((o) => setApprovedOptionIds((prev) => new Set(prev).add(o.id)));
    } else {
      setApprovedIds((prev) => new Set(prev).add(rec.id));
      setSelected(null);
    }
  }

  const isFullyApproved = (rec: Recommendation) => {
    if (rec.options) {
      const approved = rec.options.filter((o) => approvedOptionIds.has(o.id)).length;
      return approved === rec.options.length;
    }
    return approvedIds.has(rec.id);
  };

  const approvedCount = (rec: Recommendation) =>
    rec.options ? rec.options.filter((o) => approvedOptionIds.has(o.id)).length : 0;

  return (
    <>
      <section className={embedded ? "" : "mb-8"}>
        {!embedded && (
          <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
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
                suggestion={rec.options ? rec.options.map((o) => o.label).join(" • ") : rec.suggestion ?? ""}
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setSelected(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
          aria-label="Close"
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-[#86CCD2]/30 bg-white p-6 shadow-xl dark:border-[#86CCD2]/20 dark:bg-zinc-900 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {selected.title}
            </h3>
            {selected.options ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#86CCD2] dark:text-[#86CCD2]/90">
                  Set up in Xiaomi Home — choose one or both
                </p>
                {selected.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`rounded-xl border p-4 ${
                      approvedOptionIds.has(opt.id)
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
                      onClick={() => handleApprove(selected, opt.id)}
                      disabled={approvedOptionIds.has(opt.id)}
                      className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-medium ${
                        approvedOptionIds.has(opt.id)
                          ? "cursor-default bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-[#86CCD2] text-white hover:bg-[#86CCD2]/90"
                      }`}
                    >
                      {approvedOptionIds.has(opt.id) ? "Approved" : "Approve"}
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
                  {selected.suggestion}
                </p>
              </div>
            )}
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[#666666] dark:text-zinc-500">
              Why we suggest this
            </p>
            <p className="mt-1 text-sm font-normal italic text-[#666666] dark:text-zinc-400">
              {selected.reason}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              {!selected.options && (
                <button
                  type="button"
                  onClick={() => handleApprove(selected)}
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
