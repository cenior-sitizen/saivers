import Link from "next/link";
import { RoomCard } from "@/components/RoomCard";
import { HomeTabs } from "@/components/HomeTabs";
import { homeRooms } from "./mockData";

function AirconImpactCard() {
  return (
    <Link
      href="/user/aircon-impact"
      className="flex items-center justify-between rounded-2xl border border-[#86CCD2]/40 bg-white px-4 py-3 shadow-sm transition-colors hover:border-[#86CCD2] dark:border-[#86CCD2]/30 dark:bg-zinc-900 dark:hover:border-[#86CCD2]/60"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#86CCD2]/30">
          <svg
            className="h-5 w-5 text-[#86CCD2]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div className="text-left">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">
            Aircon Impact
          </p>
          <p className="text-sm text-[#666666] dark:text-zinc-400">
            Usage, trends & savings
          </p>
        </div>
      </div>
      <svg
        className="h-5 w-5 text-[#666666] dark:text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}

export default function UserPage() {
  return (
    <div className="min-h-screen bg-[#F3F9F9] px-4 py-6 dark:bg-zinc-950 sm:mx-auto sm:max-w-md sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          My Home
        </h1>
        <p className="mt-1 text-sm text-[#666666] dark:text-zinc-400">
          Tap a room to view appliance usage insights
        </p>
      </div>

      <HomeTabs
        appliancesContent={
          <div className="flex flex-col gap-4">
            <AirconImpactCard />
          </div>
        }
        roomsContent={
          <div className="flex flex-col gap-4">
            {homeRooms.map((room) => (
              <RoomCard
                key={room.id}
                name={room.name}
                slug={room.slug}
              />
            ))}
          </div>
        }
      />
    </div>
  );
}
