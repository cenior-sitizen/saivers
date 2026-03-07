import { InfoButton } from "./InfoButton";

interface RecommendationCardProps {
  title: string;
  suggestion: string;
  reason: string;
  isApproved?: boolean;
  approvedCount?: number;
  optionsCount?: number;
  showInfoButton?: boolean;
}

export function RecommendationCard({
  title,
  suggestion,
  isApproved,
  approvedCount,
  optionsCount,
  showInfoButton = true,
}: RecommendationCardProps) {
  const badgeText =
    optionsCount && optionsCount > 1 && approvedCount !== undefined
      ? approvedCount === 0
        ? null
        : approvedCount === optionsCount
          ? "Approved"
          : `${approvedCount} of ${optionsCount} approved`
      : isApproved
        ? "Approved"
        : null;

  const isPartialApproval =
    badgeText && badgeText !== "Approved" && badgeText.includes(" of ");

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-colors ${
        isApproved
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20"
          : "border-[#86CCD2]/30 bg-white dark:border-[#86CCD2]/20 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4
          className={`min-w-0 flex-1 font-semibold ${
            isApproved ? "text-emerald-800 dark:text-emerald-300" : "text-zinc-900 dark:text-zinc-50"
          }`}
        >
          {title}
        </h4>
        <div className="flex shrink-0 items-center gap-2">
          {showInfoButton && <InfoButton />}
          {badgeText && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              isPartialApproval
                ? "bg-[#86CCD2]/20 text-[#007B8A] dark:bg-[#86CCD2]/20 dark:text-[#86CCD2]"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
            }`}
          >
            {badgeText}
          </span>
          )}
        </div>
      </div>
      <p
        className={`mt-1 text-sm ${
          isApproved ? "text-emerald-700 dark:text-emerald-400" : "text-[#666666] dark:text-zinc-400"
        }`}
      >
        {suggestion}
      </p>
    </div>
  );
}
