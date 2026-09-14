"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  fromDateKey,
  getCalendarCells,
  getCalendarRangeCells,
} from "@/lib/dates/study-calendar";
import {
  getActivityHeatmapActivities,
  getActivityHeatmapDateKeys,
  type ActivityHeatmapActivity,
  type ActivityHeatmapEntry,
} from "@/lib/statistics/activity-heatmap";

const MIN_YEAR = 1900;
const MAX_YEAR = 9999;
const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"];

function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(fromDateKey(dateKey));
}

export function ActivityHeatmap({
  activities,
  entries,
  todayKey,
}: {
  activities: ActivityHeatmapActivity[];
  entries: ActivityHeatmapEntry[];
  todayKey: string;
}) {
  const [year, setYear] = useState(Number(todayKey.slice(0, 4)));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [openDate, setOpenDate] = useState<string | null>(null);
  const activatingCellRef = useRef<HTMLButtonElement | null>(null);
  const availableActivities = useMemo(
    () => getActivityHeatmapActivities(activities, entries),
    [activities, entries],
  );
  const matchingDates = useMemo(
    () => getActivityHeatmapDateKeys(entries, selectedIds, year),
    [entries, selectedIds, year],
  );
  const calendarCells = useMemo(() => getCalendarCells(year), [year]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Element &&
        !target.closest("[data-activity-heatmap-interactive]")
      ) {
        setOpenDate(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && openDate) {
        setOpenDate(null);
        requestAnimationFrame(() => activatingCellRef.current?.focus());
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDate]);

  function toggleActivity(activityId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  }

  function showDate(dateKey: string, target: HTMLButtonElement) {
    activatingCellRef.current = target;
    setOpenDate(dateKey);
  }

  function renderCell(
    cell: { dateKey: string; visible: boolean },
    compact: boolean,
  ) {
    if (!cell.visible) {
      return (
        <span
          key={cell.dateKey}
          aria-hidden="true"
          className={compact ? "size-2.5" : "h-[1.0625rem] w-full"}
        />
      );
    }
    const matches = matchingDates.has(cell.dateKey);
    const longDate = formatLongDate(cell.dateKey);
    const month = Number(cell.dateKey.slice(5, 7));
    const tooltipPosition =
      month <= 2
        ? "left-0"
        : month >= 11
          ? "right-0"
          : "left-1/2 -translate-x-1/2";
    return (
      <button
        key={cell.dateKey}
        type="button"
        data-activity-heatmap-interactive
        onClick={(event) => showDate(cell.dateKey, event.currentTarget)}
        aria-label={`${longDate}: ${matches ? "matching activity logged" : "no matching activity logged"}`}
        aria-expanded={openDate === cell.dateKey}
        className={`heatmap-cell relative ${compact ? "size-2.5 rounded-[2px]" : "h-[1.0625rem] w-full rounded-[3px]"} border border-white focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
        style={{
          backgroundColor: matches
            ? "var(--activity-heat-match)"
            : "var(--study-heat-empty)",
        }}
      >
        {openDate === cell.dateKey && (
          <span
            role="tooltip"
            data-activity-heatmap-interactive
            className={`pointer-events-none absolute bottom-full z-30 mb-2 w-max max-w-56 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-lg ${tooltipPosition}`}
          >
            {longDate}
          </span>
        )}
      </button>
    );
  }

  return (
    <section
      aria-labelledby="activity-heatmap-heading"
      className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="activity-heatmap-heading"
            className="text-xl font-bold text-slate-950"
          >
            Activity Heatmap
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
            Select activities to see the days when you logged at least one
            matching study session.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 self-center sm:self-start">
          <button
            type="button"
            aria-label="Previous activity heatmap year"
            disabled={year === MIN_YEAR}
            onClick={() => {
              setYear((value) => value - 1);
              setOpenDate(null);
            }}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft aria-hidden="true" className="size-4.5" />
          </button>
          <strong className="min-w-16 text-center text-xl text-slate-950">
            {year}
          </strong>
          <button
            type="button"
            aria-label="Next activity heatmap year"
            disabled={year === MAX_YEAR}
            onClick={() => {
              setYear((value) => value + 1);
              setOpenDate(null);
            }}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight aria-hidden="true" className="size-4.5" />
          </button>
        </div>
      </div>

      {availableActivities.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-600">
          No active activities have been used on this language board yet.
        </p>
      ) : (
        <>
          <fieldset className="mt-5">
            <legend className="sr-only">Activities to show</legend>
            <div className="flex flex-wrap gap-2">
              {availableActivities.map((activity) => (
                <label
                  key={activity.id}
                  className="flex min-w-0 max-w-full cursor-pointer items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(activity.id)}
                    onChange={() => toggleActivity(activity.id)}
                    className="mt-0.5 size-4 shrink-0 accent-blue-600"
                  />
                  <span className="min-w-0 break-words">{activity.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 hidden overflow-x-auto pb-2 sm:block">
            <div className="grid min-w-[720px] grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
              <div />
              <div className="mb-2 flex justify-between px-0.5 text-xs text-slate-500">
                {monthLabels.map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
              <div className="grid grid-rows-7 gap-1 text-[10px] leading-none text-slate-500">
                {weekdayLabels.map((weekday, index) => (
                  <span
                    key={`${weekday}-${index}`}
                    className="flex h-[1.0625rem] items-center justify-center"
                  >
                    {weekday}
                  </span>
                ))}
              </div>
              <div className="grid grid-flow-col grid-cols-[repeat(53,minmax(0,1fr))] grid-rows-7 gap-1">
                {calendarCells.map((cell) =>
                  renderCell(
                    { dateKey: cell.dateKey, visible: cell.inYear },
                    false,
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-5 sm:hidden">
            {[
              {
                label: "Jan–Jun",
                months: monthLabels.slice(0, 6),
                cells: getCalendarRangeCells(`${year}-01-01`, `${year}-06-30`),
              },
              {
                label: "Jul–Dec",
                months: monthLabels.slice(6),
                cells: getCalendarRangeCells(`${year}-07-01`, `${year}-12-31`),
              },
            ].map((half) => (
              <div key={half.label}>
                <h3 className="text-center text-sm font-semibold text-slate-600">
                  {half.label}
                </h3>
                <div className="mx-auto mt-2 w-max max-w-full">
                  <div className="mb-1.5 flex justify-between px-0.5 text-[9px] text-slate-500">
                    {half.months.map((month) => (
                      <span key={month}>{month}</span>
                    ))}
                  </div>
                  <div className="grid grid-flow-col grid-rows-7 gap-0.5">
                    {half.cells.map((cell) =>
                      renderCell(
                        { dateKey: cell.dateKey, visible: cell.inRange },
                        true,
                      ),
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-3 rounded-[3px] border border-slate-200"
                style={{ backgroundColor: "var(--study-heat-empty)" }}
              />
              No match
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-3 rounded-[3px]"
                style={{ backgroundColor: "var(--activity-heat-match)" }}
              />
              Matching activity logged
            </span>
          </div>
        </>
      )}
    </section>
  );
}
