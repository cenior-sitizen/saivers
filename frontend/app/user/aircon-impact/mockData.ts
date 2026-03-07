/**
 * Mock data for Aircon Impact screen.
 * Replace with API calls / backend data when integrating.
 */

export interface SummaryMetric {
  label: string;
  value: string;
}

export interface WeeklyComparison {
  thisWeek: number;
  lastWeek: number;
  percentChange: number;
  thisWeekCost: string;
  lastWeekCost: string;
}

export interface RoomUsage {
  id: string;
  name: string;
  status: "Running" | "Idle" | "Recently Active";
  usageKwh: number;
  percentOfTotal: number;
  runtimeHours: number;
  avgTempC: number;
  trendNote: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface SpikeEvent {
  id: string;
  time: string;
  description: string;
}

export interface SavingsInsight {
  savedThisWeek: string;
  projectedMonthly: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
}

export const summaryMetrics: SummaryMetric[] = [
  { label: "Total Aircon Usage This Week", value: "42.8 kWh" },
  { label: "Estimated Cost This Week", value: "S$12.30" },
  { label: "Saved This Week", value: "S$3.20 saved this week" },
  { label: "Projected Monthly Savings", value: "S$14.00" },
];

export const weeklyComparison: WeeklyComparison = {
  thisWeek: 42.8,
  lastWeek: 48.5,
  percentChange: -11.8,
  thisWeekCost: "S$12.30",
  lastWeekCost: "S$13.95",
};

export const roomUsageData: RoomUsage[] = [
  {
    id: "living",
    name: "Living Room",
    status: "Running",
    usageKwh: 18.2,
    percentOfTotal: 42.5,
    runtimeHours: 12,
    avgTempC: 24,
    trendNote: "5% lower than last week",
  },
  {
    id: "master",
    name: "Master Bedroom",
    status: "Idle",
    usageKwh: 14.1,
    percentOfTotal: 32.9,
    runtimeHours: 8,
    avgTempC: 25,
    trendNote: "3% lower than last week",
  },
  {
    id: "bedroom2",
    name: "Bedroom 2",
    status: "Recently Active",
    usageKwh: 6.8,
    percentOfTotal: 15.9,
    runtimeHours: 4,
    avgTempC: 24,
    trendNote: "8% lower than last week",
  },
  {
    id: "study",
    name: "Study Room",
    status: "Idle",
    usageKwh: 3.7,
    percentOfTotal: 8.6,
    runtimeHours: 2,
    avgTempC: 23,
    trendNote: "12% lower than last week",
  },
];

export const chartData: ChartDataPoint[] = [
  { label: "Mon", value: 5.2 },
  { label: "Tue", value: 6.8 },
  { label: "Wed", value: 5.1 },
  { label: "Thu", value: 7.2 },
  { label: "Fri", value: 8.5 },
  { label: "Sat", value: 6.0 },
  { label: "Sun", value: 4.0 },
];

export const spikeEvents: SpikeEvent[] = [
  {
    id: "1",
    time: "Tuesday 2 PM",
    description: "Living Room usage spiked",
  },
  {
    id: "2",
    time: "Friday 8 PM",
    description: "Multiple rooms active at once",
  },
  {
    id: "3",
    time: "Saturday 11 PM",
    description: "Master Bedroom ran continuously",
  },
];

export const savingsInsight: SavingsInsight = {
  savedThisWeek:
    "You have already saved S$3.20 this week compared with last week.",
  projectedMonthly:
    "If you maintain this pattern, you may save around S$14.00 this month.",
};

export const recommendations: Recommendation[] = [
  {
    id: "1",
    title: "Raise set temperature by 1–2°C",
    description: "Small adjustments can reduce energy use without sacrificing comfort.",
  },
  {
    id: "2",
    title: "Use timer mode at night",
    description: "Set the AC to turn off after you fall asleep to avoid overnight waste.",
  },
  {
    id: "3",
    title: "Avoid cooling unused rooms",
    description: "Keep doors closed and turn off AC in rooms you are not using.",
  },
];
