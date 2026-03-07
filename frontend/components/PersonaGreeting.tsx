"use client";

import { useEffect, useState } from "react";
import { useHousehold } from "@/context/HouseholdContext";

interface LiveStats {
 thisWeekKwh: number;
 thisWeekCostSgd: number;
 vsLastWeekPct: number;
}

const PERSONA_CONTEXT: Record<number, { color: string; badge: string; tip: string }> = {
 1001: {
 color: "border-red-200 bg-red-50",
 badge: "bg-red-100 text-red-700",
 tip: "Your AC runs midnight–5am every night. That alone costs ~S$4.20 extra/week.",
 },
 1002: {
 color: "border-amber-200 bg-amber-50",
 badge: "bg-amber-100 text-amber-700",
 tip: "Evening AC usage is well-managed. Raising temp to 25°C saves ~S$4/month.",
 },
 1003: {
 color: "border-emerald-200 bg-emerald-50",
 badge: "bg-emerald-100 text-emerald-700",
 tip: "You're in the top 5% of energy savers in Punggol this month. Keep it up!",
 },
};

export function PersonaGreeting() {
 const { householdId, persona } = useHousehold();
 const [stats, setStats] = useState<LiveStats | null>(null);

 useEffect(() => {
 setStats(null);
 fetch(`/api/aircon/household/${householdId}`)
 .then((r) => r.ok ? r.json() : null)
 .then((data) => {
 if (data?.spEnergy) {
 setStats({
 thisWeekKwh: data.spEnergy.thisWeekKwh,
 thisWeekCostSgd: data.spEnergy.thisWeekCostSgd,
 vsLastWeekPct: data.spEnergy.vsLastWeekPct,
 });
 }
 })
 .catch(() => {});
 }, [householdId]);

 const ctx = PERSONA_CONTEXT[householdId] ?? PERSONA_CONTEXT[1002];

 return (
 <div className={`mb-4 rounded-2xl border p-4 ${ctx.color}`}>
 <div className="flex items-start justify-between gap-3">
 <div>
 <div className="flex items-center gap-2">
 <p className="text-sm font-semibold text-[#10363b]">
 {persona.name}&apos;s Home
 </p>
 <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ctx.badge}`}>
 {persona.label}
 </span>
 </div>
 <p className="mt-1 text-xs text-[#6f8c91]">{ctx.tip}</p>
 </div>
 {stats && (
 <div className="shrink-0 text-right">
 <p className="text-lg font-bold text-[#10363b]">
 S${stats.thisWeekCostSgd.toFixed(0)}
 </p>
 <p className="text-[10px] text-[#6f8c91]">this week</p>
 </div>
 )}
 </div>
 {stats && (
 <div className="mt-3 flex gap-3">
 <div>
 <p className="text-[10px] text-[#6f8c91]">Total kWh</p>
 <p className="text-sm font-semibold text-[#10363b]">{stats.thisWeekKwh}</p>
 </div>
 <div>
 <p className="text-[10px] text-[#6f8c91]">vs Last Week</p>
 <p className={`text-sm font-semibold ${stats.vsLastWeekPct > 0 ? "text-red-600" : "text-emerald-600"}`}>
 {stats.vsLastWeekPct > 0 ? "+" : ""}{stats.vsLastWeekPct}%
 </p>
 </div>
 </div>
 )}
 </div>
 );
}
