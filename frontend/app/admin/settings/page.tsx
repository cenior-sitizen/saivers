export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Admin Settings
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Configure admin preferences and system options
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-amber-800 dark:text-amber-200">
          <strong>Note:</strong> This is to demo subpages, edit accordingly.
        </p>
      </div>
    </div>
  );
}
