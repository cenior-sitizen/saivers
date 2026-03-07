"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { CollapsibleAppliance } from "@/components/CollapsibleAppliance";
import { StatusSummaryCard } from "@/components/StatusSummaryCard";
import { TimeRangeToggle, type TimeRangeOption } from "@/components/TimeRangeToggle";
import { UsageBehaviourChart } from "@/components/UsageBehaviourChart";
import { SpikeDetailCard } from "@/components/SpikeDetailCard";
import { BehaviourInsightCard } from "@/components/BehaviourInsightCard";
import { BehaviourSummaryCard } from "@/components/BehaviourSummaryCard";
import { useHousehold } from "@/context/HouseholdContext";
import {
 roomDataMap,
 usageTimeSeriesDay,
 usageTimeSeriesWeek,
 usageTimeSeriesMonth,
 behaviourSummariesByAppliance,
 spikeEventsByAppliance,
 comparisonDataMap,
 behaviourInsightsMap,
} from "./mockData";

interface ApprovedInsight {
 insight_id: string;
 notification_title: string;
 notification_body: string;
 week_start: string;
 status: string;
 recommendation: { action: string; start_time?: string; end_time?: string; temp_c?: number };
}

function ApprovedInsightBanner({ householdId }: { householdId: number }) {
 const [insight, setInsight] = useState<ApprovedInsight | null>(null);
 const [dismissed, setDismissed] = useState(false);

 useEffect(() => {
 setInsight(null);
 setDismissed(false);
 fetch(`/api/insights/weekly/${householdId}`)
 .then((r) => r.json())
 .then((data: ApprovedInsight[]) => {
 if (!Array.isArray(data)) return;
 const approved = data.find(
 (i) => i.status === "approved" && i.recommendation?.action === "ac_schedule"
 );
 setInsight(approved ?? null);
 })
 .catch(() => {});
 }, [householdId]);

 if (!insight || dismissed) return null;

 const { start_time, end_time, temp_c } = insight.recommendation;

 return (
 <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-2.5">
 <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100">
 <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 </svg>
 </div>
 <div>
 <p className="text-sm font-semibold text-emerald-800">
 AI Recommendation Applied
 </p>
 {start_time && (
 <p className="mt-0.5 text-xs text-emerald-700">
 AC scheduled {start_time}–{end_time} at {temp_c}°C
 </p>
 )}
 <p className="mt-1 text-[11px] text-emerald-600">
 {insight.notification_title}
 </p>
 </div>
 </div>
 <button
 onClick={() => setDismissed(true)}
 className="shrink-0 text-emerald-400 hover:text-emerald-600"
 aria-label="Dismiss"
 >
 <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 </div>
 </div>
 );
}

const VALID_ROOMS = ["master-room", "room-1", "room-2", "living-room"];

export default function RoomAirconPage() {
 const params = useParams();
 const roomSlug = params.room as string;
 const { householdId } = useHousehold();

 const [timeRange, setTimeRange] = useState<TimeRangeOption>("week");
 const [apiData, setApiData] = useState<{
 today?: { energyKwh: number; runtimeHours: number; status: string; temperature: number };
 usageDay?: { time: string; value: number; isOn: boolean }[];
 usageWeek?: { time: string; value: number; isOn: boolean }[];
 vsLastWeek?: { thisWeekKwh: number; lastWeekKwh: number; percentChange: number };
 spEnergy?: { thisWeekKwh: number; lastWeekKwh: number; thisWeekCostSgd: number; thisWeekCarbonKg: number; vsLastWeekPct: number };
 } | null>(null);

 // Fetch by householdId from context so persona switching updates the data
 useEffect(() => {
 if (!roomSlug || !VALID_ROOMS.includes(roomSlug)) return;
 fetch(`/api/aircon/household/${householdId}`)
 .then((r) => (r.ok ? r.json() : null))
 .then((data) => data && setApiData(data))
 .catch(() => {});
 }, [roomSlug, householdId]);

 if (!roomSlug || !VALID_ROOMS.includes(roomSlug)) {
 return (
 <div className="px-4 py-6">
 <p className="text-[#4d6b70]">Room not found.</p>
 <Link href="/user" className="mt-4 text-[#86CCD2] underline">
 Back to My Home
 </Link>
 </div>
 );
 }

 const room = roomDataMap[roomSlug];
 const baseComparison = comparisonDataMap[roomSlug];
 const comparisonData = apiData?.vsLastWeek
 ? {
 ...baseComparison,
 vsLastWeek: {
 label: `Your usage is ${apiData.vsLastWeek.percentChange >= 0 ? "" : ""}${apiData.vsLastWeek.percentChange}% ${apiData.vsLastWeek.percentChange >= 0 ? "higher" : "lower"} than last week`,
 value: `${apiData.vsLastWeek.percentChange >= 0 ? "+" : ""}${apiData.vsLastWeek.percentChange}%`,
 isPositive: apiData.vsLastWeek.percentChange <= 0,
 },
 }
 : baseComparison;
 const behaviourInsights = behaviourInsightsMap[roomSlug] ?? [];

 const chartData =
 timeRange === "day"
 ? (apiData?.usageDay?.length ? apiData.usageDay : usageTimeSeriesDay)
 : timeRange === "week"
 ? (apiData?.usageWeek?.length ? apiData.usageWeek : usageTimeSeriesWeek)
 : usageTimeSeriesMonth;

 return (
 <div className="min-h-screen px-4 pb-20 sm:mx-auto sm:max-w-md sm:px-0">
 {/* Header */}
 <div className="mb-6 pt-2">
 <Link
 href="/user"
 className="mb-2 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-[#10363b]"
 >
 ← Back to My Home
 </Link>
 <div className="flex items-start justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-[#10363b]">
 {room.name}
 </h1>
 <p className="mt-1 text-sm text-[#666666]">
 {room.appliances.length} smart appliance{room.appliances.length > 1 ? "s" : ""}
 </p>
 </div>
 <Image
 src="/midea-aircon.png"
 alt="Air conditioner"
 width={80}
 height={60}
 className="shrink-0 object-contain"
 />
 </div>
 </div>

 {/* Approved insight banner */}
 <ApprovedInsightBanner householdId={householdId} />

 {/* Live weekly energy summary — data changes per persona */}
 {apiData?.spEnergy && (
 <div className="mb-4 grid grid-cols-3 gap-2">
 <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-3 py-3 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
 <p className="text-[10px] font-medium text-[#6f8c91]">This Week</p>
 <p className="mt-0.5 text-lg font-bold text-[#10363b]">
 {apiData.spEnergy.thisWeekKwh} <span className="text-xs font-normal text-[#6f8c91]">kWh</span>
 </p>
 </div>
 <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-3 py-3 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
 <p className="text-[10px] font-medium text-[#6f8c91]">Weekly Cost</p>
 <p className="mt-0.5 text-lg font-bold text-[#10363b]">
 S${apiData.spEnergy.thisWeekCostSgd.toFixed(0)}
 </p>
 </div>
 <div className={`rounded-2xl border px-3 py-3 shadow-sm ${
 apiData.spEnergy.vsLastWeekPct > 0
 ? "border-red-200 bg-red-50"
 : "border-emerald-200 bg-emerald-50"
 }`}>
 <p className="text-[10px] font-medium text-[#6f8c91]">vs Last Week</p>
 <p className={`mt-0.5 text-lg font-bold ${
 apiData.spEnergy.vsLastWeekPct > 0 ? "text-red-600" : "text-emerald-600"
 }`}>
 {apiData.spEnergy.vsLastWeekPct > 0 ? "+" : ""}{apiData.spEnergy.vsLastWeekPct}%
 </p>
 </div>
 </div>
 )}

 {/* Expandable appliance sections */}
 <div className="space-y-3">
 {room.appliances.map((appliance) => {
 const behaviourSummary =
 behaviourSummariesByAppliance[roomSlug]?.[appliance.id];
 const spikeEvents =
 spikeEventsByAppliance[roomSlug]?.[appliance.id] ?? [];
 const applianceData =
 apiData?.today && appliance.id === "ac"
 ? {
 ...appliance,
 status: apiData.today.status as "On" | "Off",
 temperature: apiData.today.temperature,
 runtimeTodayHours: apiData.today.runtimeHours,
 energyTodayKwh: apiData.today.energyKwh,
 }
 : appliance;
 const isAc = appliance.id === "ac";

 return (
 <CollapsibleAppliance
 key={appliance.id}
 id={appliance.id}
 name={appliance.name}
 modelNumber={applianceData.modelNumber}
 image={appliance.image}
 status={applianceData.status}
 defaultOpen={isAc}
 >
 {!isAc ? (
 <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#86CCD2]/40 bg-[#F3F9F9]/50 py-12 dark:border-[#86CCD2]/20 dark:bg-[#86CCD2]/5">
 <p className="text-sm font-medium text-[#666666] dark:text-zinc-400">
 To be developed
 </p>
 <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
 Insights & usage data coming soon
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 <StatusSummaryCard
 status={applianceData.status}
 temperature={applianceData.temperature}
 runtimeTodayHours={applianceData.runtimeTodayHours}
 energyTodayKwh={applianceData.energyTodayKwh}
 />
 <div>
 <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
 View by
 </p>
 <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
 </div>
 <UsageBehaviourChart
 data={chartData}
 title="Energy usage: You vs Paya Lebar vs Singapore"
 />

 {behaviourSummary && (
 <div className="grid grid-cols-2 gap-2">
 <BehaviourSummaryCard
 label="Most common usage"
 value={behaviourSummary.mostCommonUsageTime}
 />
 <BehaviourSummaryCard
 label="Longest runtime"
 value={behaviourSummary.longestRuntimePeriod}
 />
 <BehaviourSummaryCard
 label="Highest day"
 value={behaviourSummary.highestUsageDay}
 />
 <BehaviourSummaryCard
 label="Avg daily runtime"
 value={behaviourSummary.avgDailyRuntime}
 />
 </div>
 )}

 <div className="space-y-3 rounded-xl border border-[#86CCD2]/20 bg-[#F3F9F9]/50 p-3 dark:border-[#86CCD2]/10 dark:bg-[#86CCD2]/5">
 {spikeEvents.length > 0 && (
 <div>
 <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
 Spike explanation
 </p>
 <div className="space-y-2">
 {spikeEvents.map((spike) => (
 <SpikeDetailCard
 key={spike.id}
 dateTime={spike.dateTime}
 room={spike.room}
 appliance={spike.appliance}
 magnitude={spike.magnitude}
 cause={spike.cause}
 explanation={spike.explanation}
 />
 ))}
 </div>
 </div>
 )}

 <div>
 <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
 Usage trends
 </p>
 <div className="rounded-2xl border border-[#86CCD2]/20 bg-white p-4 dark:border-[#86CCD2]/10 dark:bg-zinc-900">
 <div className="space-y-4">
 <div className="flex items-start gap-4">
 <div className="flex min-w-0 flex-1 flex-col">
 <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
 vs last week
 </p>
 <p className={`mt-1 text-2xl font-bold tabular-nums ${
 comparisonData.vsLastWeek.isPositive
 ? "text-emerald-600 dark:text-emerald-400"
 : "text-amber-600 dark:text-amber-400"
 }`}>
 {comparisonData.vsLastWeek.value}
 </p>
 <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-snug">
 {comparisonData.vsLastWeek.label}
 </p>
 </div>
 <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
 comparisonData.vsLastWeek.isPositive
 ? "bg-emerald-100 dark:bg-emerald-900/30"
 : "bg-amber-100 dark:bg-amber-900/30"
 }`}>
 {comparisonData.vsLastWeek.isPositive ? (
 <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
 </svg>
 ) : (
 <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6 6" />
 </svg>
 )}
 </div>
 </div>
 <div className="border-t border-zinc-100 dark:border-zinc-800" />
 <div className="flex items-start gap-4">
 <div className="flex min-w-0 flex-1 flex-col">
 <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
 vs last month
 </p>
 <p className={`mt-1 text-2xl font-bold tabular-nums ${
 comparisonData.vsLastMonth.isPositive
 ? "text-emerald-600 dark:text-emerald-400"
 : "text-amber-600 dark:text-amber-400"
 }`}>
 {comparisonData.vsLastMonth.value}
 </p>
 <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-snug">
 {comparisonData.vsLastMonth.label}
 </p>
 </div>
 <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
 comparisonData.vsLastMonth.isPositive
 ? "bg-emerald-100 dark:bg-emerald-900/30"
 : "bg-amber-100 dark:bg-amber-900/30"
 }`}>
 {comparisonData.vsLastMonth.isPositive ? (
 <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
 </svg>
 ) : (
 <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6 6" />
 </svg>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>

 {behaviourInsights.length > 0 && (
 <div>
 <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
 Habits & insights
 </p>
 <div className="space-y-2">
 {behaviourInsights.map((insight) => (
 <BehaviourInsightCard
 key={insight.id}
 text={insight.text}
 />
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 )}
 </CollapsibleAppliance>
 );
 })}
 </div>
 </div>
 );
}
