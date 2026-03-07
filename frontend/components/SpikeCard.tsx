interface SpikeCardProps {
  time: string;
  description: string;
}

export function SpikeCard({ time, description }: SpikeCardProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/20">
      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
        {time}
      </p>
      <p className="mt-0.5 text-sm text-[#666666] dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
