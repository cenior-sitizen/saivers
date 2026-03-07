interface ChartDataPoint {
 label: string;
 value: number;
}

interface UsageChartProps {
 data: ChartDataPoint[];
 title: string;
}

export function UsageChart({ data, title }: UsageChartProps) {
 const maxValue = Math.max(...data.map((d) => d.value), 1);

 return (
 <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-5 shadow-sm">
 <h3 className="text-sm font-semibold text-[#10363b]">
 {title}
 </h3>
 <div className="mt-4 flex items-end gap-2">
 {data.map((point) => (
 <div key={point.label} className="flex flex-1 flex-col items-center">
 <div className="flex w-full flex-col items-center justify-end">
 <div
 className="w-full min-w-0 max-w-12 rounded-t-lg bg-[#86CCD2]/70 transition-all"
 style={{
 height: `${Math.max((point.value / maxValue) * 80, 8)}px`,
 }}
 />
 </div>
 <p className="mt-2 text-xs font-medium text-[#666666]">
 {point.label}
 </p>
 </div>
 ))}
 </div>
 </div>
 );
}
