const ROOMS = [
  { id: "master", name: "Master Room", slug: "master-room" },
  { id: "room1", name: "Room 1", slug: "room-1" },
  { id: "room2", name: "Room 2", slug: "room-2" },
  { id: "living", name: "Living Room", slug: "living-room" },
] as const;

function AirCondIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
      />
    </svg>
  );
}

export default function UserPage() {
  return (
    <div className="px-4 py-6 sm:mx-auto sm:max-w-md sm:px-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          My Home
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Tap a room to control the air conditioner
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {ROOMS.map((room) => (
          <div
            key={room.id}
            className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/50">
                <AirCondIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {room.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Air Conditioner
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Ready
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
