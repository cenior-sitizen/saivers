"use client";

import Link from "next/link";
import { ActivityItem } from "@/components/rewards/ActivityItem";
import { activityHistory } from "../mockData";

export default function ActivityPage() {
 return (
 <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
 <Link
 href="/user/rewards"
 className="mb-4 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-[#10363b]"
 >
 ← Back
 </Link>
 <h1 className="mb-2 text-2xl font-bold text-[#10363b]">
 📜 Activity
 </h1>
 <p className="mb-6 text-sm text-[#666666]">
 Recent wins
 </p>
 <div className="rounded-2xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] px-4">
 {activityHistory.map((item) => (
 <ActivityItem
 key={item.id}
 type={item.type}
 title={item.title}
 description={item.description}
 date={item.date}
 />
 ))}
 </div>
 </div>
 );
}
