"use client";

import type { ReactElement } from "react";

interface VoucherDetailModalProps {
  title: string;
  brand: string;
  pointsRequired: number;
  description?: string;
  expiryDate?: string;
  status: "locked" | "almost" | "redeemable" | "redeemed";
  onClose: () => void;
}

export function VoucherDetailModal({
  title,
  brand,
  pointsRequired,
  description,
  expiryDate,
  status,
  onClose,
}: VoucherDetailModalProps): ReactElement {
  const isRedeemable = status === "redeemable";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 sm:rounded-2xl">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-zinc-200 sm:hidden" />
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
            <p className="mt-1 text-sm text-[#666666] dark:text-zinc-400">
              {brand}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {pointsRequired} pts {expiryDate && `• Expires ${expiryDate}`}
          </p>
          {description && (
            <p className="text-sm text-[#666666] dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-300 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Close
          </button>
          {isRedeemable && (
            <button
              type="button"
              className="flex-1 rounded-xl bg-[#86CCD2] py-3 font-semibold text-white transition-colors hover:bg-[#86CCD2]/90 active:scale-[0.98]"
            >
              Redeem
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
