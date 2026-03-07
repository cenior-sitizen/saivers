interface RecommendationCardProps {
 title: string;
 description: string;
}

export function RecommendationCard({ title, description }: RecommendationCardProps) {
 return (
 <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-4 shadow-sm">
 <h4 className="font-semibold text-[#10363b]">{title}</h4>
 <p className="mt-1 text-sm text-[#666666]">
 {description}
 </p>
 </div>
 );
}
