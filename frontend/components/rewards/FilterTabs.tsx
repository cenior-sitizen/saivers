"use client";

import type { ReactElement } from "react";

export type VoucherFilter = "all" | "available" | "redeemed";

interface FilterTabsProps {
 value: VoucherFilter;
 onChange: (value: VoucherFilter) => void;
}

const tabs: { value: VoucherFilter; label: string }[] = [
 { value: "all", label: "All" },
 { value: "available", label: "Available" },
 { value: "redeemed", label: "Redeemed" },
];

export function FilterTabs({ value, onChange }: FilterTabsProps): ReactElement {
 return (
 <div className="inline-flex rounded-xl border border-[#86CCD2]/40 bg-white p-1">
 {tabs.map((tab) => (
 <button
 key={tab.value}
 type="button"
 onClick={() => onChange(tab.value)}
 className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
 value === tab.value
 ? "bg-[#86CCD2] text-white shadow-sm"
 : "text-[#666666] hover:bg-[#86CCD2]/10"
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>
 );
}
