"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  accent?: "emerald" | "sky" | "amber" | "zinc";
}

const accentColors = {
  emerald:
    "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-l-emerald-400",
  sky: "border-l-sky-500 bg-sky-50/50 dark:bg-sky-950/20 dark:border-l-sky-400",
  amber:
    "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 dark:border-l-amber-400",
  zinc: "border-l-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50 dark:border-l-zinc-500",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent = "zinc",
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200/80 border-l-4 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80 ${accentColors[accent]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-white/80 p-2 dark:bg-zinc-800/80">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <span
          className={`mt-2 inline-block text-xs font-medium ${
            trend === "up"
              ? "text-amber-600 dark:text-amber-400"
              : trend === "down"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-500"
          }`}
        >
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
        </span>
      )}
    </div>
  );
}
