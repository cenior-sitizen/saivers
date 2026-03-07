"use client";

import { useRef, useState, type ReactNode } from "react";

interface DragHandleProps {
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

interface CollapsibleDrawerProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  /** Rendered inside the row on the left (e.g. drag handle) */
  leading?: ReactNode;
  /** Rendered before the chevron (e.g. info button) */
  trailing?: ReactNode;
  /** When provided, the header row is draggable */
  dragHandleProps?: DragHandleProps;
}

export function CollapsibleDrawer({
  title,
  defaultOpen = false,
  children,
  leading,
  trailing,
  dragHandleProps,
}: CollapsibleDrawerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const pointerDownTargetRef = useRef<EventTarget | null>(null);

  const mainRow = (
      <>
        {leading && (
          <div
            className="flex shrink-0 items-center justify-center py-3 pl-3 pr-2 text-[#86CCD2]/60 dark:text-[#86CCD2]/50"
            aria-hidden
          >
            {leading}
          </div>
        )}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen((o) => !o);
            }
          }}
          className={`flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 py-3 text-left transition-colors hover:bg-[#86CCD2]/5 dark:hover:bg-[#86CCD2]/10 ${leading ? "pr-2" : "px-4"} ${trailing ? "pr-1" : "pr-4"}`}
          aria-expanded={isOpen}
        >
          <span className="min-w-0 flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </span>
          {trailing && (
            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => {
                e.stopPropagation();
                pointerDownTargetRef.current = e.target;
              }}
              onPointerUp={() => {
                pointerDownTargetRef.current = null;
              }}
              onPointerLeave={() => {
                pointerDownTargetRef.current = null;
              }}
              data-no-drag
              className="flex shrink-0"
            >
              {trailing}
            </div>
          )}
          <svg
            className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 dark:text-zinc-400 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </>
    );

  const handleDragStart = (e: React.DragEvent) => {
    const target = pointerDownTargetRef.current as HTMLElement | null;
    if (target?.closest?.("[data-no-drag]")) {
      e.preventDefault();
      e.dataTransfer.effectAllowed = "none";
      return;
    }
    dragHandleProps?.onDragStart?.(e);
  };

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-[#86CCD2]/30 bg-white dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      {dragHandleProps ? (
        <div
          draggable={dragHandleProps.draggable}
          onDragStart={handleDragStart}
          onDragEnd={() => {
            pointerDownTargetRef.current = null;
            dragHandleProps.onDragEnd?.();
          }}
          className="flex cursor-grab items-center active:cursor-grabbing"
        >
          {mainRow}
        </div>
      ) : (
        <div className="flex items-center">{mainRow}</div>
      )}
      {isOpen && (
        <div className="border-t border-[#86CCD2]/20 px-4 py-4 dark:border-[#86CCD2]/10">
          {children}
        </div>
      )}
    </div>
  );
}
