import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <main className="flex w-full max-w-md flex-col items-center gap-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Energy Savings
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Select your view to get started
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-6 py-4 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <svg
                  className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Admin View
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Desktop-first • ClickHouse data
                </p>
              </div>
            </div>
            <svg
              className="h-5 w-5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>

          <Link
            href="/user"
            className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-6 py-4 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-700 dark:hover:bg-sky-950/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/50">
                <svg
                  className="h-5 w-5 text-sky-600 dark:text-sky-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  User View
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Mobile-first • Room controls
                </p>
              </div>
            </div>
            <svg
              className="h-5 w-5 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>

        <Link
          href="/design-system"
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline underline-offset-2"
        >
          Design System
        </Link>
      </main>
    </div>
  );
}
