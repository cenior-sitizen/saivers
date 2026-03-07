"use client";

import { useState } from "react";
import Link from "next/link";
import { VoucherCard } from "@/components/rewards/VoucherCard";
import { VoucherDetailModal } from "@/components/rewards/VoucherDetailModal";
import { FilterTabs, type VoucherFilter } from "@/components/rewards/FilterTabs";
import type { Voucher } from "../mockData";
import { vouchers, userPointsBalance } from "../mockData";

export default function VouchersPage() {
  const [filter, setFilter] = useState<VoucherFilter>("all");
  const [selected, setSelected] = useState<Voucher | null>(null);

  const filtered = vouchers.filter((v) => {
    if (filter === "all") return true;
    if (filter === "available") return v.status !== "redeemed";
    return v.status === "redeemed";
  });

  return (
    <div className="min-h-screen bg-[#F3F9F9] px-4 pb-24 dark:bg-zinc-950 sm:mx-auto sm:max-w-md sm:px-0">
      <Link
        href="/user/rewards"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[#666666] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Back
      </Link>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        🎫 Vouchers
      </h1>
      <p className="mb-6 text-sm text-[#666666] dark:text-zinc-400">
        {userPointsBalance} pts • Redeem rewards
      </p>
      <div className="mb-4">
        <FilterTabs value={filter} onChange={setFilter} />
      </div>
      <div className="space-y-3">
        {filtered.map((v) => (
          <VoucherCard
            key={v.id}
            id={v.id}
            title={v.title}
            brand={v.brand}
            pointsRequired={v.pointsRequired}
            status={v.status}
            userPoints={userPointsBalance}
            onSelect={() => setSelected(v)}
          />
        ))}
      </div>
      {selected && (
        <VoucherDetailModal
          title={selected.title}
          brand={selected.brand}
          pointsRequired={selected.pointsRequired}
          description={selected.description}
          expiryDate={selected.expiryDate}
          status={selected.status}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
