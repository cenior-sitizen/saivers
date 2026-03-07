import Link from "next/link";

export default function AdminLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <div className="min-h-screen bg-[#f3f9f9] ">
 <header className="sticky top-0 z-10 border-b border-[rgba(157,207,212,0.30)] bg-white/95 backdrop-blur /95">
 <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
 <Link
 href="/admin"
 className="text-lg font-semibold text-[#10363b]"
 >
 Energy Savings
 </Link>
 <div className="flex flex-wrap items-center gap-4 sm:gap-6">
 <Link
 href="/admin"
 className="text-sm font-medium text-[#4d6b70] hover:text-[#10363b]"
 >
 Dashboard
 </Link>
 <Link
 href="/admin/monitoring"
 className="text-sm font-medium text-[#4d6b70] hover:text-[#10363b]"
 >
 Monitoring
 </Link>
 <Link
 href="/admin/analytics"
 className="text-sm font-medium text-[#4d6b70] hover:text-[#10363b]"
 >
 Analytics
 </Link>
 <Link
 href="/admin/observability"
 className="text-sm font-medium text-[#4d6b70] hover:text-[#10363b]"
 >
 Observability
 </Link>
 <Link
 href="/admin/incidents"
 className="text-sm font-medium text-[#4d6b70] hover:text-[#10363b]"
 >
 Incidents
 </Link>
 <Link
 href="/admin/investigation"
 className="text-sm font-medium text-[#4d6b70] hover:text-[#10363b]"
 >
 AI Assistant
 </Link>
 <Link
 href="/admin/recommendations"
 className="text-sm font-medium text-[#4d6b70] hover:text-[#10363b]"
 >
 Recommendations
 </Link>
 <Link
 href="/admin/settings"
 className="text-sm font-medium text-[#4d6b70] hover:text-[#10363b]"
 >
 Settings
 </Link>
 <Link
 href="/"
 className="text-sm font-medium text-[#6f8c91] hover:text-[#007B8A]"
 >
 ← Home
 </Link>
 </div>
 </nav>
 </header>
 <main>{children}</main>
 </div>
 );
}
