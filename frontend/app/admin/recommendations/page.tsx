"use client";

import { useEffect, useState } from "react";
import {
  getRecommendations,
  type AdminRecommendation,
} from "@/lib/admin-api";

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    medium:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[priority as keyof typeof styles] ?? styles.low
      }`}
    >
      {priority}
    </span>
  );
}

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<AdminRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendations()
      .then(setRecs)
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-zinc-500">
          <svg
            className="h-5 w-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading recommendations…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Recommendations
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          AI-generated operational next steps — investigate region, verify
          telemetry, check infrastructure
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {recs.length > 0 ? (
          recs.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              <div className="flex items-start justify-between gap-2">
                <PriorityBadge priority={rec.priority} />
                {rec.household_id && (
                  <span className="text-xs text-zinc-500">
                    HH {rec.household_id}
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-50">
                {rec.action}
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {rec.reason}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Region: {rec.region}
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="text-zinc-500 dark:text-zinc-400">
              No recommendations available
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Ensure the WattCoach backend is running and ClickHouse has data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
