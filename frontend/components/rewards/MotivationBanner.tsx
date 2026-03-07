"use client";

import type { ReactElement } from "react";

interface MotivationBannerProps {
 message: string;
}

export function MotivationBanner({ message }: MotivationBannerProps): ReactElement {
 return (
 <div className="rounded-xl border border-[#86CCD2]/40 bg-[#86CCD2]/10 px-4 py-3">
 <p className="flex items-center gap-2 text-sm font-medium text-[#10363b]">
 <span className="text-lg">✨</span>
 {message}
 </p>
 </div>
 );
}
