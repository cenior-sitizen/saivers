"use client";

import { useState, useEffect } from "react";
import { CollapsibleDrawer } from "@/components/CollapsibleDrawer";
import { RoomUsageCard } from "@/components/RoomUsageCard";
import { SpikeCard } from "@/components/SpikeCard";
import { RecommendationsSection } from "./RecommendationsSection";
import { ActivityChartSection } from "./ActivityChartSection";
import { UsageChartSection } from "./UsageChartSection";
import { BrandComparisonChart } from "./BrandComparisonChart";
import { InfoButton } from "@/components/InfoButton";
import type { Recommendation } from "./RecommendationsSection";

const WIDGET_IDS = ["recommendations", "trends", "room-breakdown"] as const;
const STORAGE_KEY = "aircon-impact-widget-order";

function getStoredOrder(): string[] {
  if (typeof window === "undefined") return [...WIDGET_IDS];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      const valid = parsed.filter((id) => WIDGET_IDS.includes(id as (typeof WIDGET_IDS)[number]));
      if (valid.length === WIDGET_IDS.length) return valid;
    }
  } catch {
    // ignore
  }
  return [...WIDGET_IDS];
}

interface AirconImpactWidgetsProps {
  roomUsageData: Array<{
    id: string;
    name: string;
    status: "Running" | "Idle" | "Recently Active";
    usageKwh: number;
    percentOfTotal: number;
    runtimeHours: number;
    avgTempC: number;
    trendNote: string;
  }>;
  spikeEvents: Array<{ id: string; time: string; description: string }>;
  recommendations: Recommendation[];
}

export function AirconImpactWidgets({
  roomUsageData,
  spikeEvents,
  recommendations,
}: AirconImpactWidgetsProps) {
  const [order, setOrder] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    setOrder(getStoredOrder());
  }, []);

  useEffect(() => {
    if (order.length === WIDGET_IDS.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    }
  }, [order]);

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    const srcIndex = dragIndex ?? parseInt(e.dataTransfer.getData("text/plain") ?? "0", 10);
    if (srcIndex === dropIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...order];
    const [removed] = next.splice(srcIndex, 1);
    next.splice(dropIndex, 0, removed);
    setOrder(next);
    setDragIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
  }

  const widgetConfig: Record<string, { title: string; content: React.ReactNode; trailing?: React.ReactNode }> = {
    recommendations: {
      title: "All recommendations",
      trailing: <InfoButton />,
      content: (
        <RecommendationsSection recommendations={recommendations} embedded />
      ),
    },
    trends: {
      title: "Trends",
      content: (
        <>
          <ActivityChartSection embedded />
          <div className="mt-6">
            <UsageChartSection embedded />
          </div>
          <div className="mt-6">
            <BrandComparisonChart />
          </div>
        </>
      ),
    },
    "room-breakdown": {
      title: "Room-by-room breakdown",
      content: (
        <>
          <div className="flex flex-col gap-3">
            {roomUsageData.map((room) => (
              <RoomUsageCard
                key={room.id}
                name={room.name}
                status={room.status}
                usageKwh={room.usageKwh}
                percentOfTotal={room.percentOfTotal}
                runtimeHours={room.runtimeHours}
                avgTempC={room.avgTempC}
                trendNote={room.trendNote}
              />
            ))}
          </div>
          {spikeEvents.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                Spike highlights
              </h3>
              <div className="flex flex-col gap-2">
                {spikeEvents.map((event) => (
                  <SpikeCard
                    key={event.id}
                    time={event.time}
                    description={event.description}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ),
    },
  };

  if (order.length === 0) return null;

  return (
    <div className="space-y-4">
      {order.map((id, index) => {
        const config = widgetConfig[id];
        if (!config) return null;

        const twoLines = (
          <div className="flex flex-col gap-1">
            <div className="h-0.5 w-3 rounded-full bg-current" />
            <div className="h-0.5 w-3 rounded-full bg-current" />
          </div>
        );

        return (
          <div
            key={id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={dragIndex === index ? "opacity-60" : ""}
          >
            <CollapsibleDrawer
              title={config.title}
              leading={twoLines}
              trailing={config.trailing}
              dragHandleProps={{
                draggable: true,
                onDragStart: (e) => {
                  e.dataTransfer.setData("text/plain", String(index));
                  e.dataTransfer.effectAllowed = "move";
                  handleDragStart(index);
                },
                onDragEnd: handleDragEnd,
              }}
            >
              {config.content}
            </CollapsibleDrawer>
          </div>
        );
      })}
    </div>
  );
}
