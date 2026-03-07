"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
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
  behaviourSummaries,
  spikeEventsMap,
  comparisonDataMap,
  behaviourInsightsMap,
} from "./mockData";

const VALID_ROOMS = ["master-room", "room-1", "room-2", "living-room"];

export default function RoomAirconPage() {
  const params = useParams();
  const roomSlug = params.room as string;

  const [timeRange, setTimeRange] = useState<TimeRangeOption>("week");

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
  const behaviourSummary = behaviourSummaries[roomSlug];
  const spikeEvents = spikeEventsMap[roomSlug] ?? [];
  const comparisonData = comparisonDataMap[roomSlug];
  const behaviourInsights = behaviourInsightsMap[roomSlug] ?? [];

  const chartData =
    timeRange === "day"
      ? usageTimeSeriesDay
      : timeRange === "week"
        ? usageTimeSeriesWeek
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
              Air conditioner usage insights
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

      {/* Appliance status card */}
      <section className="mb-6">
        <StatusSummaryCard
          status={room.status}
          temperature={room.temperature}
          runtimeTodayHours={room.runtimeTodayHours}
          energyTodayKwh={room.energyTodayKwh}
        />
      </section>

      {/* Time range toggle */}
      <section className="mb-6">
        <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          View by
        </p>
        <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
      </section>

      {/* Usage Behaviour Dashboard */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Usage Behaviour
        </h2>
        <UsageBehaviourChart
          data={chartData}
          title="Energy usage over time"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <BehaviourSummaryCard
            label="Most common usage time"
            value={behaviourSummary.mostCommonUsageTime}
          />
          <BehaviourSummaryCard
            label="Longest runtime period"
            value={behaviourSummary.longestRuntimePeriod}
          />
          <BehaviourSummaryCard
            label="Highest usage day"
            value={behaviourSummary.highestUsageDay}
          />
          <BehaviourSummaryCard
            label="Average daily runtime"
            value={behaviourSummary.avgDailyRuntime}
          />
        </div>
      </section>

      {/* Spike Explanation */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Spike Explanation
        </h2>
        <p className="mb-3 text-sm text-[#666666] dark:text-zinc-400">
          When usage spiked and what caused it
        </p>
        <div className="flex flex-col gap-3">
          {spikeEvents.length > 0 ? (
            spikeEvents.map((spike) => (
              <SpikeDetailCard
                key={spike.id}
                dateTime={spike.dateTime}
                room={spike.room}
                appliance={spike.appliance}
                magnitude={spike.magnitude}
                cause={spike.cause}
              />
            ))
          ) : (
            <p className="rounded-xl border border-[#86CCD2]/30 bg-white px-4 py-6 text-center text-sm text-[#666666] dark:border-[#86CCD2]/20 dark:bg-zinc-900 dark:text-zinc-400">
              No spikes recorded in this period
            </p>
          )}
        </div>
      </section>

      {/* Comparison section */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Comparison
        </h2>
        <p className="mb-3 text-sm text-[#666666] dark:text-zinc-400">
          Your usage vs benchmarks
        </p>
        <div className="flex flex-col gap-3">
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
          <ComparisonInsightCard
            label={comparisonData.vsDistrictAvg.label}
            value={comparisonData.vsDistrictAvg.value}
            isPositive={comparisonData.vsDistrictAvg.isPositive}
          />
          <ComparisonInsightCard
            label={comparisonData.vsSingaporeAvg.label}
            value={comparisonData.vsSingaporeAvg.value}
            isPositive={comparisonData.vsSingaporeAvg.isPositive}
          />
        </div>
      </section>

      {/* Habits and Behaviour Insights */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Habits & Behaviour Insights
        </h2>
        <p className="mb-3 text-sm text-[#666666] dark:text-zinc-400">
          Patterns from your usage
        </p>
        <div className="flex flex-col gap-3">
          {behaviourInsights.map((insight) => (
            <BehaviourInsightCard key={insight.id} text={insight.text} />
          ))}
        </div>
      </section>
    </div>
  );
}
