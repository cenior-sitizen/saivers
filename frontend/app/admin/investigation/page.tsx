export default function InvestigationPage() {
 const chatUrl =
 process.env.NEXT_PUBLIC_LIBRECHAT_URL || "http://localhost:3080";

 return (
 <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
 <div className="mb-6">
 <h1 className="text-2xl font-bold text-[#10363b]">
 AI Assistant
 </h1>
 <p className="mt-1 text-[#4d6b70]">
 Ask questions about energy data, anomalies, and regions — powered by
 ClickHouse and LibreChat
 </p>
 </div>

 <div
 className="overflow-hidden rounded-xl border border-[rgba(157,207,212,0.40)] bg-gradient-to-b from-[rgba(255,255,255,0.94)] to-[rgba(243,249,249,0.88)] shadow-[0_8px_24px_rgba(0,123,138,0.07)]"
 style={{ minHeight: "calc(100vh - 14rem)" }}
 >
 <iframe
 src={chatUrl}
 className="h-[calc(100vh-14rem)] w-full border-0"
 title="AI Assistant"
 sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
 />
 </div>
 </div>
 );
}
