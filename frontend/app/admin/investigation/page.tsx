export default function InvestigationPage() {
  const chatUrl =
    process.env.NEXT_PUBLIC_LIBRECHAT_URL || "http://localhost:3080";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          AI Assistant
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Ask questions about energy data, anomalies, and regions — powered by
          ClickHouse and LibreChat
        </p>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        style={{ minHeight: "calc(100vh - 14rem)" }}
      >
        <iframe
          src={chatUrl}
          className="h-[calc(100vh-14rem)] w-full border-0"
          title="AI Assistant"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
