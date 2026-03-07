interface RecommendationCardProps {
  title: string;
  description: string;
}

export function RecommendationCard({ title, description }: RecommendationCardProps) {
  return (
    <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-4 shadow-sm dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h4>
      <p className="mt-1 text-sm text-[#666666] dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
