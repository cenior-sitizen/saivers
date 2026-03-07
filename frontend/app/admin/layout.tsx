import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Energy Savings
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/settings"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Settings
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
            >
              ← Home
            </Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
