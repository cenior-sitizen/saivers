import Link from "next/link";

/**
 * Design System — Saivers
 *
 * Documents all reusable components, colors, typography, and patterns used
 * across the Saivers frontend. Aligned with SP Group brand aesthetic.
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#007B8A]">
        {title}
      </h2>
      <div className="mb-4 h-px bg-[#86CCD2]/30" />
      {children}
    </section>
  );
}

function Swatch({ color, label, hex }: { color: string; label: string; hex: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`h-14 w-14 rounded-xl shadow-sm ${color}`} />
      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
      <p className="font-mono text-[10px] text-zinc-400">{hex}</p>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
        .ds-root { font-family: 'DM Sans', system-ui, sans-serif; }
        .ds-display { font-family: 'DM Serif Display', Georgia, serif; }
      `}</style>

      <div className="ds-root min-h-screen bg-[#F3F9F9] px-4 py-8 pb-16 dark:bg-zinc-950 sm:mx-auto sm:max-w-2xl sm:px-6">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-xs text-[#007B8A] hover:underline">← Back to Home</Link>
          <div className="mt-3 flex items-end gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#007B8A]">
                Saivers
              </p>
              <h1 className="ds-display text-4xl text-zinc-900 dark:text-zinc-50">
                Design System
              </h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            SP Group-aligned component library for the Saivers energy coaching platform.
          </p>
        </div>

        {/* Colors */}
        <Section title="Color Palette">
          <div className="flex flex-wrap gap-5">
            <Swatch color="bg-[#007B8A]" label="Primary" hex="#007B8A" />
            <Swatch color="bg-[#00A3AD]" label="Primary Light" hex="#00A3AD" />
            <Swatch color="bg-[#86CCD2]" label="Accent" hex="#86CCD2" />
            <Swatch color="bg-[#E0F4F5]" label="Surface Tint" hex="#E0F4F5" />
            <Swatch color="bg-[#F3F9F9]" label="Background" hex="#F3F9F9" />
            <Swatch color="bg-emerald-500" label="Success" hex="#10B981" />
            <Swatch color="bg-red-500" label="Alert" hex="#EF4444" />
            <Swatch color="bg-zinc-900 dark:bg-zinc-50" label="Text Primary" hex="#18181B" />
            <Swatch color="bg-zinc-400" label="Text Muted" hex="#A1A1AA" />
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="space-y-4 rounded-2xl border border-[#86CCD2]/30 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="mb-1 text-[10px] text-zinc-400">DM Serif Display — Display / Hero numbers</p>
              <p className="ds-display text-4xl text-zinc-900 dark:text-zinc-50">240 pts · S$5.00</p>
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            <div>
              <p className="mb-1 text-[10px] text-zinc-400">DM Sans 600 — Section headings</p>
              <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Energy Usage This Week</p>
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            <div>
              <p className="mb-1 text-[10px] text-zinc-400">DM Sans 500 — Card titles</p>
              <p className="text-base font-medium text-zinc-800 dark:text-zinc-200">Off-peak AC Habit</p>
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            <div>
              <p className="mb-1 text-[10px] text-zinc-400">DM Sans 400 — Body / descriptions</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Your air conditioning ran 7 hours overnight between 12am–5am at 20°C, contributing to a 40% increase in energy usage.</p>
            </div>
            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            <div>
              <p className="mb-1 text-[10px] text-zinc-400">Uppercase tracking — Labels / metadata</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#007B8A]">Energy Rewards · Weekly Insights</p>
            </div>
          </div>
        </Section>

        {/* Status badges */}
        <Section title="Status Badges">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "New", cls: "bg-sky-100 text-sky-700" },
              { label: "Read", cls: "bg-zinc-100 text-zinc-500" },
              { label: "Approved ✓", cls: "bg-emerald-100 text-emerald-700" },
              { label: "Dismissed", cls: "bg-zinc-100 text-zinc-400" },
              { label: "On", cls: "bg-emerald-100 text-emerald-700" },
              { label: "Off", cls: "bg-zinc-100 text-zinc-600" },
            ].map((b) => (
              <span key={b.label} className={`rounded-full px-3 py-1 text-xs font-medium ${b.cls}`}>
                {b.label}
              </span>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <button className="rounded-2xl bg-[#007B8A] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#007B8A]/20 transition-all hover:bg-[#006570] active:scale-[0.98]">
              Primary Action
            </button>
            <button className="rounded-2xl border border-[#86CCD2] px-5 py-2.5 text-sm font-semibold text-[#007B8A] transition-all hover:bg-[#E0F4F5] active:scale-[0.98]">
              Secondary
            </button>
            <button className="rounded-xl bg-[#86CCD2] px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90">
              Approve
            </button>
            <button className="rounded-xl border border-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50">
              Dismiss
            </button>
            <button disabled className="rounded-2xl bg-[#007B8A] px-5 py-2.5 text-sm font-semibold text-white opacity-40 cursor-not-allowed">
              Disabled
            </button>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="space-y-3">
            {/* Standard card */}
            <div className="rounded-2xl border border-[#86CCD2]/30 bg-white px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Standard Card</p>
              <p className="mt-1 text-xs text-zinc-400">border-[#86CCD2]/30, bg-white, rounded-2xl, shadow-sm</p>
            </div>

            {/* Teal gradient hero card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#007B8A] to-[#00A3AD] p-5 shadow-lg shadow-[#007B8A]/20">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)",
                }}
              />
              <p className="relative text-sm font-semibold text-white">Hero / Balance Card</p>
              <p className="relative mt-1 text-xs text-white/60">Used for primary balance, key metrics</p>
            </div>

            {/* Insight card */}
            <div className="rounded-2xl border border-[#86CCD2]/30 bg-sky-50/60 px-4 py-3 dark:bg-sky-950/20">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">AI Insight Card (unread)</p>
              <p className="mt-1 text-xs text-zinc-400">bg-sky-50/60 highlight for unread state</p>
            </div>

            {/* Approved confirmation card */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Approved Confirmation Card</p>
              <p className="mt-1 text-xs text-emerald-600">Used when AI recommendation has been approved</p>
            </div>

            {/* Metric tile */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Energy today", value: "2.4 kWh" },
                { label: "Runtime today", value: "6.5h" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-[#86CCD2]/20 bg-white px-3 py-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs text-zinc-400">{m.label}</p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Notification bell badge */}
        <Section title="Notification Bell">
          <div className="flex items-center gap-4 rounded-2xl border border-[#86CCD2]/30 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="relative">
              <div className="rounded-full p-2 text-zinc-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">3</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">NotificationBell</p>
              <p className="text-xs text-zinc-400">Red badge for unread count · Dropdown with insight cards</p>
            </div>
          </div>
        </Section>

        {/* Input / interactive */}
        <Section title="Interactive Patterns">
          <div className="space-y-3">
            {/* Household switcher preview */}
            <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Household Switcher</p>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#86CCD2]/40 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm dark:border-[#86CCD2]/20 dark:bg-zinc-800/80">
                <span className="h-2 w-2 rounded-full bg-[#86CCD2]" />
                Ahmad
                <svg className="h-3 w-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="mt-2 text-xs text-zinc-400">Dropdown with 3 demo personas: Ahmad (Waster), Priya (Moderate), Wei Ming (Champion)</p>
            </div>

            {/* Time range toggle */}
            <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Time Range Toggle</p>
              <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
                {["Day", "Week", "Month"].map((t, i) => (
                  <button
                    key={t}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
                      i === 1
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* SP Group Brand Reference */}
        <Section title="SP Group Brand Reference">
          <div className="rounded-2xl border border-[#86CCD2]/30 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-[#007B8A]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.72L13 17v5h5l-1.22-1.22C19.91 19.07 22 15.76 22 12c0-5.18-3.95-9.45-9-9.95zM11 2.05C5.95 2.55 2 6.82 2 12c0 3.76 2.09 7.07 5.22 8.78L6 22h5v-5l-2.28 2.28C7.81 18 6 15.21 6 12c0-4.08 3.05-7.44 7-7.93V2.05z"/>
              </svg>
              <span className="text-sm font-semibold text-[#007B8A]">SP Group Alignment</span>
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <li>· Primary teal <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">#007B8A</code> mirrors SP Group's brand teal</li>
              <li>· Clean white cards on pale teal background — civic digital service aesthetic</li>
              <li>· DM Serif Display for hero numbers — authority without being corporate cold</li>
              <li>· Uppercase tracking labels — aligns with utility/government service patterns</li>
              <li>· No decorative flourishes — function-forward, trust-building</li>
              <li>· Singapore-native date formatting (en-SG locale)</li>
            </ul>
          </div>
        </Section>

        {/* Component index */}
        <Section title="Component Index">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { name: "NotificationBell", path: "components/NotificationBell.tsx" },
              { name: "HouseholdSwitcher", path: "components/HouseholdSwitcher.tsx" },
              { name: "UserHeader", path: "components/UserHeader.tsx" },
              { name: "RoomCard", path: "components/RoomCard.tsx" },
              { name: "StatusSummaryCard", path: "components/StatusSummaryCard.tsx" },
              { name: "CollapsibleAppliance", path: "components/CollapsibleAppliance.tsx" },
              { name: "UsageBehaviourChart", path: "components/UsageBehaviourChart.tsx" },
              { name: "BehaviourSummaryCard", path: "components/BehaviourSummaryCard.tsx" },
              { name: "BehaviourInsightCard", path: "components/BehaviourInsightCard.tsx" },
              { name: "ComparisonInsightCard", path: "components/ComparisonInsightCard.tsx" },
              { name: "SpikeDetailCard", path: "components/SpikeDetailCard.tsx" },
              { name: "TimeRangeToggle", path: "components/TimeRangeToggle.tsx" },
              { name: "HomeTabs", path: "components/HomeTabs.tsx" },
              { name: "RegionalComparisonChart", path: "components/RegionalComparisonChart.tsx" },
            ].map((c) => (
              <div key={c.name} className="rounded-xl border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{c.name}</p>
                <p className="mt-0.5 font-mono text-[9px] text-zinc-400 truncate">{c.path}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
