"use client";

import { useEffect, useState } from "react";
import { useHousehold } from "@/context/HouseholdContext";

interface RewardsData {
 points_balance: number;
 points_to_next_voucher: number;
 vouchers_available: number;
 can_redeem: boolean;
 voucher_value_sgd: number;
 voucher_threshold: number;
 redeemed_vouchers: { label: string; redeemed_at: string }[];
 history: { date: string; points: number; reason: string }[];
}

function RadialProgress({ value, max }: { value: number; max: number }) {
 const pct = Math.min(value / max, 1);
 const r = 80;
 const cx = 100;
 const cy = 100;
 // Arc spans 240 degrees (from 150° to 390°/30°)
 const startAngle = 150;
 const sweepAngle = 240;
 const toRad = (deg: number) => (deg * Math.PI) / 180;
 const arcX = (angle: number) => cx + r * Math.cos(toRad(angle));
 const arcY = (angle: number) => cy + r * Math.sin(toRad(angle));

 function describeArc(startDeg: number, endDeg: number) {
 const s = { x: arcX(startDeg), y: arcY(startDeg) };
 const e = { x: arcX(endDeg), y: arcY(endDeg) };
 const large = endDeg - startDeg > 180 ? 1 : 0;
 return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
 }

 const trackEnd = startAngle + sweepAngle;
 const fillEnd = startAngle + sweepAngle * pct;

 return (
 <svg viewBox="0 0 200 200" className="w-full max-w-[220px]" aria-hidden="true">
 {/* Track */}
 <path
 d={describeArc(startAngle, trackEnd)}
 fill="none"
 stroke="#E8F6F7"
 strokeWidth="12"
 strokeLinecap="round"
 />
 {/* Fill */}
 {pct > 0 && (
 <path
 d={describeArc(startAngle, fillEnd)}
 fill="none"
 stroke="url(#arcGrad)"
 strokeWidth="12"
 strokeLinecap="round"
 className="transition-all duration-1000 ease-out"
 />
 )}
 <defs>
 <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
 <stop offset="0%" stopColor="#86CCD2" />
 <stop offset="100%" stopColor="#6BB5BC" />
 </linearGradient>
 </defs>
 {/* Dot at end of fill */}
 {pct > 0.02 && (
 <circle
 cx={arcX(fillEnd)}
 cy={arcY(fillEnd)}
 r="7"
 fill="#86CCD2"
 className="transition-all duration-1000 ease-out"
 />
 )}
 {/* Start/end labels */}
 <text x={arcX(startAngle)} y={arcY(startAngle) + 16} textAnchor="middle" fontSize="10" fill="#94a3b8">0</text>
 <text x={arcX(trackEnd)} y={arcY(trackEnd) + 16} textAnchor="middle" fontSize="10" fill="#94a3b8">{max}</text>
 </svg>
 );
}

function formatDate(dateStr: string): string {
 try {
 const d = new Date(dateStr);
 return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
 } catch {
 return dateStr;
 }
}

export default function RewardsPage() {
 const { householdId, persona } = useHousehold();
 const [data, setData] = useState<RewardsData | null>(null);
 const [streak, setStreak] = useState<number | null>(null);
 const [loading, setLoading] = useState(true);
 const [redeeming, setRedeeming] = useState(false);
 const [redeemMsg, setRedeemMsg] = useState<string | null>(null);

 useEffect(() => {
 setLoading(true);
 setData(null);
 setStreak(null);
 setRedeemMsg(null);
 Promise.all([
 fetch(`/api/habits/rewards/${householdId}`).then((r) => r.json()),
 fetch(`/api/habits/${householdId}`).then((r) => r.json()).catch(() => null),
 ])
 .then(([rewardsData, habitsData]) => {
 setData(rewardsData);
 if (habitsData?.offpeak_ac?.streak_days != null) {
 setStreak(habitsData.offpeak_ac.streak_days);
 }
 })
 .catch(() => setData(null))
 .finally(() => setLoading(false));
 }, [householdId]);

 async function handleRedeem() {
 setRedeeming(true);
 try {
 const res = await fetch(`/api/habits/rewards/redeem/${householdId}`, { method: "POST" });
 const result = await res.json();
 setRedeemMsg(result.voucher_label ?? "Voucher issued!");
 // Refresh data
 const fresh = await fetch(`/api/habits/rewards/${householdId}`).then((r) => r.json());
 setData(fresh);
 } catch {
 setRedeemMsg("Failed — try again.");
 } finally {
 setRedeeming(false);
 }
 }

 const threshold = data?.voucher_threshold ?? 500;
 const balance = data?.points_balance ?? 0;

 return (
 <div className="px-4 pb-2 pt-6 sm:mx-auto sm:max-w-md sm:px-0">
 {/* Page title - matches My Home / Aircon Impact */}
 <div className="mb-6 flex items-end justify-between">
 <div>
 <h1 className="text-2xl font-bold text-[#10363b]">
 Rewards
 </h1>
 <p className="mt-1 text-sm text-[#666666]">
 {persona.name}&apos;s points & vouchers
 </p>
 </div>
 {/* Streak badge */}
 <div className="flex flex-col items-center rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-2 shadow-sm">
 <span className="text-2xl font-bold leading-none text-[#86CCD2]">
 {loading ? "—" : (streak ?? 0)}
 </span>
 <span className="mt-0.5 text-[10px] font-medium text-[#666666]">
 day streak
 </span>
 </div>
 </div>

 {/* Hero balance card - Monte Carlo gradient */}
 <div className="relative mb-6 overflow-hidden rounded-2xl border border-[#86CCD2]/30 bg-gradient-to-br from-[#86CCD2] to-[#6BB5BC] p-5 shadow-sm">
 {/* Background grid texture */}
 <div
 className="pointer-events-none absolute inset-0 opacity-[0.06]"
 style={{
 backgroundImage:
 "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)",
 }}
 />
 <div className="relative flex items-center gap-4">
 {/* Radial arc */}
 <div className="relative shrink-0 w-32">
 {!loading && <RadialProgress value={balance} max={threshold} />}
 {loading && (
 <div className="w-32 h-32 rounded-full border-8 border-white/20 animate-pulse" />
 )}
 {/* Balance in centre */}
 <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-3xl font-bold leading-none text-white">
 {loading ? "…" : balance}
 </span>
 <span className="text-[10px] font-medium text-white/60">pts</span>
 </div>
 </div>

 {/* Right side */}
 <div className="flex-1">
 <p className="text-xs font-medium text-white/80">CDC Voucher</p>
 <p className="text-3xl font-bold leading-none text-white">
 S${data?.voucher_value_sgd ?? 5}
 </p>
 <div className="mt-3">
 {/* Progress bar */}
 <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
 <div
 className="h-full rounded-full bg-white transition-all duration-1000 ease-out"
 style={{ width: `${Math.min((balance / threshold) * 100, 100)}%` }}
 />
 </div>
 <p className="mt-1 text-[11px] text-white/60">
 {loading
 ? "Loading…"
 : data?.can_redeem
 ? "Ready to redeem!"
 : `${data?.points_to_next_voucher} pts to go`}
 </p>
 </div>
 </div>
 </div>

 {/* Redeemed vouchers tally */}
 {!loading && (data?.redeemed_vouchers?.length ?? 0) > 0 && (
 <div className="mt-4 border-t border-white/20 pt-3">
 <p className="text-[11px] text-white/60">
 {data!.redeemed_vouchers.length} voucher{data!.redeemed_vouchers.length !== 1 ? "s" : ""} redeemed
 </p>
 </div>
 )}
 </div>

 {/* Redeem button */}
 {!loading && data?.can_redeem && (
 <div className="mb-6">
 {redeemMsg ? (
 <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
 ✓ {redeemMsg}
 </div>
 ) : (
 <button
 onClick={handleRedeem}
 disabled={redeeming}
 className="w-full rounded-2xl border border-[#86CCD2]/40 bg-[#86CCD2] py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#86CCD2]/90 active:scale-[0.98] disabled:opacity-60"
 >
 {redeeming ? "Processing…" : "Redeem S$5 CDC Voucher"}
 </button>
 )}
 </div>
 )}

 {/* How to earn - matches SummaryCard styling */}
 <section className="mb-6">
 <h2 className="mb-3 text-sm font-semibold text-[#10363b]">
 How to earn
 </h2>
 <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4 py-4 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
 <div className="space-y-2.5">
 {[
 { label: "Off-peak AC daily", pts: "+20 pts", sub: "AC below 0.3 kWh during 7–11pm" },
 { label: "Weekly energy reduction", pts: "+50 pts", sub: "This week below 95% of last week" },
 { label: "7-day streak bonus", pts: "+100 pts", sub: "Maintained habit for 7 days" },
 { label: "14-day streak bonus", pts: "+250 pts", sub: "Maintained habit for 14 days" },
 ].map((item) => (
 <div key={item.label} className="flex items-center justify-between gap-3">
 <div>
 <p className="text-sm font-medium text-[#10363b]">{item.label}</p>
 <p className="text-[11px] text-[#6f8c91]">{item.sub}</p>
 </div>
 <span className="shrink-0 rounded-lg bg-[#86CCD2]/20 px-2.5 py-1 text-xs font-semibold text-[#86CCD2]">
 {item.pts}
 </span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Activity - matches other section cards */}
 <section>
 <h2 className="mb-3 text-sm font-semibold text-[#10363b]">
 Activity
 </h2>
 <div className="rounded-2xl border border-[#86CCD2]/30 bg-white shadow-sm">
 <div className="flex items-center justify-between border-b border-[rgba(157,207,212,0.20)] px-4 py-3">
 <p className="text-xs font-medium text-[#666666]">
 Recent transactions
 </p>
 <p className="text-[11px] text-[#6f8c91]">
 {data?.history?.length ?? 0} transactions
 </p>
 </div>

 {loading && (
 <div className="space-y-3 p-4">
 {[1, 2, 3].map((i) => (
 <div key={i} className="flex items-center justify-between">
 <div className="h-3 w-36 animate-pulse rounded bg-[rgba(207,228,230,0.38)]" />
 <div className="h-3 w-12 animate-pulse rounded bg-[rgba(207,228,230,0.38)]" />
 </div>
 ))}
 </div>
 )}

 {!loading && (!data?.history?.length) && (
 <div className="p-6 text-center text-sm text-[#6f8c91]">
 No activity yet. Start using off-peak AC to earn points.
 </div>
 )}

 {!loading && !!data?.history?.length && (
 <div className="divide-y divide-[rgba(157,207,212,0.15)]">
 {data.history.map((tx, idx) => (
 <div
 key={idx}
 className="flex items-center justify-between px-4 py-3"
 >
 <div className="flex items-start gap-3">
 <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#86CCD2]/20">
 <svg className="h-3.5 w-3.5 text-[#86CCD2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
 </svg>
 </div>
 <div>
 <p className="text-sm text-[#10363b] leading-snug">
 {tx.reason}
 </p>
 <p className="text-[11px] text-[#6f8c91]">{formatDate(tx.date)}</p>
 </div>
 </div>
 <span className="shrink-0 text-base font-semibold text-[#86CCD2]">
 +{tx.points}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 </section>
 </div>
 );
}
