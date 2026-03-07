/**
 * Mock data for Rewards system.
 * All data is display-only; backend provides computed values.
 */

export interface PointsMilestone {
  id: string;
  points: number;
  reward: string;
  achieved: boolean;
}

export interface HowToEarn {
  id: string;
  title: string;
  points: string;
  achieved: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  dateEarned?: string;
  icon: string;
}

export interface Voucher {
  id: string;
  title: string;
  brand: string;
  pointsRequired: number;
  status: "locked" | "almost" | "redeemable" | "redeemed";
  expiryDate?: string;
  description?: string;
}

export interface ActivityItem {
  id: string;
  type: "points" | "streak" | "badge" | "voucher";
  title: string;
  description: string;
  date: string;
  icon: string;
}

export interface StreakDay {
  date: string;
  achieved: boolean;
}

export const userPointsBalance = 185;
export const currentStreak = 5;
export const longestStreak = 7;
export const energySavedThisWeek = "12.4 kWh";
export const currentTier = "Smart Saver";
export const nextMilestonePoints = 250;
export const pointsToNextMilestone = 65;
export const voucherEligibility = true;

export const weeklyProgress = {
  energySaved: "12.4 kWh",
  pointsEarned: 45,
  daysOnTarget: 4,
  streakDays: 5,
};

export const pointsMilestones: PointsMilestone[] = [
  { id: "1", points: 100, reward: "Coffee voucher", achieved: true },
  { id: "2", points: 250, reward: "Shopping voucher", achieved: false },
  { id: "3", points: 500, reward: "Premium eco reward", achieved: false },
];

export const howToEarnPoints: HowToEarn[] = [
  { id: "1", title: "Reduced usage vs last week", points: "+15 pts", achieved: true },
  { id: "2", title: "Stayed below target", points: "+10 pts", achieved: true },
  { id: "3", title: "Maintained streak", points: "+5 pts", achieved: true },
  { id: "4", title: "Avoided peak-hour overuse", points: "+20 pts", achieved: false },
];

export const badges: Badge[] = [
  { id: "1", title: "First Saver", description: "First energy save", unlocked: true, dateEarned: "Mar 1", icon: "leaf" },
  { id: "2", title: "7-Day Streak", description: "7 days in a row", unlocked: false, icon: "flame" },
  { id: "3", title: "Peak Hour Hero", description: "Avoided peak overuse", unlocked: false, icon: "bolt" },
  { id: "4", title: "Consistent Cooler", description: "5 days under target", unlocked: true, dateEarned: "Mar 5", icon: "snow" },
  { id: "5", title: "Energy Champion", description: "500 pts", unlocked: false, icon: "trophy" },
];

export const vouchers: Voucher[] = [
  {
    id: "1",
    title: "S$5 Coffee Voucher",
    brand: "Partner Café",
    pointsRequired: 100,
    status: "redeemed",
    expiryDate: "Apr 30, 2025",
    description: "Redeem for any coffee at Partner Café outlets.",
  },
  {
    id: "2",
    title: "S$10 Shopping Voucher",
    brand: "Retail Partner",
    pointsRequired: 250,
    status: "almost",
    expiryDate: "May 31, 2025",
    description: "Use at any Retail Partner store.",
  },
  {
    id: "3",
    title: "S$20 Eco Bundle",
    brand: "Green Store",
    pointsRequired: 500,
    status: "locked",
    expiryDate: "Jun 30, 2025",
    description: "Premium eco-friendly product bundle.",
  },
  {
    id: "4",
    title: "S$3 Snack Voucher",
    brand: "Convenience Store",
    pointsRequired: 50,
    status: "redeemable",
    expiryDate: "Apr 15, 2025",
    description: "Any snack under S$3.",
  },
];

export const motivationMessages = [
  "Saved more than last week ✨",
  "Keep the streak alive 🔥",
  "65 pts to next reward",
  "4 days under target 🎯",
];

export const activityHistory: ActivityItem[] = [
  { id: "1", type: "points", title: "+15 pts", description: "Evening usage down", date: "Today", icon: "points" },
  { id: "2", type: "streak", title: "5-day streak 🔥", description: "Consistent savings", date: "Yesterday", icon: "streak" },
  { id: "3", type: "badge", title: "Consistent Cooler", description: "5 days under target", date: "Mar 5", icon: "badge" },
  { id: "4", type: "voucher", title: "Coffee voucher", description: "Redeemed", date: "Mar 3", icon: "voucher" },
  { id: "5", type: "points", title: "+10 pts", description: "Below target", date: "Mar 4", icon: "points" },
];

export const streakCalendarLast7: StreakDay[] = [
  { date: "Mon", achieved: true },
  { date: "Tue", achieved: true },
  { date: "Wed", achieved: false },
  { date: "Thu", achieved: true },
  { date: "Fri", achieved: true },
  { date: "Sat", achieved: true },
  { date: "Sun", achieved: true },
];

export const streakCalendarLast30: StreakDay[] = Array.from({ length: 30 }, (_, i) => ({
  date: `${i + 1}`,
  achieved: i >= 20 && i !== 22,
}));
