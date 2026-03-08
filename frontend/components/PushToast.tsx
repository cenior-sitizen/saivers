"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useHousehold } from "@/context/HouseholdContext";

interface WeeklyInsight {
  insight_id: string;
  notification_title: string;
  notification_body: string;
  status: "unread" | "read" | "approved" | "dismissed";
}

function pickDemoToast(insights: WeeklyInsight[]): WeeklyInsight | null {
  return insights.find((i) => i.status === "unread") ?? insights[0] ?? null;
}

const VISIBLE_MS = 5_000;
const CYCLE_MS   = 15_000;
const SLIDE_MS   = 420;

export function PushToast() {
  const { householdId } = useHousehold();
  const pathname = usePathname();
  const onInsightPage = pathname.startsWith("/user/insights");

  const [insights, setInsights] = useState<WeeklyInsight[]>([]);
  const [toast, setToast]       = useState<WeeklyInsight | null>(null);
  const [mounted, setMounted]   = useState(false);
  const [visible, setVisible]   = useState(false);
  const [dragY, setDragY]       = useState(0);   // px offset while swiping
  const [dragging, setDragging] = useState(false);
  const touchStartY = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function add(t: ReturnType<typeof setTimeout>) {
    timers.current.push(t);
  }
  function clearAll() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  // Fetch insights
  useEffect(() => {
    setInsights([]);
    fetch(`/api/insights/weekly/${householdId}`)
      .then((r) => r.json())
      .then((d) => setInsights(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [householdId]);

  // Demo cycle
  useEffect(() => {
    if (!insights.length) return;

    function show() {
      const next = pickDemoToast(insights);
      if (!next) return;

      setToast(next);
      setMounted(true);
      // 1 frame later → trigger slide-down transition
      add(setTimeout(() => setVisible(true), 30));
      // slide back up after VISIBLE_MS
      add(setTimeout(hide, VISIBLE_MS));
      // next cycle
      add(setTimeout(show, CYCLE_MS));
    }

    function hide() {
      setVisible(false);
      add(setTimeout(() => setMounted(false), SLIDE_MS + 50));
    }

    // First toast after 2s
    add(setTimeout(show, 2_000));
    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insights.length]);

  // Immediately hide when entering an insight page
  useEffect(() => {
    if (onInsightPage && mounted) {
      setVisible(false);
      setTimeout(() => setMounted(false), SLIDE_MS + 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onInsightPage]);

  // dismiss: hide this instance but keep the cycle running
  const dismiss = useCallback(() => {
    setDragY(0);
    setDragging(false);
    setVisible(false);
    setTimeout(() => setMounted(false), SLIDE_MS + 50);
  }, []);

  function handleClick() {
    // Navigate + clear cycle only when tapping the whole card
    clearAll();
    setVisible(false);
    setTimeout(() => setMounted(false), SLIDE_MS + 50);
  }

  // Swipe-up to dismiss
  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    setDragging(false);
  }
  function onTouchMove(e: React.TouchEvent) {
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy < 0) {
      setDragging(true);
      setDragY(dy);
    }
  }
  function onTouchEnd() {
    if (dragY < -50) {
      dismiss();
    } else {
      setDragY(0);
      setDragging(false);
    }
  }

  if (!mounted || !toast || onInsightPage) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[300] flex justify-center px-4 pt-3"
        style={{ pointerEvents: "none" }}
      >
        {/* Swipe + slide wrapper */}
        <div
          className="pointer-events-auto w-full max-w-sm"
          style={{
            transform: visible
              ? `translateY(${dragY}px)`
              : "translateY(calc(-100% - 1rem))",
            opacity: visible ? Math.max(0, 1 + dragY / 120) : 0,
            transition: dragging
              ? "none"
              : `transform ${SLIDE_MS}ms cubic-bezier(0.34, 1.10, 0.64, 1), opacity ${SLIDE_MS * 0.6}ms ease`,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Card */}
          <div
            className="relative overflow-hidden rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,74,82,0.22),0_2px_8px_rgba(0,74,82,0.10)]"
            style={{
              background: "rgba(240,250,251,0.88)",
              backdropFilter: "blur(28px) saturate(1.6)",
              WebkitBackdropFilter: "blur(28px) saturate(1.6)",
            }}
          >
            {/* X dismiss button */}
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(); }}
              className="absolute right-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(0,0,0,0.07)] text-[#aabfc3] transition-colors hover:bg-[rgba(0,0,0,0.12)]"
              aria-label="Dismiss notification"
            >
              <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <Link
              href={`/user/insights/${toast.insight_id}`}
              onClick={handleClick}
              className="block"
            >
              {/* App row */}
              <div className="flex items-center gap-2 px-4 pt-3.5 pb-1">
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-gradient-to-br from-[#86CCD2] to-[#007B8A] shadow-sm">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-[11px] font-semibold tracking-wide text-[#4d6b70]">
                  SAIVERS
                </span>
                <span className="ml-auto pr-5 text-[11px] text-[#9bb5b9]">now</span>
              </div>

              {/* Content */}
              <div className="px-4 pb-3.5 pt-1">
                <p className="text-[13.5px] font-semibold leading-snug text-[#10363b]">
                  {toast.notification_title}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[#6f8c91] line-clamp-2">
                  {toast.notification_body}
                </p>
              </div>

              {/* Shrinking progress bar */}
              <div className="h-[3px] w-full bg-[rgba(134,204,210,0.18)]">
                {visible && (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#86CCD2] to-[#007B8A]"
                    style={{
                      animation: `pushToastShrink ${VISIBLE_MS}ms linear forwards`,
                    }}
                  />
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pushToastShrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </>
  );
}
