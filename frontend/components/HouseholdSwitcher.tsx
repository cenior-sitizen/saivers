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
        className="flex items-center gap-1.5 rounded-full border border-[rgba(134,204,210,0.50)] bg-[rgba(251,254,254,0.90)] px-3 py-1.5 text-xs font-semibold text-[#10363b] shadow-[0_2px_8px_rgba(0,123,138,0.08)] backdrop-blur-sm transition-all hover:border-[#86CCD2] hover:shadow-[0_4px_14px_rgba(0,123,138,0.14)]"
        aria-label="Switch household"
      >
        <span className="h-2 w-2 rounded-full bg-gradient-to-br from-[#86CCD2] to-[#007B8A]" />
        <span className="max-w-[80px] truncate">{persona.name}</span>
        <svg
          className="h-3 w-3 text-[#86CCD2]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-[248px] overflow-hidden rounded-2xl border border-[rgba(157,207,212,0.40)] bg-[rgba(251,254,254,0.95)] shadow-[0_18px_40px_rgba(0,74,82,0.14)] backdrop-blur-xl">
          <div className="border-b border-[rgba(157,207,212,0.25)] px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#86CCD2]">
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
              className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-[#86CCD2]/08 ${
                p.id === persona.id ? "bg-[rgba(134,204,210,0.12)]" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${p.id === persona.id ? "bg-[#007B8A]" : "bg-transparent"}`}
                />
                <span className="text-sm font-semibold text-[#10363b]">
                  {p.name}
                </span>
                <span className="ml-auto rounded-full bg-[#86CCD2]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#007B8A]">
                  {p.label}
                </span>
              </div>
              <p className="pl-3.5 text-[11px] text-[#4d6b70]">
                {p.description}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
