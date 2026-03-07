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
        stroke="#E0F4F5"
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
          <stop offset="0%" stopColor="#00A3AD" />
          <stop offset="100%" stopColor="#007B8A" />
        </linearGradient>
      </defs>
      {/* Dot at end of fill */}
      {pct > 0.02 && (
        <circle
          cx={arcX(fillEnd)}
          cy={arcY(fillEnd)}
          r="7"
          fill="#007B8A"
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
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        .rewards-root {
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .rewards-display {
          font-family: 'DM Serif Display', Georgia, serif;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-1 { animation: fadeUp 0.5s ease both 0.05s; }
        .anim-2 { animation: fadeUp 0.5s ease both 0.15s; }
        .anim-3 { animation: fadeUp 0.5s ease both 0.25s; }
        .anim-4 { animation: fadeUp 0.5s ease both 0.35s; }
        .anim-5 { animation: fadeUp 0.5s ease both 0.45s; }
      `}</style>

      <div className="rewards-root min-h-screen bg-[#F3F9F9] px-4 pb-28 pt-4 dark:bg-zinc-950 sm:mx-auto sm:max-w-md sm:px-0">

        {/* Page title */}
        <div className="anim-1 mb-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#007B8A]">
              Energy Rewards
            </p>
            <h1 className="rewards-display text-2xl text-zinc-900 dark:text-zinc-50">
              {persona.name}&apos;s Points
            </h1>
          </div>
          {/* Streak badge */}
          <div className="flex flex-col items-center rounded-2xl border border-[#86CCD2]/40 bg-white px-4 py-2 shadow-sm dark:bg-zinc-900">
            <span className="rewards-display text-2xl leading-none text-[#007B8A]">
              {loading ? "—" : (streak ?? 0)}
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-zinc-400">day streak</span>
          </div>
        </div>

        {/* Hero balance card */}
        <div className="anim-2 relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#007B8A] to-[#00A3AD] p-5 shadow-lg shadow-[#007B8A]/20">
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
                <span className="rewards-display text-3xl leading-none text-white">
                  {loading ? "…" : balance}
                </span>
                <span className="text-[10px] font-medium text-white/60">pts</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex-1">
              <p className="text-xs font-medium text-white/70">CDC Voucher</p>
              <p className="rewards-display text-4xl leading-none text-white">
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
          <div className="anim-3 mb-4">
            {redeemMsg ? (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                ✓ {redeemMsg}
              </div>
            ) : (
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="w-full rounded-2xl bg-[#007B8A] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#007B8A]/30 transition-all hover:bg-[#006570] active:scale-[0.98] disabled:opacity-60"
              >
                {redeeming ? "Processing…" : "Redeem S$5 CDC Voucher"}
              </button>
            )}
          </div>
        )}

        {/* How to earn */}
        <div className="anim-3 mb-4 rounded-2xl border border-[#86CCD2]/30 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            How to earn
          </p>
          <div className="space-y-2.5">
            {[
              { label: "Off-peak AC daily", pts: "+20 pts", sub: "AC below 0.3 kWh during 7–11pm" },
              { label: "Weekly energy reduction", pts: "+50 pts", sub: "This week below 95% of last week" },
              { label: "7-day streak bonus", pts: "+100 pts", sub: "Maintained habit for 7 days" },
              { label: "14-day streak bonus", pts: "+250 pts", sub: "Maintained habit for 14 days" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{item.label}</p>
                  <p className="text-[11px] text-zinc-400">{item.sub}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-[#E0F4F5] px-2.5 py-1 text-xs font-semibold text-[#007B8A] dark:bg-[#007B8A]/20 dark:text-[#86CCD2]">
                  {item.pts}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction history */}
        <div className="anim-4 rounded-2xl border border-[#86CCD2]/30 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Activity
            </p>
            <p className="text-[11px] text-zinc-400">
              {data?.history?.length ?? 0} transactions
            </p>
          </div>

          {loading && (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-36 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-3 w-12 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          )}

          {!loading && (!data?.history?.length) && (
            <div className="p-6 text-center text-sm text-zinc-400">
              No activity yet. Start using off-peak AC to earn points.
            </div>
          )}

          {!loading && !!data?.history?.length && (
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
              {data.history.map((tx, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ animation: `fadeUp 0.4s ease both ${0.45 + idx * 0.04}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E0F4F5] dark:bg-[#007B8A]/20">
                      <svg className="h-3.5 w-3.5 text-[#007B8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-snug">
                        {tx.reason}
                      </p>
                      <p className="text-[11px] text-zinc-400">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span className="rewards-display shrink-0 text-base font-medium text-[#007B8A]">
                    +{tx.points}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SP Group attribution footer */}
        <div className="anim-5 mt-6 flex items-center justify-center gap-2 opacity-50">
          <svg className="h-4 w-4 text-[#007B8A]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.72L13 17v5h5l-1.22-1.22C19.91 19.07 22 15.76 22 12c0-5.18-3.95-9.45-9-9.95zM11 2.05C5.95 2.55 2 6.82 2 12c0 3.76 2.09 7.07 5.22 8.78L6 22h5v-5l-2.28 2.28C7.81 18 6 15.21 6 12c0-4.08 3.05-7.44 7-7.93V2.05z"/>
          </svg>
          <span className="text-[11px] font-medium text-zinc-500">
            Powered by SP Group · Saivers
          </span>
        </div>
      </div>
    </>
  );
}
