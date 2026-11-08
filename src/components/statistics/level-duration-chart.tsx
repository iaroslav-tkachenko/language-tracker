import Link from "next/link";

import { getLevelPeriods } from "@/lib/cefr/history";
import { fromDateKey, shiftDate } from "@/lib/dates/study-calendar";

type Period = ReturnType<typeof getLevelPeriods>[number];

function dateLabel(key: string) {
  return fromDateKey(key).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function LevelDurationChart({
  periods,
  boardId,
}: {
  periods: Period[];
  boardId: string;
}) {
  const maximum = Math.max(...periods.map((period) => period.days), 1);
  return (
    <section
      aria-labelledby="level-duration-heading"
      className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="level-duration-heading"
            className="text-xl font-bold text-slate-950"
          >
            Time at each level
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Calendar time based on your level history.
          </p>
        </div>
        <Link
          className="text-sm font-semibold text-blue-700 hover:underline"
          href={`/cefr?board=${encodeURIComponent(boardId)}`}
        >
          View level history →
        </Link>
      </div>
      <div className="mt-5 divide-y divide-slate-100">
        {periods.map(
          ({
            event,
            previous,
            current,
            endExclusive,
            days,
            direction,
            duration,
          }) => {
            const color =
              direction === "up"
                ? "bg-emerald-600"
                : direction === "down"
                  ? "bg-red-500"
                  : "bg-slate-400";
            const label =
              direction === "up"
                ? `↑ ${previous?.level} to ${event.level} · Higher`
                : direction === "down"
                  ? `↓ ${previous?.level} to ${event.level} · Lower`
                  : "First recorded level";
            const labelColor =
              direction === "up"
                ? "text-emerald-700"
                : direction === "down"
                  ? "text-red-700"
                  : "text-slate-500";
            return (
              <div
                key={event.id}
                className="grid gap-3 py-4 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-slate-100 px-3 py-2 text-lg font-bold">
                    {event.level}
                  </span>
                  <div>
                    {current && (
                      <span className="mb-1 block text-xs font-bold text-violet-700">
                        Current
                      </span>
                    )}
                    <span className={`text-xs font-semibold ${labelColor}`}>
                      {label}
                    </span>
                  </div>
                </div>
                <div>
                  <div
                    aria-hidden="true"
                    className="h-3 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{
                        width: `${Math.max(1, (days / maximum) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {current
                      ? `Since ${dateLabel(event.effectiveDate)}`
                      : `${dateLabel(event.effectiveDate)} – ${dateLabel(shiftDate(endExclusive, -1))}`}
                  </p>
                </div>
                <strong className="text-sm text-slate-950 sm:text-base">
                  {duration}
                </strong>
              </div>
            );
          },
        )}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Each bar represents one continuous period. The current period is
        measured through today.
      </p>
    </section>
  );
}
