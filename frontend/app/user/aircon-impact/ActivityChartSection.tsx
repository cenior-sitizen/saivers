"use client";

import { useState, useEffect, useMemo } from "react";
import { AirconActivityLineChart, type ActivityGranularity } from "@/components/AirconActivityLineChart";
import { ActivityGranularityToggle, type ActivityPeriod, type DaySubGranularity } from "@/components/ActivityGranularityToggle";

function getYesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

interface ActivityChartSectionProps {
  embedded?: boolean;
}

export function ActivityChartSection({ embedded = false }: ActivityChartSectionProps = {}) {
  const [period, setPeriod] = useState<ActivityPeriod>("day");
  const [selectedDate, setSelectedDate] = useState<string>(() => getYesterdayISO());
  const [daySubGranularity, setDaySubGranularity] = useState<DaySubGranularity>("1h");
  const [data, setData] = useState<{ time: string; value: number; isOn: boolean }[]>([]);

  const apiGranularity: ActivityGranularity = useMemo(() => {
    if (period === "day") return daySubGranularity;
    if (period === "month") return "month";
    return "year";
  }, [period, daySubGranularity]);

  const apiUrl = useMemo(() => {
    const url = `/api/aircon/impact/activity?granularity=${apiGranularity}`;
    if (period === "day") return `${url}&date=${selectedDate}`;
    return url;
  }, [period, apiGranularity, selectedDate]);

  useEffect(() => {
    fetch(apiUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => res?.data && setData(res.data))
      .catch(() => setData([]));
  }, [apiUrl]);

  return (
    <section className={embedded ? "" : "mb-6"}>
      <div className="mb-3">
        {!embedded && (
          <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Activity range
          </p>
        )}
        <ActivityGranularityToggle period={period} onPeriodChange={setPeriod} />
      </div>
      <AirconActivityLineChart
        data={data}
        title="When Your Aircon Was Running"
        granularity={apiGranularity}
        showDayControls={period === "day"}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        daySubGranularity={daySubGranularity}
        onDaySubGranularityChange={setDaySubGranularity}
        emptyMessage="No activity data for this period."
      />
    </section>
  );
}
