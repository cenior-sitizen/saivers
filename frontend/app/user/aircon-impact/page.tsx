import Link from "next/link";
import { SummaryCard } from "@/components/SummaryCard";
import { ComparisonCard } from "@/components/ComparisonCard";
import { TopRecommendationCard } from "./TopRecommendationCard";
import { AirconImpactWidgets } from "./AirconImpactWidgets";
import { fetchImpactData } from "@/lib/aircon-data";

export default async function AirconImpactScreen() {
  let apiData;
  try {
    apiData = await fetchImpactData();
  } catch {
    return (
      <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
        <Link
          href="/user"
          className="mb-2 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to My Home
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Unable to load data. Ensure ClickHouse is configured (CLICKHOUSE_ENABLED=true and credentials in .env).
          </p>
        </div>
      </div>
    );
  }

  const summaryMetrics = [
    { label: "Total Aircon Usage This Week", value: `${apiData.summary.totalKwhThisWeek} kWh` },
    { label: "Estimated Cost This Week", value: apiData.summary.costThisWeek },
    { label: "Saved This Week", value: apiData.summary.savedThisWeekLabel },
    { label: "Projected Monthly Savings", value: apiData.summary.projectedMonthlySavings },
  ];

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

      {/* 1. Top recommendation — saves the most */}
      <section className="mb-6">
        <TopRecommendationCard
          recommendation={
            [...apiData.recommendations].sort(
              (a, b) =>
                ((a as { savingsRank?: number }).savingsRank ?? 99) -
                ((b as { savingsRank?: number }).savingsRank ?? 99)
            )[0] ?? apiData.recommendations[0]
          }
        />
      </section>

      {/* 2. The 5 cards */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          {summaryMetrics.map((metric) => (
            <SummaryCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
        <div className="mt-6">
          <ComparisonCard
            thisWeek={apiData.weeklyComparison.thisWeek}
            lastWeek={apiData.weeklyComparison.lastWeek}
            percentChange={apiData.weeklyComparison.percentChange}
            thisWeekCost={apiData.weeklyComparison.thisWeekCost}
            lastWeekCost={apiData.weeklyComparison.lastWeekCost}
          />
        </div>
      </section>

      {/* Customizable widgets */}
      <AirconImpactWidgets
        roomUsageData={apiData.roomUsageData}
        spikeEvents={apiData.spikeEvents}
        recommendations={apiData.recommendations}
      />
    </div>
  );
}
