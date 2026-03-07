"use client";

import type { ReactElement } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UsageDataPoint {
  time: string;
  value: number;
  isOn?: boolean;
  isSpike?: boolean;
  districtAvg?: number;
  singaporeAvg?: number;
}

interface UsageBehaviourChartProps {
  data: UsageDataPoint[];
  title?: string;
}

export function UsageBehaviourChart({ data, title }: UsageBehaviourChartProps): ReactElement {
  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
      )}
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86CCD2" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#86CCD2" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#86CCD2"
              strokeOpacity={0.2}
              vertical={false}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: "#0f172a", fontWeight: 600 }}
              axisLine={{ stroke: "#86CCD2", strokeOpacity: 0.3 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#0f172a", fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#F3F9F9",
                border: "1px solid #86CCD2",
                borderRadius: "12px",
                fontSize: "12px",
              }}
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  value: "You",
                  districtAvg: "28 districts avg",
                  singaporeAvg: "Singapore avg",
                };
                return [`${value ?? 0} kWh`, labels[String(name)] ?? String(name)];
              }}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  value: "You",
                  districtAvg: "28 districts avg",
                  singaporeAvg: "Singapore avg",
                };
                return labels[value] ?? value;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="value"
              stroke="#86CCD2"
              strokeWidth={2}
              fill="url(#usageGradient)"
            />
            {data.some((d) => d.districtAvg != null) && (
              <Line
                type="monotone"
                dataKey="districtAvg"
                name="districtAvg"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
            {data.some((d) => d.singaporeAvg != null) && (
              <Line
                type="monotone"
                dataKey="singaporeAvg"
                name="singaporeAvg"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
