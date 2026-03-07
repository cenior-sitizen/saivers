/**
 * Mock data for Room Air Conditioner detail page.
 * All data is display-only; backend/teammates provide processed data.
 */

export type TimeRange = "day" | "week" | "month";

export interface ApplianceData {
  id: string;
  name: string;
  image: string;
  status: "On" | "Off";
  temperature?: number;
  runtimeTodayHours: number;
  energyTodayKwh: number;
  usageTodayKwh: number;
  trendVsPrevious: number;
}

export interface RoomData {
  id: string;
  name: string;
  slug: string;
  appliances: ApplianceData[];
}

/** Legacy single-appliance shape for backward compat */
export interface RoomDataLegacy {
  id: string;
  name: string;
  slug: string;
  appliance: string;
  status: "On" | "Off";
  temperature: number;
  runtimeTodayHours: number;
  energyTodayKwh: number;
  usageTodayKwh: number;
  trendVsPrevious: number;
}

export interface UsageDataPoint {
  time: string;
  value: number;
  isOn: boolean;
  isSpike?: boolean;
  /** District avg (28 districts in Singapore) - for timeline comparison */
  districtAvg?: number;
  /** Singapore avg - for timeline comparison */
  singaporeAvg?: number;
}

export interface BehaviourSummary {
  mostCommonUsageTime: string;
  longestRuntimePeriod: string;
  highestUsageDay: string;
  avgDailyRuntime: string;
}

export interface SpikeEvent {
  id: string;
  dateTime: string;
  room: string;
  appliance: string;
  magnitude: string;
  cause: string;
}

export interface ComparisonData {
  vsLastWeek: { label: string; value: string; isPositive: boolean };
  vsLastMonth: { label: string; value: string; isPositive: boolean };
  vsDistrictAvg: { label: string; value: string; isPositive: boolean };
  vsSingaporeAvg: { label: string; value: string; isPositive: boolean };
}

/** For district vs Singapore bar comparison */
export interface RegionalComparison {
  yourKwh: number;
  districtAvgKwh: number;
  singaporeAvgKwh: number;
}

export interface BehaviourInsight {
  id: string;
  text: string;
}


export const roomDataMap: Record<string, RoomData> = {
  "master-room": {
    id: "master",
    name: "Master Room",
    slug: "master-room",
    appliances: [
      {
        id: "ac",
        name: "Midea Air Conditioner",
        image: "/midea-aircon.png",
        status: "On",
        temperature: 24,
        runtimeTodayHours: 4.2,
        energyTodayKwh: 2.8,
        usageTodayKwh: 2.8,
        trendVsPrevious: -5.2,
      },
      {
        id: "mitsubishi",
        name: "Mitsubishi Air Conditioner",
        image: "/mitsubishi-aircon.png",
        status: "Off",
        runtimeTodayHours: 1.5,
        energyTodayKwh: 0.3,
        usageTodayKwh: 0.3,
        trendVsPrevious: 2.1,
      },
    ],
  },
  "room-1": {
    id: "room1",
    name: "Room 1",
    slug: "room-1",
    appliances: [
      {
        id: "ac",
        name: "Midea Air Conditioner",
        image: "/midea-aircon.png",
        status: "Off",
        temperature: 25,
        runtimeTodayHours: 2.1,
        energyTodayKwh: 1.4,
        usageTodayKwh: 1.4,
        trendVsPrevious: 3.1,
      },
      {
        id: "mitsubishi",
        name: "Mitsubishi Air Conditioner",
        image: "/mitsubishi-aircon.png",
        status: "On",
        runtimeTodayHours: 2.0,
        energyTodayKwh: 0.4,
        usageTodayKwh: 0.4,
        trendVsPrevious: -1.2,
      },
    ],
  },
  "room-2": {
    id: "room2",
    name: "Room 2",
    slug: "room-2",
    appliances: [
      {
        id: "ac",
        name: "Midea Air Conditioner",
        image: "/midea-aircon.png",
        status: "On",
        temperature: 23,
        runtimeTodayHours: 5.5,
        energyTodayKwh: 3.2,
        usageTodayKwh: 3.2,
        trendVsPrevious: -8.0,
      },
      {
        id: "dehumidifier",
        name: "Dehumidifier",
        image: "/midea-aircon.png",
        status: "Off",
        runtimeTodayHours: 0.5,
        energyTodayKwh: 0.2,
        usageTodayKwh: 0.2,
        trendVsPrevious: 0,
      },
    ],
  },
  "living-room": {
    id: "living",
    name: "Living Room",
    slug: "living-room",
    appliances: [
      {
        id: "ac",
        name: "Midea Air Conditioner",
        image: "/midea-aircon.png",
        status: "On",
        temperature: 24,
        runtimeTodayHours: 6.8,
        energyTodayKwh: 4.1,
        usageTodayKwh: 4.1,
        trendVsPrevious: 12.0,
      },
      {
        id: "mitsubishi",
        name: "Mitsubishi Air Conditioner",
        image: "/mitsubishi-aircon.png",
        status: "On",
        runtimeTodayHours: 3.0,
        energyTodayKwh: 0.5,
        usageTodayKwh: 0.5,
        trendVsPrevious: 5.0,
      },
    ],
  },
};

export const usageTimeSeriesDay: UsageDataPoint[] = [
  { time: "00:00", value: 0, isOn: false, districtAvg: 0.1, singaporeAvg: 0.15 },
  { time: "02:00", value: 0, isOn: false, districtAvg: 0.05, singaporeAvg: 0.08 },
  { time: "04:00", value: 0.2, isOn: true, districtAvg: 0.25, singaporeAvg: 0.3 },
  { time: "06:00", value: 0.4, isOn: true, districtAvg: 0.35, singaporeAvg: 0.4 },
  { time: "08:00", value: 0, isOn: false, districtAvg: 0.1, singaporeAvg: 0.12 },
  { time: "10:00", value: 0, isOn: false, districtAvg: 0.15, singaporeAvg: 0.18 },
  { time: "12:00", value: 0.3, isOn: true, districtAvg: 0.35, singaporeAvg: 0.4 },
  { time: "14:00", value: 0.6, isOn: true, isSpike: true, districtAvg: 0.55, singaporeAvg: 0.6 },
  { time: "16:00", value: 0.5, isOn: true, districtAvg: 0.5, singaporeAvg: 0.55 },
  { time: "18:00", value: 0.2, isOn: true, districtAvg: 0.25, singaporeAvg: 0.28 },
  { time: "20:00", value: 0.8, isOn: true, districtAvg: 0.75, singaporeAvg: 0.82 },
  { time: "22:00", value: 0.9, isOn: true, isSpike: true, districtAvg: 0.85, singaporeAvg: 0.92 },
];

export const usageTimeSeriesWeek: UsageDataPoint[] = [
  { time: "Mon", value: 4.2, isOn: true, districtAvg: 4.5, singaporeAvg: 4.8 },
  { time: "Tue", value: 5.1, isOn: true, isSpike: true, districtAvg: 4.8, singaporeAvg: 5.2 },
  { time: "Wed", value: 3.8, isOn: true, districtAvg: 4.2, singaporeAvg: 4.5 },
  { time: "Thu", value: 4.5, isOn: true, districtAvg: 4.6, singaporeAvg: 4.9 },
  { time: "Fri", value: 6.2, isOn: true, isSpike: true, districtAvg: 5.8, singaporeAvg: 6.2 },
  { time: "Sat", value: 5.8, isOn: true, districtAvg: 5.5, singaporeAvg: 5.9 },
  { time: "Sun", value: 4.0, isOn: true, districtAvg: 4.3, singaporeAvg: 4.6 },
];

export const usageTimeSeriesMonth: UsageDataPoint[] = [
  { time: "W1", value: 18.2, isOn: true, districtAvg: 19.5, singaporeAvg: 20.2 },
  { time: "W2", value: 22.1, isOn: true, isSpike: true, districtAvg: 21.0, singaporeAvg: 22.5 },
  { time: "W3", value: 19.5, isOn: true, districtAvg: 20.2, singaporeAvg: 21.0 },
  { time: "W4", value: 21.0, isOn: true, districtAvg: 20.8, singaporeAvg: 21.5 },
];

/** Per-appliance behaviour summary. */
export const behaviourSummariesByAppliance: Record<string, Record<string, BehaviourSummary>> = {
  "master-room": {
    ac: {
      mostCommonUsageTime: "8 PM – 11 PM",
      longestRuntimePeriod: "4.5 hours (Fri night)",
      highestUsageDay: "Friday",
      avgDailyRuntime: "3.2 hours",
    },
    mitsubishi: {
      mostCommonUsageTime: "2 PM – 5 PM",
      longestRuntimePeriod: "2 hours",
      highestUsageDay: "Saturday",
      avgDailyRuntime: "1.5 hours",
    },
  },
  "room-1": {
    ac: {
      mostCommonUsageTime: "10 PM – 1 AM",
      longestRuntimePeriod: "3.2 hours (Sat afternoon)",
      highestUsageDay: "Saturday",
      avgDailyRuntime: "2.1 hours",
    },
    mitsubishi: {
      mostCommonUsageTime: "All day",
      longestRuntimePeriod: "2 hours",
      highestUsageDay: "Weekdays",
      avgDailyRuntime: "2 hours",
    },
  },
  "room-2": {
    ac: {
      mostCommonUsageTime: "9 PM – 12 AM",
      longestRuntimePeriod: "5.8 hours (Thu night)",
      highestUsageDay: "Thursday",
      avgDailyRuntime: "4.0 hours",
    },
    dehumidifier: {
      mostCommonUsageTime: "Morning",
      longestRuntimePeriod: "0.5 hours",
      highestUsageDay: "N/A",
      avgDailyRuntime: "0.5 hours",
    },
  },
  "living-room": {
    ac: {
      mostCommonUsageTime: "6 PM – 10 PM",
      longestRuntimePeriod: "6.2 hours (Sun afternoon)",
      highestUsageDay: "Sunday",
      avgDailyRuntime: "5.1 hours",
    },
    mitsubishi: {
      mostCommonUsageTime: "6 PM – 9 PM",
      longestRuntimePeriod: "3 hours",
      highestUsageDay: "Weekends",
      avgDailyRuntime: "3 hours",
    },
  },
};

export const behaviourSummaries: Record<string, BehaviourSummary> = {
  "master-room": {
    mostCommonUsageTime: "8 PM – 11 PM",
    longestRuntimePeriod: "4.5 hours (Fri night)",
    highestUsageDay: "Friday",
    avgDailyRuntime: "3.2 hours",
  },
  "room-1": {
    mostCommonUsageTime: "10 PM – 1 AM",
    longestRuntimePeriod: "3.2 hours (Sat afternoon)",
    highestUsageDay: "Saturday",
    avgDailyRuntime: "2.1 hours",
  },
  "room-2": {
    mostCommonUsageTime: "9 PM – 12 AM",
    longestRuntimePeriod: "5.8 hours (Thu night)",
    highestUsageDay: "Thursday",
    avgDailyRuntime: "4.0 hours",
  },
  "living-room": {
    mostCommonUsageTime: "6 PM – 10 PM",
    longestRuntimePeriod: "6.2 hours (Sun afternoon)",
    highestUsageDay: "Sunday",
    avgDailyRuntime: "5.1 hours",
  },
};

/** Spikes per room per appliance. AC has data, others typically empty. */
export const spikeEventsByAppliance: Record<string, Record<string, SpikeEvent[]>> = {
  "master-room": {
    ac: [
      {
        id: "1",
        dateTime: "Mar 5, 2:15 PM",
        room: "Master Room",
        appliance: "Air Conditioner",
        magnitude: "+45%",
        cause: "Low temperature setting (22°C)",
      },
      {
        id: "2",
        dateTime: "Mar 3, 11:30 PM",
        room: "Master Room",
        appliance: "Air Conditioner",
        magnitude: "+38%",
        cause: "Long runtime (5+ hours)",
      },
    ],
    mitsubishi: [],
  },
  "room-1": {
    ac: [
      {
        id: "1",
        dateTime: "Mar 6, 10:00 PM",
        room: "Room 1",
        appliance: "Air Conditioner",
        magnitude: "+52%",
        cause: "Peak-hour usage",
      },
    ],
    mitsubishi: [],
  },
  "room-2": {
    ac: [
      {
        id: "1",
        dateTime: "Mar 4, 3:00 PM",
        room: "Room 2",
        appliance: "Air Conditioner",
        magnitude: "+41%",
        cause: "Sudden extended use",
      },
      {
        id: "2",
        dateTime: "Mar 2, 8:00 PM",
        room: "Room 2",
        appliance: "Air Conditioner",
        magnitude: "+28%",
        cause: "Low temperature setting (21°C)",
      },
    ],
    dehumidifier: [],
  },
  "living-room": {
    ac: [
      {
        id: "1",
        dateTime: "Mar 5, 7:30 PM",
        room: "Living Room",
        appliance: "Air Conditioner",
        magnitude: "+55%",
        cause: "Peak-hour usage",
      },
      {
        id: "2",
        dateTime: "Mar 1, 2:00 PM",
        room: "Living Room",
        appliance: "Air Conditioner",
        magnitude: "+62%",
        cause: "Long runtime (6+ hours)",
      },
    ],
    mitsubishi: [],
  },
};

export const spikeEventsMap: Record<string, SpikeEvent[]> = Object.fromEntries(
  Object.entries(spikeEventsByAppliance).map(([room, apps]) => [
    room,
    Object.values(apps).flat(),
  ])
);

export const comparisonDataMap: Record<string, ComparisonData> = {
  "master-room": {
    vsLastWeek: {
      label: "Your evening usage is 8% higher than last week",
      value: "+8%",
      isPositive: false,
    },
    vsLastMonth: {
      label: "12% lower than last month",
      value: "-12%",
      isPositive: true,
    },
    vsDistrictAvg: {
      label: "Your room uses 5% less than district average",
      value: "-5%",
      isPositive: true,
    },
    vsSingaporeAvg: {
      label: "Your monthly pattern is more consistent than Singapore average",
      value: "More consistent",
      isPositive: true,
    },
  },
  "room-1": {
    vsLastWeek: {
      label: "Your usage is 3% lower than last week",
      value: "-3%",
      isPositive: true,
    },
    vsLastMonth: {
      label: "15% lower than last month",
      value: "-15%",
      isPositive: true,
    },
    vsDistrictAvg: {
      label: "Your room uses 8% less than district average",
      value: "-8%",
      isPositive: true,
    },
    vsSingaporeAvg: {
      label: "Weekend usage is higher than Singapore average",
      value: "Higher on weekends",
      isPositive: false,
    },
  },
  "room-2": {
    vsLastWeek: {
      label: "Your evening usage is 12% higher than last week",
      value: "+12%",
      isPositive: false,
    },
    vsLastMonth: {
      label: "6% higher than last month",
      value: "+6%",
      isPositive: false,
    },
    vsDistrictAvg: {
      label: "Your room uses 3% more than district average",
      value: "+3%",
      isPositive: false,
    },
    vsSingaporeAvg: {
      label: "Your monthly pattern is more consistent than Singapore average",
      value: "More consistent",
      isPositive: true,
    },
  },
  "living-room": {
    vsLastWeek: {
      label: "Your evening usage is 12% higher than last week",
      value: "+12%",
      isPositive: false,
    },
    vsLastMonth: {
      label: "4% lower than last month",
      value: "-4%",
      isPositive: true,
    },
    vsDistrictAvg: {
      label: "Your room uses 8% less than district average",
      value: "-8%",
      isPositive: true,
    },
    vsSingaporeAvg: {
      label: "Living Room has the most consistent usage pattern",
      value: "Most consistent",
      isPositive: true,
    },
  },
};

/** Room total vs district vs Singapore (today's kWh). */
export const regionalComparisonMap: Record<string, RegionalComparison> = {
  "master-room": { yourKwh: 3.1, districtAvgKwh: 3.2, singaporeAvgKwh: 3.5 },
  "room-1": { yourKwh: 1.8, districtAvgKwh: 1.9, singaporeAvgKwh: 2.2 },
  "room-2": { yourKwh: 3.4, districtAvgKwh: 3.3, singaporeAvgKwh: 3.7 },
  "living-room": { yourKwh: 4.6, districtAvgKwh: 4.8, singaporeAvgKwh: 5.2 },
};

export const behaviourInsightsMap: Record<string, BehaviourInsight[]> = {
  "master-room": [
    {
      id: "1",
      text: "You usually turn on the air conditioner between 8 PM and 11 PM",
    },
    {
      id: "2",
      text: "Master Room shows the most spikes this month",
    },
  ],
  "room-1": [
    {
      id: "1",
      text: "You usually turn on the air conditioner between 10 PM and 1 AM",
    },
    {
      id: "2",
      text: "Weekend usage is higher than weekday usage",
    },
  ],
  "room-2": [
    {
      id: "1",
      text: "You usually turn on the air conditioner between 9 PM and 12 AM",
    },
    {
      id: "2",
      text: "Thursday shows the highest usage this month",
    },
  ],
  "living-room": [
    {
      id: "1",
      text: "You usually turn on the air conditioner between 6 PM and 10 PM",
    },
    {
      id: "2",
      text: "Living Room has the most consistent usage pattern",
    },
    {
      id: "3",
      text: "Weekend usage is higher than weekday usage",
    },
  ],
};
