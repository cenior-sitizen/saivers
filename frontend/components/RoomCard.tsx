"use client";

import type { ReactElement } from "react";
import Link from "next/link";

interface RoomCardProps {
 name: string;
 slug: string;
}

function RoomIcon({ className }: { className?: string }): ReactElement {
 return (
 <svg
 className={className}
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
 />
 </svg>
 );
}

export function RoomCard({ name, slug }: RoomCardProps): ReactElement {
 return (
 <Link
 href={`/user/aircon/${slug}`}
 className="card-enter group relative flex items-center justify-between overflow-hidden rounded-2xl border border-[rgba(157,207,212,0.50)] bg-gradient-to-br from-[rgba(255,255,255,0.96)] to-[rgba(243,249,249,0.94)] px-4 py-4 shadow-[0_4px_20px_rgba(0,74,82,0.07)] backdrop-blur-sm transition-all duration-200 hover:border-[#86CCD2] hover:shadow-[0_8px_28px_rgba(0,123,138,0.14)] active:scale-[0.98] button-press"
 >
 {/* Subtle tidal shimmer on hover */}
 <div
 className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
 style={{
 background:
 "linear-gradient(135deg, rgba(134,204,210,0.08) 0%, transparent 60%)",
 }}
 />
 <div className="relative flex items-center gap-4">
 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#86CCD2]/25 to-[#007B8A]/15 transition-all duration-200 group-hover:from-[#86CCD2]/40 group-hover:to-[#007B8A]/25 group-hover:shadow-[0_4px_12px_rgba(0,123,138,0.18)]">
 <RoomIcon className="h-6 w-6 text-[#007B8A]" />
 </div>
 <div>
 <p className="font-semibold text-[#10363b]">{name}</p>
 <p className="text-sm text-[#4d6b70]">Tap to view appliances</p>
 </div>
 </div>
 <svg
 className="relative h-4 w-4 text-[#86CCD2] transition-transform duration-200 group-hover:translate-x-1"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2.5}
 d="M9 5l7 7-7 7"
 />
 </svg>
 </Link>
 );
}
