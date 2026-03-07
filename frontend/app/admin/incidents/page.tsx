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
    high: "bg-red-100 text-red-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-[rgba(157,207,212,0.25)] text-[#4d6b70]",
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
        excess_kwh:
          inc.excess_kwh ??
          (parseFloat(inc.description.match(/Excess ([\d.]+)/)?.[1] ?? "0") || 0),
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
      <div className="flex items-center justify-center gap-2 py-20 text-[#6f8c91]">
        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading incidents…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#10363b]">
          Incidents
        </h1>
        <p className="mt-1 text-sm text-[#6f8c91]">
          Chronological timeline of anomalies, outages, spikes, and recovery
          events
        </p>
      </div>

      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-[rgba(157,207,212,0.4)]" />
        <div className="space-y-6">
          {incidents.length > 0 ? (
            incidents.map((inc) => (
              <div key={inc.id} className="relative flex gap-6 pl-12">
                {/* Timeline dot */}
                <div className="absolute left-2 top-1.5 h-3 w-3 rounded-full bg-[#00a3ad] ring-4 ring-[#f3f9f9]" />
                <div className="flex-1 rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-white/95 to-[rgba(243,249,249,0.88)] p-4 shadow-[0_4px_16px_rgba(0,123,138,0.06)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={inc.severity} />
                    <span className="text-xs text-[#9bb5b9]">
                      {inc.event_type}
                    </span>
                    {inc.household_id && (
                      <span className="text-xs text-[#9bb5b9]">
                        HH {inc.household_id}
                      </span>
                    )}
                  </div>
                  <h4 className="mt-2 font-medium text-[#10363b]">
                    {inc.title}
                  </h4>
                  <p className="mt-1 text-sm text-[#4d6b70]">
                    {inc.description}
                  </p>
                  {inc.household_id != null && inc.anomaly_score != null && (
                    <div className="mt-2">
                      {explanations[inc.id] ? (
                        <p className="rounded-xl bg-[rgba(0,163,173,0.06)] px-3 py-2 text-sm text-[#10363b]">
                          {explanations[inc.id]}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleExplain(inc)}
                          disabled={explainingId === inc.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(157,207,212,0.45)] bg-white px-2.5 py-1.5 text-xs font-medium text-[#4d6b70] shadow-sm transition-all hover:border-[#86CCD2] hover:text-[#10363b] hover:shadow-[0_2px_8px_rgba(0,123,138,0.10)] disabled:opacity-50"
                        >
                          {explainingId === inc.id ? (
                            <>
                              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Explaining…
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              AI Explain
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-[#9bb5b9]">
                    {formatTs(inc.ts)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[rgba(157,207,212,0.5)] bg-[rgba(243,249,249,0.6)] px-6 py-12 text-center">
              <p className="text-sm text-[#6f8c91]">No incidents in the last 7 days</p>
              <p className="mt-1 text-xs text-[#9bb5b9]">
                Incidents are derived from energy_features where anomaly_score &gt; 2.0
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
