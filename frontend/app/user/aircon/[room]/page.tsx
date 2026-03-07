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
import { ComparisonInsightCard } from "@/components/ComparisonInsightCard";
import { BehaviourInsightCard } from "@/components/BehaviourInsightCard";
import { BehaviourSummaryCard } from "@/components/BehaviourSummaryCard";
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

const VALID_ROOMS = ["master-room", "room-1", "room-2", "living-room"];

export default function RoomAirconPage() {
  const params = useParams();
  const roomSlug = params.room as string;

  const [timeRange, setTimeRange] = useState<TimeRangeOption>("week");
  const [apiData, setApiData] = useState<{
    today?: { energyKwh: number; runtimeHours: number; status: string; temperature: number };
    usageDay?: { time: string; value: number; isOn: boolean }[];
    usageWeek?: { time: string; value: number; isOn: boolean }[];
    vsLastWeek?: { thisWeekKwh: number; lastWeekKwh: number; percentChange: number };
  } | null>(null);

  useEffect(() => {
    if (!roomSlug || !VALID_ROOMS.includes(roomSlug)) return;
    fetch(`/api/aircon/room/${roomSlug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setApiData(data))
      .catch(() => {});
  }, [roomSlug]);

  if (!roomSlug || !VALID_ROOMS.includes(roomSlug)) {
    return (
      <div className="px-4 py-6">
        <p className="text-zinc-600">Room not found.</p>
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
    <div className="min-h-screen bg-[#F3F9F9] px-4 pb-20 dark:bg-zinc-950 sm:mx-auto sm:max-w-md sm:px-0">
      {/* Header */}
      <div className="mb-6 pt-2">
        <Link
          href="/user"
          className="mb-2 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to My Home
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {room.name}
            </h1>
            <p className="mt-1 text-sm text-[#666666] dark:text-zinc-400">
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

          return (
            <CollapsibleAppliance
              key={appliance.id}
              id={appliance.id}
              name={appliance.name}
              image={appliance.image}
              status={applianceData.status}
              defaultOpen={appliance.id === "ac"}
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
                  <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    View by
                  </p>
                  <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
                </div>

                {/* Chart with Your vs 28 districts vs Singapore lines */}
                <UsageBehaviourChart
                  data={chartData}
                  title="Energy usage: You vs 28 districts vs Singapore"
                />

                {/* Behaviour summary - right below chart */}
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

                {/* Spike + Comparison + Insights - grouped together */}
                <div className="space-y-3 rounded-xl border border-[#86CCD2]/20 bg-[#F3F9F9]/50 p-3 dark:border-[#86CCD2]/10 dark:bg-[#86CCD2]/5">
                  {spikeEvents.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
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
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
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

                  {behaviourInsights.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
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
            </CollapsibleAppliance>
          );
        })}
      </div>
    </div>
  );
}
