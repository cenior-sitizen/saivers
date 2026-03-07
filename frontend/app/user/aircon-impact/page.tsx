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
          {/* ── Weekly energy metrics ── */}
          <section className="mb-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
              This Week — Total Home Energy
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Usage",
                  value: sp ? `${sp.thisWeekKwh} kWh` : "—",
                  sub: sp ? `vs last week ${sp.lastWeekKwh} kWh` : "",
                },
                {
                  label: "Estimated Cost",
                  value: sp ? `S$${sp.thisWeekCostSgd.toFixed(2)}` : "—",
                  sub: sp
                    ? `S$${(sp.thisWeekCostSgd * 4.33).toFixed(0)}/month est.`
                    : "",
                },
                {
                  label: "vs Last Week",
                  value: sp
                    ? `${sp.vsLastWeekPct > 0 ? "+" : ""}${sp.vsLastWeekPct}%`
                    : "—",
                  sub:
                    sp && sp.vsLastWeekPct < 0
                      ? "↓ Improving"
                      : "↑ Higher usage",
                  accent:
                    sp && sp.vsLastWeekPct > 0
                      ? "text-red-600"
                      : "text-emerald-600",
                },
                {
                  label: "Carbon Footprint",
                  value: sp ? `${sp.thisWeekCarbonKg.toFixed(1)} kg CO₂` : "—",
                  sub: sp
                    ? `≈ ${Math.round(sp.thisWeekCarbonKg * 6.7)} km car trip`
                    : "This week",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3 shadow-[0_8px_24px_rgba(0,123,138,0.07)]"
                >
                  <p className="text-xs text-[#6f8c91]">{m.label}</p>
                  <p
                    className={`mt-0.5 text-lg font-bold ${m.accent ?? "text-[#10363b]"}`}
                  >
                    {m.value}
                  </p>
                  {m.sub && (
                    <p className="text-[10px] text-[#6f8c91]">{m.sub}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Savings + Tangible Impact ── */}
          {savedCost > 0 && (
            <section className="mb-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-sm font-semibold text-emerald-800">
                  Saving this week vs last
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  S${savedCost.toFixed(2)}
                </p>
                {impact && (
                  <span className="mt-2 inline-block rounded-full border border-emerald-200 bg-white px-3 py-0.5 text-[11px] text-emerald-700">
                    {impact}
                  </span>
                )}
                <p className="mt-2 text-xs text-emerald-600">
                  Projected monthly saving: S${(savedCost * 4.33).toFixed(2)}
                </p>
              </div>
            </section>
          )}

          {/* ── District & Singapore Comparison ── */}
          {dist && (
            <section className="mb-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
                How You Compare
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3">
                  <p className="text-xs text-[#6f8c91]">vs Punggol avg</p>
                  <p
                    className={`mt-0.5 text-lg font-bold ${dist.percentVsDistrict > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {dist.percentVsDistrict > 0 ? "+" : ""}
                    {dist.percentVsDistrict}%
                  </p>
                  <p className="text-[10px] text-[#6f8c91]">
                    Neighbourhood avg {dist.districtPerHomeWeekKwh} kWh/wk
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3">
                  <p className="text-xs text-[#6f8c91]">vs SG avg (est.)</p>
                  <p
                    className={`mt-0.5 text-lg font-bold ${dist.percentVsSingapore > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {dist.percentVsSingapore > 0 ? "+" : ""}
                    {dist.percentVsSingapore}%
                  </p>
                  <p className="text-[10px] text-[#6f8c91]">
                    National ref. {dist.sgNationalPerHomeWeekKwh} kWh/wk
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ── Today's AC ── */}
          <section className="mb-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
              Today&apos;s AC
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Status", value: today?.status ?? "—" },
                {
                  label: "Set Temp",
                  value: today ? `${today.temperature}°C` : "—",
                },
                {
                  label: "Runtime",
                  value: today ? `${today.runtimeHours}h` : "—",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-3 py-3 shadow-[0_8px_24px_rgba(0,123,138,0.07)]"
                >
                  <p className="text-[10px] text-[#6f8c91]">{m.label}</p>
                  <p className="mt-0.5 text-base font-bold text-[#10363b]">
                    {m.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Peak hour callout from behaviour summary */}
            {beh && (
              <div className="mt-2 rounded-xl border border-[rgba(157,207,212,0.30)] bg-[rgba(134,204,210,0.08)] px-4 py-2.5">
                <p className="text-xs text-[#4d6b70]">
                  <span className="font-semibold text-[#10363b]">
                    Peak usage time:{" "}
                  </span>
                  {beh.peakHourRange} · Highest on{" "}
                  <span className="font-semibold">{beh.highestWeekday}s</span>
                </p>
              </div>
            )}
          </section>

          {/* ── Homes in Your Area (anonymous) ── */}
          <section className="mb-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
              Homes in Your Area
            </h2>
            <div className="space-y-2">
              {USAGE_TIERS.map((tier) => {
                const isMe = tier.hid === householdId;
                return (
                  <div
                    key={tier.label}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                      isMe
                        ? "border-[#86CCD2] bg-[#E0F4F5]"
                        : "border-[rgba(157,207,212,0.20)] bg-white"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#10363b]">
                        {isMe ? "Your Home" : tier.label}
                        {isMe && (
                          <span className="ml-2 rounded-full bg-[#007B8A] px-2 py-0.5 text-[10px] font-semibold text-white">
                            You
                          </span>
                        )}
                      </p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[rgba(207,228,230,0.40)]">
                        <div
                          className={`h-full rounded-full ${isMe ? "bg-[#007B8A]" : "bg-[#6f8c91]"}`}
                          style={{ width: `${(tier.kwh / 255) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <p className="text-sm font-bold text-[#10363b]">
                        {isMe && sp
                          ? `${sp.thisWeekKwh} kWh`
                          : `~${tier.kwh} kWh`}
                      </p>
                      <p className="text-xs text-[#6f8c91]">
                        {isMe && sp
                          ? `S$${sp.thisWeekCostSgd.toFixed(0)}/wk`
                          : `~S$${tier.cost}/wk`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-1.5 text-[10px] text-[#6f8c91]">
              * Reference tiers — individual home identities are kept private
            </p>
          </section>

          {/* ── Bigger Picture ── */}
          <section className="mb-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
              Your Impact on the Grid
            </h2>
            <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-4">
              <p className="text-sm text-[#4d6b70]">
                When many households shift high-usage appliances to off-peak
                hours (before 7am or after 11pm), Singapore&apos;s grid runs
                more efficiently — reducing the need for costly peaking plants
                and lowering carbon emissions for everyone.
              </p>
              {sp && (
                <div className="mt-3 flex gap-4 border-t border-[rgba(157,207,212,0.30)] pt-3">
                  <div>
                    <p className="text-[10px] text-[#6f8c91]">
                      Your CO₂ this week
                    </p>
                    <p className="text-sm font-bold text-[#10363b]">
                      {sp.thisWeekCarbonKg.toFixed(1)} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6f8c91]">≈ car km</p>
                    <p className="text-sm font-bold text-[#10363b]">
                      {Math.round(sp.thisWeekCarbonKg * 6.7)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6f8c91]">
                      Trees to offset
                    </p>
                    <p className="text-sm font-bold text-[#10363b]">
                      {(sp.thisWeekCarbonKg / 21).toFixed(1)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Action-to-Reward Recommendations ── */}
          <section className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
              Recommended Actions
            </h2>
            <div className="space-y-2">
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3 shadow-[0_4px_12px_rgba(0,123,138,0.06)]"
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
