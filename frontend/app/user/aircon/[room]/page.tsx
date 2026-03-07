"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { CollapsibleAppliance } from "@/components/CollapsibleAppliance";
import { StatusSummaryCard } from "@/components/StatusSummaryCard";
import {
  TimeRangeToggle,
  type TimeRangeOption,
} from "@/components/TimeRangeToggle";
import { UsageBehaviourChart } from "@/components/UsageBehaviourChart";
import { SpikeDetailCard } from "@/components/SpikeDetailCard";
import { ComparisonInsightCard } from "@/components/ComparisonInsightCard";
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
  recommendation: {
    action: string;
    start_time?: string;
    end_time?: string;
    temp_c?: number;
  };
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
          (i) =>
            i.status === "approved" &&
            i.recommendation?.action === "ac_schedule",
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
            <svg
              className="h-4 w-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
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
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Maps room URL slug → device_id in ac_readings / device_registry
const ROOM_SLUG_TO_DEVICE_ID: Record<string, string> = {
  "living-room": "ac-living-room",
  "master-room": "ac-master-room",
  "room-1": "ac-room-1",
  "room-2": "ac-room-2",
};

const VALID_ROOMS = ["master-room", "room-1", "room-2", "living-room"];

export default function RoomAirconPage() {
  const params = useParams();
  const roomSlug = params.room as string;
  const { householdId } = useHousehold();

  const [timeRange, setTimeRange] = useState<TimeRangeOption>("week");
  const [deviceRegistry, setDeviceRegistry] = useState<Record<
    string,
    { room: string; brand: string; modelName: string; deviceType: string }
  > | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [apiData, setApiData] = useState<{
    todayLabel?: string;
    today?: {
      energyKwh: number;
      runtimeHours: number;
      status: string;
      temperature: number;
    };
    charts?: {
      day: { time: string; value: number; isOn: boolean }[];
      week: { time: string; value: number; isOn: boolean }[];
      month: { time: string; value: number; isOn: boolean }[];
    };
    behaviourSummary?: {
      avgDailyKwh: number;
      avgDailyRuntimeH: number;
      highestDay: string;
      peakHourRange: string;
      highestWeekday: string;
    } | null;
    spikeEvents?: { datetimeLabel: string; kwh: number; pctAboveAvg: number }[];
    comparisons?: {
      vsLastWeek: {
        thisWeekKwh: number;
        lastWeekKwh: number;
        percentChange: number;
      };
      vsLastMonth: {
        thisWeekKwh: number;
        sameWeekLastMonthKwh: number;
        percentChange: number;
      };
      vsDistrict?: {
        yourWeekKwh: number;
        districtPerHomeWeekKwh: number;
        sgNationalPerHomeWeekKwh: number;
        percentVsDistrict: number;
        percentVsSingapore: number;
      };
    };
    vsLastWeek?: {
      thisWeekKwh: number;
      lastWeekKwh: number;
      percentChange: number;
    };
    spEnergy?: {
      thisWeekKwh: number;
      lastWeekKwh: number;
      thisWeekCostSgd: number;
      thisWeekCarbonKg: number;
      vsLastWeekPct: number;
    };
  } | null>(null);

  // Fetch household AC data, device registry, and AI insights in parallel
  useEffect(() => {
    if (!roomSlug || !VALID_ROOMS.includes(roomSlug)) return;
    fetch(`/api/aircon/household/${householdId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setApiData(data))
      .catch(() => {});
    fetch(`/api/devices/${householdId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.byDeviceId && setDeviceRegistry(data.byDeviceId))
      .catch(() => {});
    setAiInsightsLoading(true);
    fetch(`/api/aircon/behaviour-insights/${householdId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.insights) && data.insights.length > 0) {
          setAiInsights(data.insights);
        }
      })
      .catch(() => {})
      .finally(() => setAiInsightsLoading(false));
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

  // Resolve real AC brand/model from device registry for this room
  const acDeviceId = ROOM_SLUG_TO_DEVICE_ID[roomSlug];
  const acDeviceInfo = acDeviceId ? deviceRegistry?.[acDeviceId] : null;
  const acDisplayName = acDeviceInfo
    ? `${acDeviceInfo.brand} Air Conditioner`
    : null;

  // Build comparison from DB data when available
  const dbVsLastWeek = apiData?.comparisons?.vsLastWeek;
  const dbVsLastMonth = apiData?.comparisons?.vsLastMonth;
  const comparisonData = {
    ...baseComparison,
    vsLastWeek: dbVsLastWeek
      ? {
          label: `Your usage is ${dbVsLastWeek.percentChange >= 0 ? "+" : ""}${dbVsLastWeek.percentChange}% ${dbVsLastWeek.percentChange >= 0 ? "higher" : "lower"} than last week`,
          value: `${dbVsLastWeek.percentChange >= 0 ? "+" : ""}${dbVsLastWeek.percentChange}%`,
          isPositive: dbVsLastWeek.percentChange <= 0,
        }
      : baseComparison.vsLastWeek,
    vsLastMonth: dbVsLastMonth
      ? {
          label: `Your usage is ${dbVsLastMonth.percentChange >= 0 ? "+" : ""}${dbVsLastMonth.percentChange}% vs same week last month`,
          value: `${dbVsLastMonth.percentChange >= 0 ? "+" : ""}${dbVsLastMonth.percentChange}%`,
          isPositive: dbVsLastMonth.percentChange <= 0,
        }
      : baseComparison.vsLastMonth,
  };
  const behaviourInsights =
    aiInsights.length > 0
      ? aiInsights.map((text, i) => ({ id: String(i), text }))
      : (behaviourInsightsMap[roomSlug] ?? []);

  const dbDistrict = apiData?.comparisons?.vsDistrict;

  // Compute efficiency level from avg daily AC kWh
  const avgDailyKwh = apiData?.behaviourSummary?.avgDailyKwh;
  const efficiencyLevel =
    avgDailyKwh == null
      ? undefined
      : avgDailyKwh < 3
        ? ("efficient" as const)
        : avgDailyKwh < 6
          ? ("moderate" as const)
          : ("high" as const);

  // Singapore SP Group residential tariff (S$/kWh)
  const TARIFF_SGD_PER_KWH = 0.292;

  const chartData =
    timeRange === "day"
      ? apiData?.charts?.day?.length
        ? apiData.charts.day
        : usageTimeSeriesDay
      : timeRange === "week"
        ? apiData?.charts?.week?.length
          ? apiData.charts.week
          : usageTimeSeriesWeek
        : apiData?.charts?.month?.length
          ? apiData.charts.month
          : usageTimeSeriesMonth;

  const chartTitle =
    timeRange === "day"
      ? `Energy usage — ${apiData?.todayLabel ?? "Today"}`
      : "Energy usage: You vs 28 districts vs Singapore";

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
            <h1 className="text-2xl font-bold text-[#10363b]">{room.name}</h1>
            {acDeviceInfo ? (
              <p className="mt-1 text-sm text-[#4d6b70]">
                {acDeviceInfo.brand}{" "}
                <span className="text-[#6f8c91]">{acDeviceInfo.modelName}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-[#666666]">
                {room.appliances.length} smart appliance
                {room.appliances.length > 1 ? "s" : ""}
              </p>
            )}
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
              {apiData.spEnergy.thisWeekKwh}{" "}
              <span className="text-xs font-normal text-[#6f8c91]">kWh</span>
            </p>
          </div>
          <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-3 py-3 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
            <p className="text-[10px] font-medium text-[#6f8c91]">
              Weekly Cost
            </p>
            <p className="mt-0.5 text-lg font-bold text-[#10363b]">
              S${apiData.spEnergy.thisWeekCostSgd.toFixed(0)}
            </p>
          </div>
          <div
            className={`rounded-2xl border px-3 py-3 shadow-sm ${
              apiData.spEnergy.vsLastWeekPct > 0
                ? "border-red-200 bg-red-50"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <p className="text-[10px] font-medium text-[#6f8c91]">
              vs Last Week
            </p>
            <p
              className={`mt-0.5 text-lg font-bold ${
                apiData.spEnergy.vsLastWeekPct > 0
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}
            >
              {apiData.spEnergy.vsLastWeekPct > 0 ? "+" : ""}
              {apiData.spEnergy.vsLastWeekPct}%
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

          // For the primary AC, substitute the real brand name from DB
          const displayName =
            appliance.id === "ac" && acDisplayName
              ? acDisplayName
              : appliance.name;

          return (
            <CollapsibleAppliance
              key={appliance.id}
              id={appliance.id}
              name={displayName}
              image={appliance.image}
              status={applianceData.status}
              defaultOpen={appliance.id === "ac"}
              efficiencyLevel={
                appliance.id === "ac" ? efficiencyLevel : undefined
              }
            >
              {/* Unified card: chart + insights together */}
              <div className="space-y-4">
                <StatusSummaryCard
                  status={applianceData.status}
                  temperature={applianceData.temperature}
                  runtimeTodayHours={applianceData.runtimeTodayHours}
                  energyTodayKwh={applianceData.energyTodayKwh}
                />

                {/* View by - inside each appliance */}
                <div>
                  <p className="mb-2 text-sm font-medium text-[#10363b]">
                    View by
                  </p>
                  <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
                </div>

                {/* Peak hour badge — shown when behaviourSummary available */}
                {apiData?.behaviourSummary?.peakHourRange &&
                  timeRange !== "day" && (
                    <div className="flex items-center gap-2 rounded-xl border border-[rgba(157,207,212,0.35)] bg-[rgba(0,163,173,0.06)] px-3 py-2">
                      <span className="text-base">⚡</span>
                      <div>
                        <p className="text-xs font-semibold text-[#10363b]">
                          Peak usage: {apiData.behaviourSummary.peakHourRange}
                        </p>
                        <p className="text-[10px] text-[#6f8c91]">
                          Highest on {apiData.behaviourSummary.highestWeekday}s
                          — consider pre-cooling 30 min earlier
                        </p>
                      </div>
                    </div>
                  )}

                {/* Chart with actual dates from DB */}
                <UsageBehaviourChart data={chartData} title={chartTitle} />

                {/* Behaviour summary — DB data when available, else mock */}
                {(apiData?.behaviourSummary || behaviourSummary) && (
                  <div className="grid grid-cols-2 gap-2">
                    <BehaviourSummaryCard
                      label="Peak usage time"
                      value={
                        apiData?.behaviourSummary?.peakHourRange ??
                        behaviourSummary?.mostCommonUsageTime ??
                        "—"
                      }
                    />
                    <BehaviourSummaryCard
                      label="Avg daily runtime"
                      value={
                        apiData?.behaviourSummary
                          ? `${apiData.behaviourSummary.avgDailyRuntimeH}h/day`
                          : (behaviourSummary?.avgDailyRuntime ?? "—")
                      }
                    />
                    <BehaviourSummaryCard
                      label="Highest usage day"
                      value={
                        apiData?.behaviourSummary?.highestWeekday ??
                        behaviourSummary?.highestUsageDay ??
                        "—"
                      }
                    />
                    <BehaviourSummaryCard
                      label="Avg daily kWh"
                      value={
                        apiData?.behaviourSummary
                          ? `${apiData.behaviourSummary.avgDailyKwh} kWh`
                          : (behaviourSummary?.longestRuntimePeriod ?? "—")
                      }
                    />
                  </div>
                )}

                {/* Spike + Comparison + Insights - grouped together */}
                <div className="space-y-3 rounded-xl border border-[#86CCD2]/20 /50 p-3">
                  {/* What drives your cost callout */}
                  {apiData?.behaviourSummary && (
                    <div className="rounded-xl border border-[rgba(157,207,212,0.30)] bg-gradient-to-b from-[rgba(255,255,255,0.9)] to-[rgba(243,249,249,0.8)] px-4 py-3">
                      <p className="mb-2 text-xs font-semibold text-[#10363b]">
                        What drives your AC cost this week
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6f8c91]">
                            Avg daily consumption
                          </span>
                          <span className="text-xs font-semibold text-[#10363b]">
                            {apiData.behaviourSummary.avgDailyKwh} kWh{" "}
                            <span className="font-normal text-[#6f8c91]">
                              ≈ S$
                              {(
                                apiData.behaviourSummary.avgDailyKwh *
                                TARIFF_SGD_PER_KWH
                              ).toFixed(2)}
                              /day
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6f8c91]">
                            Avg daily runtime
                          </span>
                          <span className="text-xs font-semibold text-[#10363b]">
                            {apiData.behaviourSummary.avgDailyRuntimeH}h/day
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6f8c91]">
                            Busiest time
                          </span>
                          <span className="text-xs font-semibold text-[#10363b]">
                            {apiData.behaviourSummary.peakHourRange}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6f8c91]">
                            Highest usage day
                          </span>
                          <span className="text-xs font-semibold text-[#10363b]">
                            {apiData.behaviourSummary.highestWeekday}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Spike events from DB */}
                  {(apiData?.spikeEvents ?? spikeEvents).length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-[#10363b]">
                        Spike explanation
                      </p>
                      <div className="space-y-2">
                        {apiData?.spikeEvents?.length
                          ? apiData.spikeEvents.map((spike, i) => (
                              <SpikeDetailCard
                                key={i}
                                dateTime={spike.datetimeLabel}
                                room={room.name}
                                appliance="Air Conditioner"
                                magnitude={`+${spike.pctAboveAvg}%`}
                                cause={`${spike.kwh} kWh — ${spike.pctAboveAvg}% above average`}
                                estimatedCostSgd={
                                  spike.kwh * TARIFF_SGD_PER_KWH
                                }
                              />
                            ))
                          : spikeEvents.map((spike) => (
                              <SpikeDetailCard
                                key={spike.id}
                                dateTime={spike.dateTime}
                                room={spike.room}
                                appliance={spike.appliance}
                                magnitude={spike.magnitude}
                                cause={spike.cause}
                              />
                            ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-semibold text-[#10363b]">
                      vs last week / month
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <ComparisonInsightCard
                        label={comparisonData.vsLastWeek.label}
                        value={comparisonData.vsLastWeek.value}
                        isPositive={comparisonData.vsLastWeek.isPositive}
                      />
                      <ComparisonInsightCard
                        label={comparisonData.vsLastMonth.label}
                        value={comparisonData.vsLastMonth.value}
                        isPositive={comparisonData.vsLastMonth.isPositive}
                      />
                    </div>
                  </div>

                  {dbDistrict && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-[#10363b]">
                        vs district &amp; Singapore
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <ComparisonInsightCard
                          label={`${dbDistrict.percentVsDistrict >= 0 ? "+" : ""}${dbDistrict.percentVsDistrict}% vs Punggol avg`}
                          value={`${dbDistrict.percentVsDistrict >= 0 ? "+" : ""}${dbDistrict.percentVsDistrict}%`}
                          isPositive={dbDistrict.percentVsDistrict <= 0}
                        />
                        <ComparisonInsightCard
                          label={`${dbDistrict.percentVsSingapore >= 0 ? "+" : ""}${dbDistrict.percentVsSingapore}% vs Singapore avg`}
                          value={`${dbDistrict.percentVsSingapore >= 0 ? "+" : ""}${dbDistrict.percentVsSingapore}%`}
                          isPositive={dbDistrict.percentVsSingapore <= 0}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-semibold text-[#10363b]">
                      Habits & insights
                      {aiInsightsLoading && (
                        <span className="ml-2 text-[10px] font-normal text-[#6f8c91]">
                          generating…
                        </span>
                      )}
                    </p>
                    {behaviourInsights.length > 0 ? (
                      <div className="space-y-2">
                        {behaviourInsights.map((insight) => (
                          <BehaviourInsightCard
                            key={insight.id}
                            text={insight.text}
                          />
                        ))}
                      </div>
                    ) : aiInsightsLoading ? (
                      <div className="h-16 animate-pulse rounded-xl bg-[rgba(157,207,212,0.15)]" />
                    ) : null}
                  </div>
                </div>
              </div>
            </CollapsibleAppliance>
          );
        })}
      </div>
    </div>
  );
}
