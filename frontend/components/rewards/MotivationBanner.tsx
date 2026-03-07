"use client";

import type { ReactElement } from "react";

interface MotivationBannerProps {
  message: string;
}

export function MotivationBanner({ message }: MotivationBannerProps): ReactElement {
  return (
    <div className="rounded-xl border border-[#86CCD2]/40 bg-[#86CCD2]/10 px-4 py-3 dark:border-[#86CCD2]/20 dark:bg-[#86CCD2]/5">
      <p className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        <span className="text-lg">✨</span>
        {message}
      </p>
    </div>
  );
}
