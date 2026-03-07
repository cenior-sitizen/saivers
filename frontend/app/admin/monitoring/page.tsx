export default function MonitoringPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Monitoring
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Real-time energy monitoring and trend analysis across regions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Current Regional Load
          </h3>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            —
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Live usage by region
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Peak Windows
          </h3>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            —
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Highest-demand time slots
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Trend Summary
          </h3>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            —
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Compare to baseline
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-zinc-500 dark:text-zinc-400">
          Real-time trend chart area — connect ClickHouse for live data
        </p>
      </div>
    </div>
  );
}
