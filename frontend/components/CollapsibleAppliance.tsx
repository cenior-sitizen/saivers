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
  children: React.ReactNode;
}

export function CollapsibleAppliance({
  name,
  modelNumber,
  image,
  status,
  defaultOpen = false,
  children,
}: CollapsibleApplianceProps): ReactElement {
 const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-[#86CCD2]/30 bg-white dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#86CCD2]/5 dark:hover:bg-[#86CCD2]/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F3F9F9] dark:bg-zinc-800">
            <Image src={image} alt={name} width={32} height={24} className="object-contain" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">{name}</p>
            {modelNumber && (
              <p className="text-xs text-[#666666] dark:text-zinc-400">Model {modelNumber}</p>
            )}
            <span
              className={`inline-flex items-center gap-1.5 text-xs ${
                status === "On"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  status === "On" ? "bg-emerald-500" : "bg-zinc-400"
                }`}
              />
              {status}
            </span>
          </div>
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 dark:text-zinc-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-[#86CCD2]/20 px-4 py-4 dark:border-[#86CCD2]/10">
          {children}
        </div>
      )}
    </div>
  );
}
