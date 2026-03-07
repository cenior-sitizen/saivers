"use client";

import type { ReactElement } from "react";
import Image from "next/image";
import { useState } from "react";

interface CollapsibleApplianceProps {
  id?: string;
  name: string;
  modelNumber?: string;
  image: string;
  status: "On" | "Off";
  defaultOpen?: boolean;
  efficiencyLevel?: "efficient" | "moderate" | "high";
  children: React.ReactNode;
}

const EFFICIENCY_STYLES: Record<string, { chip: string; label: string }> = {
  efficient: { chip: "bg-emerald-100 text-emerald-700", label: "Efficient" },
  moderate: { chip: "bg-amber-100 text-amber-700", label: "Moderate" },
  high: { chip: "bg-red-100 text-red-700", label: "High Usage" },
};

export function CollapsibleAppliance({
  name,
  modelNumber,
  image,
  status,
  defaultOpen = false,
  efficiencyLevel,
  children,
}: CollapsibleApplianceProps): ReactElement {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-[#86CCD2]/30 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#86CCD2]/5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <Image
              src={image}
              alt={name}
              width={32}
              height={24}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[#10363b]">{name}</p>
              {efficiencyLevel && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${EFFICIENCY_STYLES[efficiencyLevel].chip}`}
                >
                  {EFFICIENCY_STYLES[efficiencyLevel].label}
                </span>
              )}
            </div>
            {modelNumber && (
              <p className="text-xs text-[#6f8c91]">Model {modelNumber}</p>
            )}
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${
                status === "On" ? "text-emerald-600" : "text-[#6f8c91]"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === "On" ? "bg-emerald-500" : "bg-[#6f8c91]"
                }`}
              />
              {status}
            </span>
          </div>
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-[#6f8c91] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-[#86CCD2]/20 px-4 py-4">{children}</div>
      )}
    </div>
  );
}
