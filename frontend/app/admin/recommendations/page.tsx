export default function RecommendationsPage() {
 return (
 <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
 <div className="mb-8">
 <h1 className="text-2xl font-bold text-[#10363b]">
 Recommendations
 </h1>
 <p className="mt-1 text-[#4d6b70]">
 AI-generated operational next steps — investigate region, verify telemetry, check infrastructure
 </p>
 </div>

 <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
 <div className="rounded-xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] p-6 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
 <h3 className="text-sm font-medium text-[#6f8c91]">
 Investigate region
 </h3>
 <p className="mt-2 text-[#10363b]">
 —
 </p>
 <p className="mt-1 text-xs text-[#6f8c91]">
 Suggested area to inspect
 </p>
 </div>
 <div className="rounded-xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] p-6 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
 <h3 className="text-sm font-medium text-[#6f8c91]">
 Verify telemetry
 </h3>
 <p className="mt-2 text-[#10363b]">
 —
 </p>
 <p className="mt-1 text-xs text-[#6f8c91]">
 Check data sources
 </p>
 </div>
 <div className="rounded-xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] p-6 shadow-[0_8px_24px_rgba(0,123,138,0.07)]">
 <h3 className="text-sm font-medium text-[#6f8c91]">
 Review demand changes
 </h3>
 <p className="mt-2 text-[#10363b]">
 —
 </p>
 <p className="mt-1 text-xs text-[#6f8c91]">
 Recent pattern shifts
 </p>
 </div>
 </div>

 <div className="mt-8 rounded-xl border border-dashed border-[rgba(157,207,212,0.40)] bg-[#f3f9f9]/50 p-12 text-center">
 <p className="text-[#6f8c91]">
 Recommendation list — drive from AI analysis and ClickHouse insights
 </p>
 </div>
 </div>
 );
}
