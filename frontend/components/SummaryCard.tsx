interface SummaryCardProps {
 label: string;
 value: string;
}

export function SummaryCard({ label, value }: SummaryCardProps) {
 return (
 <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-4 shadow-sm">
 <p className="text-xs font-medium uppercase tracking-wide text-[#666666]">
 {label}
 </p>
 <p className="mt-2 text-lg font-semibold text-[#10363b]">
 {value}
 </p>
 </div>
 );
}
