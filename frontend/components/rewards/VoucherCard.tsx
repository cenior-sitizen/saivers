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
 pillClass: "bg-[rgba(207,228,230,0.40)] text-[#4d6b70]",
 button: null,
 },
 almost: {
 pill: "Almost",
 pillClass: "bg-amber-100 text-amber-800",
 button: "View",
 },
 redeemable: {
 pill: "Redeemable",
 pillClass: "bg-emerald-100 text-emerald-700",
 button: "Redeem",
 },
 redeemed: {
 pill: "Redeemed",
 pillClass: "bg-[rgba(207,228,230,0.40)] text-[#4d6b70]",
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
 ? "border-[rgba(157,207,212,0.30)] bg-white opacity-75"
 : "border-[#86CCD2]/30 bg-white"
 }`}
 >
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0 flex-1">
 <p className="font-semibold text-[#10363b]">
 {title}
 </p>
 <p className="mt-0.5 text-sm text-[#666666]">
 {brand}
 </p>
 <p className="mt-2 text-xs text-[#666666]">
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
 : "bg-[#eef6f6] text-[#4d6b70] hover:bg-[rgba(207,228,230,0.40)]"
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
