export default function InvestigationPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          AI Assistant
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Ask questions about energy data, anomalies, and regions — powered by ClickHouse and LibreChat
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Natural language queries
        </h3>
        <p className="mt-2 text-zinc-900 dark:text-zinc-50">
          e.g. &quot;Why is Jurong East showing an unusual spike since 6pm?&quot;
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Summarise anomalies, compare regions, generate incident briefs
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-zinc-500 dark:text-zinc-400">
          Chat / LibreChat integration panel — connect AI assistant
        </p>
      </div>
    </div>
  );
}
