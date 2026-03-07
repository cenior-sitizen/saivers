"use client";

import type { ReactElement } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface UsageDataPoint {
  time: string;
  value: number;
  isOn: boolean;
  isSpike?: boolean;
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
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
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
              tick={{ fontSize: 11, fill: "#666666" }}
              axisLine={{ stroke: "#86CCD2", strokeOpacity: 0.3 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#666666" }}
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
              formatter={(value) => [`${value ?? 0} kWh`, "Usage"]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#86CCD2"
              strokeWidth={2}
              fill="url(#usageGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-[#666666] dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#86CCD2]" />
          Energy usage over time
        </span>
      </div>
    </div>
  );
}
