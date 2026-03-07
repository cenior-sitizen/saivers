export default function UserSettingsPage() {
  return (
    <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your preferences and device options
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Note:</strong> This is to demo subpages, edit accordingly.
        </p>
      </div>
    </div>
  );
}
