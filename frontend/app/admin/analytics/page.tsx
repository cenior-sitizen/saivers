export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Analytics
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Data visualisation dashboard — time-series, regional comparison, heatmaps
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Demand Time-Series
          </h3>
          <p className="mt-2 text-zinc-900 dark:text-zinc-50">
            Hourly / half-hourly trends
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Connect ClickHouse for time-series data
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Regional Comparison
          </h3>
          <p className="mt-2 text-zinc-900 dark:text-zinc-50">
            Bar charts, cross-region
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Compare demand across regions
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Heatmaps &amp; Baselines
        </h3>
        <p className="mt-2 text-zinc-900 dark:text-zinc-50">
          Hour × region heatmap, baseline vs actual
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Connect ClickHouse for aggregations
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-zinc-500 dark:text-zinc-400">
          Chart area — integrate with ClickHouse analytics
        </p>
      </div>
    </div>
  );
}
