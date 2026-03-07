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

export function HomeTabs({
  appliancesContent,
  roomsContent,
}: HomeTabsProps) {
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
      {/* Tab headers - soft segmented control style */}
      <div className="mb-4 flex gap-1 rounded-2xl bg-[#86CCD2]/15 p-1.5 dark:bg-[#86CCD2]/10">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => scrollToIndex(index)}
            className={`flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${
              activeIndex === index
                ? "bg-[#86CCD2] text-white shadow-sm dark:bg-[#86CCD2]/90"
                : "bg-transparent text-[#666666] hover:bg-[#86CCD2]/10 dark:text-zinc-400 dark:hover:bg-[#86CCD2]/15"
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
