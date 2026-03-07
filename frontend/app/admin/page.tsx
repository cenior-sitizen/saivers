export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Desktop-first view for ClickHouse data analytics
        </p>
      </div>

      {/* Placeholder for ClickHouse data - desktop-optimized grid */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Energy Consumption
          </h3>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            —
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Connect ClickHouse to display data
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Savings Overview
          </h3>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            —
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Connect ClickHouse to display data
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Device Status
          </h3>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            —
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Connect ClickHouse to display data
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-zinc-500 dark:text-zinc-400">
          Data visualization area — integrate with ClickHouse backend
        </p>
      </div>
    </div>
  );
}
