"use client";

import { useState, useRef, useEffect } from "react";
import { useHousehold, PERSONAS } from "@/context/HouseholdContext";

export function HouseholdSwitcher() {
  const { persona, setHouseholdId } = useHousehold();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-[#86CCD2]/40 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm transition-all hover:border-[#86CCD2] hover:bg-white dark:border-[#86CCD2]/20 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
        aria-label="Switch household"
      >
        <span className="h-2 w-2 rounded-full bg-[#86CCD2]" />
        <span className="max-w-[80px] truncate">{persona.name}</span>
        <svg className="h-3 w-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 w-[240px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Demo Households
            </p>
          </div>
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setHouseholdId(p.id);
                setOpen(false);
              }}
              className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                p.id === persona.id ? "bg-[#86CCD2]/10" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                {p.id === persona.id && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#86CCD2]" />
                )}
                {p.id !== persona.id && <span className="h-1.5 w-1.5" />}
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {p.name}
                </span>
                <span className="ml-auto text-[10px] font-medium text-zinc-400">{p.label}</span>
              </div>
              <p className="pl-3.5 text-[11px] text-zinc-400">{p.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
