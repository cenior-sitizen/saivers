import Link from "next/link";

export default function ProfilePage() {
  return (
    <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Profile
      </h1>
      <p className="mt-2 text-sm text-[#666666] dark:text-zinc-400">
        Manage your account and preferences.
      </p>
      <Link
        href="/user/settings"
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#86CCD2]/40 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:border-[#86CCD2] dark:border-[#86CCD2]/30 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-[#86CCD2]/60"
      >
        Settings
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
