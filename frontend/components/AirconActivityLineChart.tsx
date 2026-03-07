"use client";

import type { ReactElement } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DaySubGranularity } from "./ActivityGranularityToggle";

export interface ActivityDataPoint {
  time: string;
  value: number;
  isOn: boolean;
}

export type ActivityGranularity = "30m" | "1h" | "day" | "month" | "year";

const GRANULARITY_LABELS: Record<ActivityGranularity, string> = {
  "30m": "30 min",
  "1h": "1 hour",
  day: "Day",
  month: "Month",
  year: "Year",
};

const DAY_SUB_OPTIONS: { value: DaySubGranularity; label: string }[] = [
  { value: "1h", label: "1 hour" },
  { value: "30m", label: "30 min" },
];

interface AirconActivityLineChartProps {
  data: ActivityDataPoint[];
  title?: string;
  granularity?: ActivityGranularity;
  /** Day view: selected date (YYYY-MM-DD) */
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  /** Day view: hours vs 30min */
  daySubGranularity?: DaySubGranularity;
  onDaySubGranularityChange?: (value: DaySubGranularity) => void;
  showDayControls?: boolean;
  emptyMessage?: string;
}

export function AirconActivityLineChart({
  data,
  title = "When Your Aircon Was Running",
  granularity = "1h",
  selectedDate,
  onDateChange,
  daySubGranularity = "1h",
  onDaySubGranularityChange,
  showDayControls = false,
  emptyMessage = "No activity data for this period.",
}: AirconActivityLineChartProps): ReactElement {
  const chartData = data.map((d) => ({
    ...d,
    name: d.time,
    kwh: d.value,
    status: d.isOn ? "On" : "Off",
  }));

  const dateLabel = selectedDate
    ? (() => {
        const d = new Date(selectedDate + "T12:00:00");
        const day = d.getDate();
        const month = d.toLocaleDateString("en-GB", { month: "long" }).toLowerCase();
        return `${day} ${month}`;
      })()
    : "";

  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#10363b]">
          {title}
        </h3>
        {showDayControls && (
          <div className="flex items-center gap-2">
            <label className="relative">
              <input
                type="date"
                value={selectedDate ?? ""}
                onChange={(e) => onDateChange?.(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
                aria-label="Select date"
              />
              <span className="inline-flex cursor-pointer items-center rounded-lg border border-[#86CCD2]/40 bg-white px-3 py-2 text-xs font-medium text-[#10363b] shadow-sm hover:bg-[#86CCD2]/5">
                {dateLabel || "Select date"}
              </span>
            </label>
            <select
              value={daySubGranularity}
              onChange={(e) =>
                onDaySubGranularityChange?.(e.target.value as DaySubGranularity)
              }
              className="rounded-lg border border-[#86CCD2]/40 bg-white px-3 py-2 text-xs font-medium text-[#10363b] shadow-sm focus:border-[#86CCD2] focus:outline-none focus:ring-1 focus:ring-[#86CCD2]"
              aria-label="View by hours or 30 minutes"
            >
              {DAY_SUB_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="h-[220px] w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[#6f8c91]">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#86CCD2"
                strokeOpacity={0.2}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#666666" }}
                axisLine={{ stroke: "#86CCD2", strokeOpacity: 0.3 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#666666" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#F3F9F9",
                  border: "1px solid #86CCD2",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value, _name, props) => [
                  `${Number(value ?? 0).toFixed(3)} kWh`,
                  (props?.payload as { status?: string })?.status ?? "",
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="kwh"
                stroke="#86CCD2"
                strokeWidth={2}
                dot={{ fill: "#86CCD2", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: "#86CCD2", stroke: "#F3F9F9" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-[#6f8c91]">
        <span>kWh per {GRANULARITY_LABELS[granularity].toLowerCase()}</span>
      </div>
    </div>
  );
}
