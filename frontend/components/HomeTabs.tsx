"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";

interface HomeTabsProps {
  appliancesContent: ReactNode;
  roomsContent: ReactNode;
}

const TABS = [
  { id: "appliances", label: "Appliances" },
  { id: "rooms", label: "Rooms" },
] as const;

export function HomeTabs({ appliancesContent, roomsContent }: HomeTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    isScrollingRef.current = true;
    const width = el.offsetWidth;
    el.scrollTo({ left: index * width, behavior: "smooth" });
    setActiveIndex(index);
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 300);
  }, []);

  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const width = el.offsetWidth;
    const index = Math.round(el.scrollLeft / width);
    if (index >= 0 && index < TABS.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [activeIndex]);

  return (
    <div className="w-full">
      {/* Tab headers - premium segmented control */}
      <div className="mb-4 flex gap-1 rounded-2xl border border-[rgba(157,207,212,0.30)] bg-[rgba(134,204,210,0.10)] p-1.5">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => scrollToIndex(index)}
            className={`flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-all duration-250 ${
              activeIndex === index
                ? "bg-gradient-to-b from-[#86CCD2] to-[#007B8A] text-white shadow-[0_4px_14px_rgba(0,123,138,0.28)]"
                : "bg-transparent text-[#4d6b70] hover:bg-[#86CCD2]/15 hover:text-[#007B8A]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <div
          className="min-w-full flex-shrink-0 snap-start px-px"
          style={{ scrollSnapAlign: "start" }}
        >
          {appliancesContent}
        </div>
        <div
          className="min-w-full flex-shrink-0 snap-start px-px"
          style={{ scrollSnapAlign: "start" }}
        >
          {roomsContent}
        </div>
      </div>
    </div>
  );
}
