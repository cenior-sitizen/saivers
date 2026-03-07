"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  accent?: "teal" | "emerald" | "sky" | "amber" | "zinc";
}

const ACCENT_STYLES: Record<
  NonNullable<StatCardProps["accent"]>,
  { bar: string; bg: string; icon: string }
> = {
  teal: {
    bar: "bg-[#00a3ad]",
    bg: "bg-[rgba(0,163,173,0.06)]",
    icon: "bg-[rgba(0,163,173,0.10)] text-[#007B8A]",
  },
  emerald: {
    bar: "bg-emerald-500",
    bg: "bg-emerald-50/60",
    icon: "bg-emerald-100 text-emerald-700",
  },
  sky: {
    bar: "bg-sky-500",
    bg: "bg-sky-50/60",
    icon: "bg-sky-100 text-sky-700",
  },
  amber: {
    bar: "bg-amber-500",
    bg: "bg-amber-50/60",
    icon: "bg-amber-100 text-amber-700",
  },
  zinc: {
    bar: "bg-[#6f8c91]",
    bg: "bg-[rgba(157,207,212,0.08)]",
    icon: "bg-[rgba(157,207,212,0.20)] text-[#4d6b70]",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent = "teal",
}: StatCardProps) {
  const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.teal;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[rgba(157,207,212,0.35)] bg-gradient-to-b from-white/95 to-[rgba(243,249,249,0.88)] p-5 shadow-[0_4px_16px_rgba(0,123,138,0.07)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,123,138,0.12)] ${styles.bg}`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${styles.bar}`} />

      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6f8c91]">
            {title}
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-[#10363b]">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[#6f8c91]">{subtitle}</p>
          )}
          {trend && (
            <span
              className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                trend === "up"
                  ? "text-amber-600"
                  : trend === "down"
                    ? "text-emerald-600"
                    : "text-[#6f8c91]"
              }`}
            >
              {trend === "up" ? "↑ Higher" : trend === "down" ? "↓ Lower" : "— Stable"}
            </span>
          )}
        </div>
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
