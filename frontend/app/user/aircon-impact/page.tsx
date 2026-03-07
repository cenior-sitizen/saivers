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
}

const TARIFF = 0.2911;

export default function AirconImpactScreen() {
 const { householdId, persona } = useHousehold();
 const [data, setData] = useState<HouseholdData | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(false);

 useEffect(() => {
 setLoading(true);
 setError(false);
 setData(null);
 fetch(`/api/aircon/household/${householdId}`)
 .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
 .then((d) => setData(d))
 .catch(() => setError(true))
 .finally(() => setLoading(false));
 }, [householdId]);

 const sp = data?.spEnergy;
 const today = data?.today;

 const savedVsLastWeek = sp && sp.lastWeekKwh > sp.thisWeekKwh
 ? (sp.lastWeekKwh - sp.thisWeekKwh) * TARIFF
 : 0;

 return (
 <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
 <div className="mb-6">
 <Link
 href="/user"
 className="mb-2 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-[#10363b]"
 >
 ← Back to My Home
 </Link>
 <h1 className="text-xl font-bold text-[#10363b]">
 {persona.name}&apos;s Aircon Impact
 </h1>
 <p className="mt-1 text-sm text-[#666666]">
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
 <div key={i} className="h-20 animate-pulse rounded-2xl bg-[rgba(207,228,230,0.38)]" />
 ))}
 </div>
 )}

 {!loading && !error && (
 <>
 {/* Weekly summary */}
 <section className="mb-5">
 <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
 This Week (Total Energy)
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
 sub: sp ? `S$${(sp.thisWeekCostSgd * 4.33).toFixed(0)}/month est.` : "",
 },
 {
 label: "vs Last Week",
 value: sp
 ? `${sp.vsLastWeekPct > 0 ? "+" : ""}${sp.vsLastWeekPct}%`
 : "—",
 sub: sp && sp.vsLastWeekPct < 0 ? "↓ Improving" : "↑ Higher usage",
 accent: sp ? (sp.vsLastWeekPct > 0 ? "text-red-600" : "text-emerald-600") : "",
 },
 {
 label: "Carbon Footprint",
 value: sp ? `${sp.thisWeekCarbonKg.toFixed(1)} kg CO₂` : "—",
 sub: "This week",
 },
 ].map((m) => (
 <div
 key={m.label}
 className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3 shadow-[0_8px_24px_rgba(0,123,138,0.07)]"
 >
 <p className="text-xs text-[#6f8c91]">{m.label}</p>
 <p className={`mt-0.5 text-lg font-bold ${m.accent || "text-[#10363b]"}`}>
 {m.value}
 </p>
 {m.sub && <p className="text-[10px] text-[#6f8c91]">{m.sub}</p>}
 </div>
 ))}
 </div>
 </section>

 {/* Today's AC */}
 <section className="mb-5">
 <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
 Today&apos;s AC
 </h2>
 <div className="grid grid-cols-3 gap-2">
 {[
 { label: "Status", value: today?.status ?? "—" },
 { label: "Set Temp", value: today ? `${today.temperature}°C` : "—" },
 { label: "Runtime", value: today ? `${today.runtimeHours}h` : "—" },
 ].map((m) => (
 <div
 key={m.label}
 className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-3 py-3 shadow-[0_8px_24px_rgba(0,123,138,0.07)]"
 >
 <p className="text-[10px] text-[#6f8c91]">{m.label}</p>
 <p className="mt-0.5 text-base font-bold text-[#10363b]">{m.value}</p>
 </div>
 ))}
 </div>
 </section>

 {/* Savings insight */}
 {savedVsLastWeek > 0 && (
 <section className="mb-5">
 <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
 <p className="text-sm font-semibold text-emerald-800">
 Saving this week vs last
 </p>
 <p className="mt-1 text-2xl font-bold text-emerald-700">
 S${savedVsLastWeek.toFixed(2)}
 </p>
 <p className="mt-1 text-xs text-emerald-600">
 Projected monthly saving: S${(savedVsLastWeek * 4.33).toFixed(2)}
 </p>
 </div>
 </section>
 )}

 {/* Persona benchmark */}
 <section className="mb-5">
 <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
 Persona Comparison
 </h2>
 <div className="space-y-2">
 {[
 { name: "Ahmad (Waster)", kwh: 255, cost: 74, active: householdId === 1001 },
 { name: "Priya (Moderate)", kwh: 116, cost: 34, active: householdId === 1002 },
 { name: "Wei Ming (Champion)", kwh: 95, cost: 27, active: householdId === 1003 },
 ].map((p) => (
 <div
 key={p.name}
 className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
 p.active
 ? "border-[#86CCD2] bg-[#E0F4F5]"
 : "border-[rgba(157,207,212,0.20)] bg-white"
 }`}
 >
 <div>
 <p className="text-sm font-medium text-[#10363b]">{p.name}</p>
 <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-[rgba(207,228,230,0.40)]">
 <div
 className={`h-full rounded-full ${p.active ? "bg-[#007B8A]" : "bg-[#6f8c91]"}`}
 style={{ width: `${(p.kwh / 255) * 100}%` }}
 />
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm font-bold text-[#10363b]">{p.kwh} kWh</p>
 <p className="text-xs text-[#6f8c91]">S${p.cost}/wk</p>
 </div>
 </div>
 ))}
 </div>
 </section>

 {/* Recommendations */}
 <section className="mb-8">
 <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6f8c91]">
 Recommendations
 </h2>
 <div className="space-y-2">
 {householdId === 1001 && [
 "Set AC auto-off at 2am — saves S$4.20/week",
 "Raise temperature from 20°C to 25°C — saves ~30% energy",
 "Avoid cooling past midnight — your biggest savings opportunity",
 ].map((tip) => (
 <div key={tip} className="rounded-xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3">
 <p className="text-sm text-[#4d6b70]">{tip}</p>
 </div>
 ))}
 {householdId === 1002 && [
 "Raise AC from 23°C to 25°C during peak hours — saves ~S$4/month",
 "Pre-cool before 7pm, then raise to 26°C by 9pm",
 "Maintain your evening-only AC habit to hit your 7-day streak",
 ].map((tip) => (
 <div key={tip} className="rounded-xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3">
 <p className="text-sm text-[#4d6b70]">{tip}</p>
 </div>
 ))}
 {householdId === 1003 && [
 "You're already in the top 5% — maintain your 26°C habit",
 "You're 20 points away from your S$5 CDC voucher",
 "Share your habit streak with neighbours to inspire them",
 ].map((tip) => (
 <div key={tip} className="rounded-xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3">
 <p className="text-sm text-[#4d6b70]">{tip}</p>
 </div>
 ))}
 </div>
 </section>
 </>
 )}
 </div>
 );
}
