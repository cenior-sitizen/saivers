import Link from "next/link";
import { SummaryCard } from "@/components/SummaryCard";
import { ComparisonCard } from "@/components/ComparisonCard";
import { RoomUsageCard } from "@/components/RoomUsageCard";
import { UsageChart } from "@/components/UsageChart";
import { SpikeCard } from "@/components/SpikeCard";
import { InsightCard } from "@/components/InsightCard";
import { RecommendationCard } from "@/components/RecommendationCard";
import {
  summaryMetrics,
  weeklyComparison,
  roomUsageData,
  chartData,
  spikeEvents,
  savingsInsight,
  recommendations,
} from "./mockData";
import { fetchImpactData } from "@/lib/aircon-data";

export default async function AirconImpactScreen() {
  const apiData = await fetchImpactData();
  return (
    <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/user"
          className="mb-2 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to My Home
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Aircon Impact
        </h1>
        <p className="mt-1 text-sm text-[#666666] dark:text-zinc-400">
          Understand usage, compare trends, and spot savings opportunities
        </p>
      </div>

      {/* Weekly summary cards */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          {(apiData?.summary
            ? [
                {
                  label: "Total Aircon Usage This Week",
                  value: `${apiData.summary.totalKwhThisWeek} kWh`,
                },
                {
                  label: "Estimated Cost This Week",
                  value: apiData.summary.costThisWeek,
                },
                ...summaryMetrics.slice(2),
              ]
            : summaryMetrics
          ).map((metric) => (
            <SummaryCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
      </section>

      {/* This Week vs Last Week */}
      <section className="mb-6">
        <ComparisonCard
          thisWeek={apiData?.weeklyComparison?.thisWeek ?? weeklyComparison.thisWeek}
          lastWeek={apiData?.weeklyComparison?.lastWeek ?? weeklyComparison.lastWeek}
          percentChange={apiData?.weeklyComparison?.percentChange ?? weeklyComparison.percentChange}
          thisWeekCost={apiData?.weeklyComparison?.thisWeekCost ?? weeklyComparison.thisWeekCost}
          lastWeekCost={apiData?.weeklyComparison?.lastWeekCost ?? weeklyComparison.lastWeekCost}
        />
      </section>

      {/* Room-by-room breakdown */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Room-by-room breakdown
        </h2>
        <div className="flex flex-col gap-3">
          {(apiData?.roomUsageData?.length ? apiData.roomUsageData : roomUsageData).map((room) => (
            <RoomUsageCard
              key={room.id}
              name={room.name}
              status={room.status}
              usageKwh={room.usageKwh}
              percentOfTotal={room.percentOfTotal}
              runtimeHours={room.runtimeHours}
              avgTempC={room.avgTempC}
              trendNote={room.trendNote}
            />
          ))}
        </div>
      </section>

      {/* Usage trend chart */}
      <section className="mb-6">
        <UsageChart
          data={
            apiData?.chartData?.length
              ? apiData.chartData
              : chartData
          }
          title="Weekly Usage Trend"
        />
      </section>

      {/* Spike highlights */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Spike highlights
        </h2>
        <div className="flex flex-col gap-2">
          {spikeEvents.map((event) => (
            <SpikeCard
              key={event.id}
              time={event.time}
              description={event.description}
            />
          ))}
        </div>
      </section>

      {/* Savings insight */}
      <section className="mb-6">
        <InsightCard
          savedThisWeek={savingsInsight.savedThisWeek}
          projectedMonthly={savingsInsight.projectedMonthly}
        />
      </section>

      {/* Recommendation cards */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Recommendations
        </h2>
        <div className="flex flex-col gap-3">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              title={rec.title}
              description={rec.description}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
