"use client";

import type { ReactElement } from "react";

export type TimeRangeOption = "day" | "week" | "month";

interface TimeRangeToggleProps {
 value: TimeRangeOption;
 onChange: (value: TimeRangeOption) => void;
}

const options: { value: TimeRangeOption; label: string }[] = [
 { value: "day", label: "Day" },
 { value: "week", label: "Week" },
 { value: "month", label: "Month" },
];

export function TimeRangeToggle({ value, onChange }: TimeRangeToggleProps): ReactElement {
 return (
 <div className="inline-flex rounded-xl border border-[#86CCD2]/40 bg-white p-1 shadow-sm">
 {options.map((opt) => (
 <button
 key={opt.value}
 type="button"
 onClick={() => onChange(opt.value)}
 className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
 value === opt.value
 ? "bg-[#86CCD2] text-white shadow-sm"
 : "text-[#666666] hover:bg-[#86CCD2]/10"
 }`}
 >
 {opt.label}
 </button>
 ))}
 </div>
 );
}
