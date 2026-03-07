import Link from "next/link";

export default function Home() {
 return (
 <div className="flex min-h-screen flex-col items-center justify-center px-4">
 <main className="flex w-full max-w-sm flex-col items-center gap-8">
 {/* Hero wordmark */}
 <div className="fade-in flex flex-col items-center gap-5 text-center">
 {/* Brand mark */}
 <div className="relative">
 <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#86CCD2] via-[#00A3AD] to-[#007B8A] shadow-[0_20px_50px_rgba(0,123,138,0.36)]">
 <svg
 className="h-10 w-10 text-white"
 fill="currentColor"
 viewBox="0 0 24 24"
 >
 <path d="M13 10V3L4 14h7v7l9-11h-7z" />
 </svg>
 </div>
 {/* Tidal ring glow */}
 <div className="absolute -inset-3 rounded-[38px] border border-[#86CCD2]/20" />
 </div>

 <div>
 <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-[#10363b]">
 Saivers
 </h1>
 <p className="mt-1.5 text-sm font-medium text-[#4d6b70]">
 AI Energy Coach · SP Group
 </p>
 </div>

 {/* SP Group attribution pill */}
 <div className="flex items-center gap-2 rounded-full border border-[rgba(134,204,210,0.40)] bg-[rgba(251,254,254,0.90)] px-4 py-1.5 shadow-[0_4px_16px_rgba(0,123,138,0.08)] backdrop-blur-sm">
 <span className="h-2 w-2 rounded-full bg-gradient-to-br from-[#86CCD2] to-[#007B8A]" />
 <span className="text-[11px] font-semibold tracking-wide text-[#007B8A]">
 Powered by SP Group
 </span>
 </div>
 </div>

 {/* Portal cards */}
 <div className="card-enter delay-1 flex w-full flex-col gap-3">
 {/* User portal */}
 <Link
 href="/user"
 className="group relative overflow-hidden rounded-2xl border border-[rgba(134,204,210,0.55)] bg-gradient-to-br from-[rgba(255,255,255,0.96)] to-[rgba(243,249,249,0.94)] px-5 py-4 shadow-[0_8px_28px_rgba(0,74,82,0.10)] backdrop-blur-sm transition-all duration-200 hover:border-[#86CCD2] hover:shadow-[0_14px_40px_rgba(0,123,138,0.18)] active:scale-[0.98]"
 >
 <div
 className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
 style={{
 background:
 "linear-gradient(135deg, rgba(134,204,210,0.10) 0%, transparent 60%)",
 }}
 />
 <div className="relative flex items-center gap-4">
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#86CCD2]/30 to-[#007B8A]/20 transition-all duration-200 group-hover:shadow-[0_6px_16px_rgba(0,123,138,0.22)]">
 <svg
 className="h-6 w-6 text-[#007B8A]"
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
 <div className="flex-1 text-left">
 <p className="font-display font-bold text-[#10363b]">
 Resident View
 </p>
 <p className="text-xs text-[#4d6b70]">
 Mobile · Energy coach · Rewards
 </p>
 </div>
 <svg
 className="h-4 w-4 text-[#86CCD2] transition-transform duration-200 group-hover:translate-x-1"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2.5}
 d="M9 5l7 7-7 7"
 />
 </svg>
 </div>
 </Link>

 {/* Admin portal */}
 <Link
 href="/admin"
 className="group relative overflow-hidden rounded-2xl border border-[rgba(10,95,105,0.30)] bg-gradient-to-br from-[#0a5f69] to-[#0d4850] px-5 py-4 shadow-[0_8px_28px_rgba(0,74,82,0.20)] transition-all duration-200 hover:shadow-[0_14px_40px_rgba(0,74,82,0.30)] active:scale-[0.98]"
 >
 {/* Grid texture */}
 <div
 className="pointer-events-none absolute inset-0 opacity-[0.07]"
 style={{
 backgroundImage:
 "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 28px)",
 }}
 />
 <div className="relative flex items-center gap-4">
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-all duration-200 group-hover:bg-white/15">
 <svg
 className="h-6 w-6 text-[#86CCD2]"
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
 <div className="flex-1 text-left">
 <p className="font-display font-bold text-white">
 Grid Operations
 </p>
 <p className="text-xs text-[#86CCD2]/80">
 Desktop · ClickHouse · AI agent
 </p>
 </div>
 <svg
 className="h-4 w-4 text-[#86CCD2]/60 transition-transform duration-200 group-hover:translate-x-1"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2.5}
 d="M9 5l7 7-7 7"
 />
 </svg>
 </div>
 </Link>
 </div>

 {/* Footer */}
 <p className="fade-in delay-2 text-[11px] text-[#6f8c91]">
 Demo · SP Group × Saivers · 2025
 </p>
 </main>
 </div>
 );
}
