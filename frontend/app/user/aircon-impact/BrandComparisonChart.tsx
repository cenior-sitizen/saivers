"use client";

export function BrandComparisonChart() {
  return (
    <div className="mb-6 rounded-2xl border border-[#86CCD2]/30 bg-white p-5 dark:border-[#86CCD2]/20 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        AC brand comparison
      </h3>
      <p className="mt-2 text-xs text-[#666666] dark:text-zinc-400">
        Compare energy usage across brands (e.g. Xiaomi vs Samsung) in your household.
      </p>
      <div className="mt-6 flex h-[120px] items-center justify-center rounded-xl border border-dashed border-[#86CCD2]/40 bg-[#86CCD2]/5 dark:border-[#86CCD2]/20 dark:bg-[#86CCD2]/5">
        <span className="text-sm font-medium text-[#666666] dark:text-zinc-500">N/A</span>
      </div>
      <p className="mt-2 text-xs text-[#666666] dark:text-zinc-400">
        Brand data not yet available. Connect devices to see comparison.
      </p>
    </div>
  );
}
