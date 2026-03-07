"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const INFO_MESSAGE =
  "To change your decision, you can turn it off in the smart home app itself.";

interface InfoButtonProps {
  message?: string;
  className?: string;
}

export function InfoButton({ message = INFO_MESSAGE, className = "" }: InfoButtonProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    if (show) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [show]);

  // Position tooltip via portal so it's not clipped by overflow-hidden parents
  const tooltip = show && ref.current && typeof document !== "undefined" && (
    createPortal(
      <div
        ref={tooltipRef}
        className="fixed z-[9999] min-w-[200px] max-w-[260px] rounded-xl border border-[#86CCD2]/30 bg-white p-3 text-xs text-zinc-600 shadow-lg dark:border-[#86CCD2]/20 dark:bg-zinc-800 dark:text-zinc-300"
        style={{
          top: ref.current.getBoundingClientRect().bottom + 6,
          right: window.innerWidth - ref.current.getBoundingClientRect().right,
          left: "auto",
          maxWidth: "min(260px, 100vw - 24px)",
        }}
      >
        {message}
        <div className="absolute -top-1.5 right-3 h-2 w-2 rotate-45 border-l border-t border-[#86CCD2]/30 bg-white dark:border-[#86CCD2]/20 dark:bg-zinc-800" />
      </div>,
      document.body
    )
  );

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShow((s) => !s);
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#86CCD2] hover:bg-[#86CCD2]/20 hover:text-[#007B8A] dark:text-[#86CCD2]/80 dark:hover:bg-[#86CCD2]/10 dark:hover:text-[#86CCD2]"
        aria-label="More information"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      {tooltip}
    </div>
  );
}
