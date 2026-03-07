"use client";

import { useEffect, useState } from "react";
import {
  getRecommendations,
  type AdminRecommendation,
} from "@/lib/admin-api";

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    high: "bg-red-100 text-red-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-emerald-100 text-emerald-800",
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
      <div className="flex items-center justify-center gap-2 py-20 text-[#6f8c91]">
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading recommendations…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#10363b]">
          Recommendations
        </h1>
        <p className="mt-1 text-sm text-[#6f8c91]">
          AI-generated operational next steps — investigate region, verify
          telemetry, check infrastructure
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {recs.length > 0 ? (
          recs.map((rec) => (
            <div
              key={rec.id}
              className="rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-white/95 to-[rgba(243,249,249,0.88)] p-6 shadow-[0_4px_16px_rgba(0,123,138,0.06)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,123,138,0.12)]"
            >
              <div className="flex items-start justify-between gap-2">
                <PriorityBadge priority={rec.priority} />
                {rec.household_id && (
                  <span className="text-xs text-[#9bb5b9]">
                    HH {rec.household_id}
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-semibold text-[#10363b]">
                {rec.action}
              </h3>
              <p className="mt-2 text-sm text-[#4d6b70]">{rec.reason}</p>
              <p className="mt-2 text-xs text-[#9bb5b9]">
                Region: {rec.region}
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-[rgba(157,207,212,0.5)] bg-[rgba(243,249,249,0.6)] px-6 py-12 text-center">
            <p className="text-sm text-[#6f8c91]">No recommendations available</p>
            <p className="mt-1 text-xs text-[#9bb5b9]">
              Ensure the Saivers backend is running and ClickHouse has data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
