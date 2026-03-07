"use client";

import type { ReactElement } from "react";

interface VoucherCardProps {
  id: string;
  title: string;
  brand: string;
  pointsRequired: number;
  status: "locked" | "almost" | "redeemable" | "redeemed";
  userPoints: number;
  onSelect: () => void;
}

const statusConfig = {
  locked: {
    pill: "Locked",
    pillClass: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
    button: null,
  },
  almost: {
    pill: "Almost",
    pillClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    button: "View",
  },
  redeemable: {
    pill: "Redeemable",
    pillClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    button: "Redeem",
  },
  redeemed: {
    pill: "Redeemed",
    pillClass: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400",
    button: "View",
  },
};

export function VoucherCard({
  title,
  brand,
  pointsRequired,
  status,
  userPoints,
  onSelect,
}: VoucherCardProps): ReactElement {
  const config = statusConfig[status];
  const isRedeemable = status === "redeemable";

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-all ${
        status === "locked"
          ? "border-zinc-200 bg-white opacity-75 dark:border-zinc-700 dark:bg-zinc-900"
          : "border-[#86CCD2]/30 bg-white dark:border-[#86CCD2]/20 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </p>
          <p className="mt-0.5 text-sm text-[#666666] dark:text-zinc-400">
            {brand}
          </p>
          <p className="mt-2 text-xs text-[#666666] dark:text-zinc-400">
            {pointsRequired} pts
            {status !== "redeemed" && ` • ${userPoints} pts`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.pillClass}`}
          >
            {config.pill}
          </span>
          {config.button && (
            <button
              type="button"
              onClick={onSelect}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isRedeemable
                  ? "bg-[#86CCD2] text-white hover:bg-[#86CCD2]/90 active:scale-[0.98]"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {config.button}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
