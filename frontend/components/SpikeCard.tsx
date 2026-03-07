interface SpikeCardProps {
 time: string;
 description: string;
}

export function SpikeCard({ time, description }: SpikeCardProps) {
 return (
 <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
 <p className="text-xs font-medium text-amber-800">
 {time}
 </p>
 <p className="mt-0.5 text-sm text-[#666666]">
 {description}
 </p>
 </div>
 );
}
