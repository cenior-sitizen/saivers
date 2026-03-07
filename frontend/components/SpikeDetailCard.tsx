import type { ReactElement } from "react";

interface SpikeDetailCardProps {
  dateTime: string;
  room: string;
  appliance: string;
  magnitude: string;
  cause: string;
  explanation?: string;
  estimatedCostSgd?: number;
}

export function SpikeDetailCard({
  dateTime,
  room,
  appliance,
  magnitude,
  cause,
  explanation,
  estimatedCostSgd,
}: SpikeDetailCardProps): ReactElement {
  const bodyText = explanation ?? cause;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-amber-800">{dateTime}</p>
          <p className="mt-0.5 text-sm text-[#666666]">
            {room} • {appliance}
          </p>
          <p className="mt-2 text-sm font-medium text-[#10363b]">{bodyText}</p>
          {estimatedCostSgd != null && (
            <p className="mt-1 text-xs text-amber-700">
              Est. cost:{" "}
              <span className="font-semibold">
                S${estimatedCostSgd.toFixed(3)}
              </span>
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800">
          {magnitude}
        </span>
      </div>
    </div>
  );
}
