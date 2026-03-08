"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useHousehold } from "@/context/HouseholdContext";

interface HouseholdData {
  householdId: number;
  spEnergy?: {
    thisWeekKwh: number;
    lastWeekKwh: number;
    thisWeekCostSgd: number;
    thisWeekCarbonKg: number;
    vsLastWeekPct: number;
  };
  today?: {
    energyKwh: number;
    runtimeHours: number;
    status: string;
    temperature: number;
  };
  behaviourSummary?: {
    avgDailyKwh: number;
    avgDailyRuntimeH: number;
    peakHourRange: string;
    highestWeekday: string;
  } | null;
  comparisons?: {
    vsDistrict?: {
      yourWeekKwh: number;
      districtPerHomeWeekKwh: number;
      sgNationalPerHomeWeekKwh: number;
      percentVsDistrict: number;
      percentVsSingapore: number;
    };
  };
}

const TARIFF = 0.2911;

// Tangible impact equivalences for Singapore context
function tangibleImpact(kwhSaved: number): string {
  if (kwhSaved <= 0) return "";
  const fan_nights = Math.round(kwhSaved / 0.04); // 40W fan for 1 night
  const kopitiam = Math.round((kwhSaved * TARIFF) / 1.2); // ~S$1.20 kopi
  if (kopitiam >= 2) return `≈ ${kopitiam} kopitiam breakfasts saved this week`;
  if (fan_nights >= 3)
    return `≈ enough to run your fan for ${fan_nights} nights`;
  return `≈ S${(kwhSaved * TARIFF).toFixed(2)} back in your pocket`;
}

// Anonymous tier labels — shown to all users, no names disclosed
const USAGE_TIERS = [
  { label: "High Usage Home", tier: "high", kwh: 255, cost: 74, hid: 1001 },
  { label: "Moderate Home", tier: "moderate", kwh: 116, cost: 34, hid: 1002 },
  { label: "Efficient Home", tier: "efficient", kwh: 95, cost: 27, hid: 1003 },
];

// Per-persona recommendations with Action-to-Reward format
const RECOMMENDATIONS: Record<
  number,
  Array<{ action: string; weeklySaving: string; reward: string; icon: string }>
> = {
  1001: [
    {
      action: "Set AC auto-off at 2am tonight",
      weeklySaving: "Save ~S$4.20/week",
      reward: "+18% toward CDC voucher",
      icon: "⏱",
    },
    {
      action: "Raise temperature from 20°C to 25°C",
      weeklySaving: "Save ~4.8 kWh/week",
      reward: "+12% toward voucher",
      icon: "🌡",
    },
    {
      action: "Avoid cooling past midnight — biggest opportunity",
      weeklySaving: "Save ~S$18/month",
      reward: "Unlock efficiency badge",
      icon: "🌙",
    },
  ],
  1002: [
    {
      action: "Raise AC from 23°C to 25°C after 9pm",
      weeklySaving: "Save ~S$4/month",
      reward: "+8% toward CDC voucher",
      icon: "🌡",
    },
    {
      action: "Pre-cool to 24°C before 7pm, raise to 26°C by 9pm",
      weeklySaving: "Save ~1.5 kWh/week",
      reward: "Maintain 5-day streak",
      icon: "🕖",
    },
    {
      action: "Keep evening-only AC habit to hit 7-day milestone",
      weeklySaving: "100 bonus points",
      reward: "Unlock streak badge",
      icon: "🔥",
    },
  ],
  1003: [
    {
      action: "You're already in the top 5% — keep 26°C habit",
      weeklySaving: "Maintain S$3/week savings",
      reward: "20 pts from CDC voucher",
      icon: "🏆",
    },
    {
      action: "Share your habit streak to inspire your block",
      weeklySaving: "+50 community points",
      reward: "Unlock Community Leader badge",
      icon: "🤝",
    },
    {
      action: "Explore off-peak cooling before 6pm",
      weeklySaving: "Save ~0.8 kWh/day",
      reward: "+5% toward next voucher",
      icon: "⚡",
    },
  ],
};

export default function AirconImpactScreen() {
  const { householdId, persona } = useHousehold();
  const [data, setData] = useState<HouseholdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setData(null);
    // Use the lightweight summary route (4 queries, 5-min cache)
    // instead of the full household route (13 queries) used by the room page
    fetch(`/api/aircon/summary/${householdId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [householdId]);

  const sp = data?.spEnergy;
  const today = data?.today;
  const dist = data?.comparisons?.vsDistrict;
  const beh = data?.behaviourSummary;

  const savedKwh =
    sp && sp.lastWeekKwh > sp.thisWeekKwh ? sp.lastWeekKwh - sp.thisWeekKwh : 0;
  const savedCost = savedKwh * TARIFF;
  const impact = tangibleImpact(savedKwh);

  const recommendations = RECOMMENDATIONS[householdId] ?? RECOMMENDATIONS[1001];

  return (
    <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/user"
          className="mb-2 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-[#10363b]"
        >
          ← Back to My Home
        </Link>
        <h1 className="text-xl font-bold text-[#10363b]">Your Aircon Impact</h1>
        <p className="mt-1 text-sm text-[#6f8c91]">
          {persona.label} · {persona.description}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Unable to load live data. Check ClickHouse connection.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-[rgba(207,228,230,0.38)]"
            />
          ))}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ── 1. Cost hero ── */}
          <section className="mb-5">
            <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-5 py-5 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
              <p className="text-xs font-medium text-[#6f8c91]">This week&apos;s electricity cost</p>
              <div className="mt-1 flex items-end gap-3">
                <p className="text-4xl font-bold text-[#10363b]">
                  {sp ? `S$${sp.thisWeekCostSgd.toFixed(2)}` : "—"}
                </p>
                {sp && (
                  <span
                    className={`mb-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      sp.vsLastWeekPct <= 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {sp.vsLastWeekPct <= 0 ? "↓" : "↑"}{" "}
                    {Math.abs(sp.vsLastWeekPct)}% vs last week
                  </span>
                )}
              </div>

              {/* Savings callout */}
              {savedCost > 0 && (
                <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2">
                  <p className="text-sm font-medium text-emerald-700">
                    You saved S${savedCost.toFixed(2)} compared to last week
                    {impact ? ` — ${impact}` : ""}
                  </p>
                </div>
              )}

              {/* AC habit pills */}
              {(beh || today) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {today && (
                    <span className="rounded-full border border-[rgba(157,207,212,0.40)] bg-white px-3 py-1 text-xs text-[#4d6b70]">
                      AC at {today.temperature}°C · {today.runtimeHours}h today
                    </span>
                  )}
                  {beh && (
                    <span className="rounded-full border border-[rgba(157,207,212,0.40)] bg-white px-3 py-1 text-xs text-[#4d6b70]">
                      Busiest {beh.peakHourRange}
                    </span>
                  )}
                  {beh && (
                    <span className="rounded-full border border-[rgba(157,207,212,0.40)] bg-white px-3 py-1 text-xs text-[#4d6b70]">
                      Highest on {beh.highestWeekday}s
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── 2. How you compare ── */}
          {dist && (
            <section className="mb-5">
              <h2 className="mb-3 text-sm font-semibold text-[#10363b]">
                How you compare
              </h2>
              <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-4 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
                {/* Homes bar */}
                <div className="space-y-3">
                  {USAGE_TIERS.map((tier) => {
                    const isMe = tier.hid === householdId;
                    const displayCost = isMe && sp ? sp.thisWeekCostSgd : tier.cost;
                    const maxCost = USAGE_TIERS[0].cost;
                    return (
                      <div key={tier.label} className="flex items-center gap-3">
                        <div className="w-20 shrink-0">
                          <p className={`text-xs font-medium ${isMe ? "text-[#007B8A]" : "text-[#6f8c91]"}`}>
                            {isMe ? "You" : tier.label.replace(" Home", "")}
                          </p>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 overflow-hidden rounded-full bg-[rgba(207,228,230,0.40)]">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${isMe ? "bg-[#007B8A]" : "bg-[rgba(157,207,212,0.50)]"}`}
                              style={{ width: `${(displayCost / maxCost) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-12 shrink-0 text-right">
                          <p className={`text-xs font-semibold ${isMe ? "text-[#007B8A]" : "text-[#6f8c91]"}`}>
                            S${Math.round(displayCost)}/wk
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Plain-language district callout */}
                <div className="mt-4 border-t border-[rgba(157,207,212,0.20)] pt-3">
                  <p className="text-sm text-[#4d6b70]">
                    {dist.percentVsDistrict <= 0 ? (
                      <>
                        You use{" "}
                        <span className="font-semibold text-emerald-700">
                          {Math.abs(dist.percentVsDistrict)}% less
                        </span>{" "}
                        than the average home in your area.
                      </>
                    ) : (
                      <>
                        You use{" "}
                        <span className="font-semibold text-amber-700">
                          {dist.percentVsDistrict}% more
                        </span>{" "}
                        than the average home in your area.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ── 3. What you can do ── */}
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-[#10363b]">
              What you can do
            </h2>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3.5 shadow-[0_4px_12px_rgba(0,123,138,0.06)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg">{rec.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#10363b]">
                        {rec.action}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                          {rec.weeklySaving}
                        </span>
                        <span className="rounded-full border border-[rgba(0,123,138,0.25)] bg-[rgba(0,163,173,0.06)] px-2.5 py-0.5 text-[10px] font-medium text-[#007B8A]">
                          {rec.reward}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
