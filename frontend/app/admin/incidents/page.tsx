"use client";

import { useEffect, useState } from "react";
import {
  getIncidents,
  explainAnomaly,
  type IncidentEvent,
} from "@/lib/admin-api";

function formatTs(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleString("en-SG", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return ts;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles = {
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[severity as keyof typeof styles] ?? styles.low
      }`}
    >
      {severity}
    </span>
  );
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});

  const handleExplain = async (inc: IncidentEvent) => {
    if (!inc.household_id || inc.anomaly_score == null) return;
    setExplainingId(inc.id);
    try {
      const { explanation } = await explainAnomaly({
        household_id: inc.household_id,
        ts: inc.ts,
        anomaly_score: inc.anomaly_score,
        excess_kwh: inc.excess_kwh ?? (parseFloat(inc.description.match(/Excess ([\d.]+)/)?.[1] ?? "0") || 0),
      });
      setExplanations((prev) => ({ ...prev, [inc.id]: explanation }));
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unable to generate explanation.";
      setExplanations((prev) => ({ ...prev, [inc.id]: msg }));
    } finally {
      setExplainingId(null);
    }
  };

  useEffect(() => {
    getIncidents(7)
      .then(setIncidents)
      .catch(() => setIncidents([]))
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
          Loading incidents…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Incidents
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Chronological timeline of anomalies, outages, spikes, and recovery
          events
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />
        <div className="space-y-6">
          {incidents.length > 0 ? (
            incidents.map((inc) => (
              <div
                key={inc.id}
                className="relative flex gap-6 pl-12"
              >
                <div className="absolute left-2 top-1.5 h-3 w-3 rounded-full bg-[#86ccd2] ring-4 ring-white dark:ring-zinc-950" />
                <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={inc.severity} />
                    <span className="text-xs text-zinc-500">
                      {inc.event_type}
                    </span>
                    {inc.household_id && (
                      <span className="text-xs text-zinc-500">
                        HH {inc.household_id}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-2 font-medium text-zinc-900 dark:text-zinc-50">
                    {inc.title}
                  </h4>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {inc.description}
                  </p>
                  {inc.household_id != null && inc.anomaly_score != null && (
                    <div className="mt-2">
                      {explanations[inc.id] ? (
                        <p className="rounded-md bg-zinc-100 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {explanations[inc.id]}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleExplain(inc)}
                          disabled={explainingId === inc.id}
                          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        >
                          {explainingId === inc.id ? (
                            <>
                              <svg
                                className="h-3.5 w-3.5 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
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
                              Explaining…
                            </>
                          ) : (
                            <>
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
                                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                />
                              </svg>
                              AI Explain
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-zinc-500">
                    {formatTs(inc.ts)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
              <p className="text-zinc-500 dark:text-zinc-400">
                No incidents in the last 7 days
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Incidents are derived from energy_features where anomaly_score
                &gt; 2.0
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
