"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { TimeRangeToggle, type TimeRangeOption } from "@/components/TimeRangeToggle";
import { UsageBehaviourChart } from "@/components/UsageBehaviourChart";
import { useHousehold } from "@/context/HouseholdContext";
import {
  roomDataMap,
  usageTimeSeriesDay,
  usageTimeSeriesWeek,
  behaviourInsightsMap,
  spikeEventsByAppliance,
} from "./mockData";

const VALID_ROOMS = ["master-room", "room-1", "room-2", "living-room"];

interface ApprovedInsight {
  insight_id: string;
  notification_title: string;
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
            <p className="text-sm font-semibold text-emerald-800">Recommendation applied</p>
            {start_time && (
              <p className="mt-0.5 text-xs text-emerald-700">
                AC scheduled {start_time}–{end_time} at {temp_c}°C
              </p>
            )}
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="shrink-0 text-emerald-400 hover:text-emerald-600">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function RoomAirconPage() {
  const params = useParams();
  const roomSlug = params.room as string;
  const { householdId } = useHousehold();

  const [timeRange, setTimeRange] = useState<TimeRangeOption>("week");
  const [apiData, setApiData] = useState<{
    today?: { energyKwh: number; runtimeHours: number; status: string; temperature: number };
    charts?: { day: { time: string; value: number; isOn: boolean }[]; week: { time: string; value: number; isOn: boolean }[] };
    behaviourSummary?: { avgDailyKwh: number; avgDailyRuntimeH: number; peakHourRange: string; highestWeekday: string } | null;
    spEnergy?: { thisWeekKwh: number; lastWeekKwh: number; thisWeekCostSgd: number; vsLastWeekPct: number };
  } | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  useEffect(() => {
    if (!roomSlug || !VALID_ROOMS.includes(roomSlug)) return;
    fetch(`/api/aircon/household/${householdId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setApiData(data);
      })
      .catch(() => {});
    fetch(`/api/aircon/behaviour-insights/${householdId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.insights)) setAiInsights(data.insights);
      })
      .catch(() => {});
  }, [roomSlug, householdId]);

  if (!roomSlug || !VALID_ROOMS.includes(roomSlug)) {
    return (
      <div className="px-4 py-6">
        <p className="text-[#4d6b70]">Room not found.</p>
        <Link href="/user" className="mt-4 text-[#86CCD2] underline">Back to My Home</Link>
      </div>
    );
  }

  const room = roomDataMap[roomSlug];
  const spEnergy = apiData?.spEnergy;
  const today = apiData?.today;
  const beh = apiData?.behaviourSummary;
  const spikeEvents = spikeEventsByAppliance[roomSlug]?.ac ?? [];
  const insights =
    aiInsights.length > 0
      ? aiInsights
      : (behaviourInsightsMap[roomSlug] ?? []).map((i) => i.text);

  const chartData =
    timeRange === "day"
      ? (apiData?.charts?.day?.length ? apiData.charts.day : usageTimeSeriesDay)
      : (apiData?.charts?.week?.length ? apiData.charts.week : usageTimeSeriesWeek);

  const weekCost = spEnergy ? spEnergy.thisWeekCostSgd : null;
  const vsLastWeek = spEnergy?.vsLastWeekPct ?? null;

  return (
    <div className="min-h-screen px-4 pb-28 pt-2 sm:mx-auto sm:max-w-md sm:px-0">
      {/* Header */}
      <div className="mb-5">
        <Link href="/user" className="mb-2 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-[#10363b]">
          ← My Home
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#10363b]">{room.name}</h1>
          <Image src="/midea-aircon.png" alt="Air conditioner" width={64} height={48} className="object-contain" />
        </div>
      </div>

      {/* Approved insight banner */}
      <ApprovedInsightBanner householdId={householdId} />

      {/* ── Air Conditioner ── */}
      <section className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#007B8A]">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-[#10363b]">Air Conditioner</h2>
          {today && (
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              today.status === "On" ? "bg-emerald-50 text-emerald-700" : "bg-[rgba(207,228,230,0.40)] text-[#6f8c91]"
            }`}>
              {today.status}
            </span>
          )}
        </div>

        <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
          {/* Cost + trend */}
          <div className="px-5 pb-4 pt-5">
            <p className="text-xs font-medium text-[#6f8c91]">This week&apos;s cost</p>
            <div className="mt-1 flex items-end gap-3">
              <p className="text-3xl font-bold text-[#10363b]">
                {weekCost != null ? `S$${weekCost.toFixed(2)}` : "—"}
              </p>
              {vsLastWeek != null && (
                <span className={`mb-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  vsLastWeek <= 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {vsLastWeek <= 0 ? "↓" : "↑"} {Math.abs(vsLastWeek)}% vs last week
                </span>
              )}
            </div>

            {/* Habit pills */}
            {(today || beh) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {today && (
                  <span className="rounded-full border border-[rgba(157,207,212,0.40)] bg-white px-3 py-1 text-xs text-[#4d6b70]">
                    {today.temperature}°C · {today.runtimeHours}h today
                  </span>
                )}
                {beh?.peakHourRange && (
                  <span className="rounded-full border border-[rgba(157,207,212,0.40)] bg-white px-3 py-1 text-xs text-[#4d6b70]">
                    Busiest {beh.peakHourRange}
                  </span>
                )}
                {beh?.highestWeekday && (
                  <span className="rounded-full border border-[rgba(157,207,212,0.40)] bg-white px-3 py-1 text-xs text-[#4d6b70]">
                    Highest on {beh.highestWeekday}s
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="border-t border-[rgba(157,207,212,0.20)] px-4 pb-4 pt-3">
            <div className="mb-3">
              <TimeRangeToggle
                value={timeRange}
                onChange={setTimeRange}
              />
            </div>
            <UsageBehaviourChart data={chartData} />
          </div>
        </div>
      </section>

      {/* ── Tips ── */}
      {(spikeEvents.length > 0 || insights.length > 0) && (
        <section className="mb-5">
          <h2 className="mb-3 text-sm font-semibold text-[#10363b]">Tips for this room</h2>
          <div className="space-y-2">
            {spikeEvents.slice(0, 2).map((spike, i) => (
              <div key={i} className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <svg className="h-3.5 w-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#4d6b70]">
                    {spike.explanation ?? spike.cause}
                  </p>
                </div>
              </div>
            ))}
            {insights.slice(0, spikeEvents.length > 0 ? 1 : 2).map((text, i) => (
              <div key={i} className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(134,204,210,0.20)]">
                    <svg className="h-3.5 w-3.5 text-[#007B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#4d6b70]">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Dehumidifier (coming soon) ── */}
      <section className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[rgba(207,228,230,0.40)]">
            <svg className="h-4 w-4 text-[#9bb5b9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1M4.22 4.22l.707.707m12.02 12.02l.707.707M1 12h1m20 0h1M4.22 19.78l.707-.707M18.95 5.05l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-[#9bb5b9]">Dehumidifier</h2>
          <span className="ml-auto rounded-full border border-[rgba(157,207,212,0.30)] px-2.5 py-0.5 text-[10px] font-medium text-[#9bb5b9]">
            Coming soon
          </span>
        </div>
        <div className="rounded-2xl border border-[rgba(157,207,212,0.20)] bg-[rgba(243,249,249,0.40)] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(207,228,230,0.30)]">
              <svg className="h-5 w-5 text-[#9bb5b9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[#9bb5b9]">Xiaomi Humidifier</p>
              <p className="mt-0.5 text-xs text-[#b8cdd0]">
                Energy tracking and smart controls coming in a future update.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
