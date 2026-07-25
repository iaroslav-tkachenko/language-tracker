"use client";

import {
  BookOpen,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  LogOut,
  Pencil,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import {
  createActivityType,
  createStudyEntry,
  deleteStudyEntry,
  type ResourceActionState,
  updateStudyEntry,
} from "@/app/dashboard/actions";
import { ActivityIcon } from "@/components/activities/activity-icon";
import { ConfirmSignOutForm } from "@/components/auth/confirm-sign-out-form";
import {
  fromDateKey,
  getCalendarCells,
  getCalendarRangeCells,
  shiftDate,
  studyHeatLevel,
  toDateKey,
} from "@/lib/dates/study-calendar";

type BoardSummary = { id: string; name: string };
type ActivitySummary = {
  id: string;
  name: string;
  systemKey: string | null;
  archived: boolean;
};
type StudyEntrySummary = {
  id: string;
  studyDate: string;
  durationMinutes: number;
  activityTypeId: string;
};
type BoardWorkspaceProps = {
  boards: BoardSummary[];
  selectedBoard: BoardSummary;
  activities: ActivitySummary[];
  entries: StudyEntrySummary[];
  earliestEntryDate: string | null;
  activeDateKeys: string[];
  selectedDate: string;
  year: number;
  todayKey: string;
};

const quickDurations = [10, 15, 20, 30, 45, 60, 90, 120];
const initialActionState: ResourceActionState = { status: "idle" };
const heatColors = {
  missed: "#f2aaa4",
  empty: "#f8fafc",
  levels: ["#fff1b8", "#ffe18a", "#f7c95e", "#b8d79c", "#78b76d", "#3f8249"],
};
function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(fromDateKey(dateKey));
}

export function BoardWorkspace({
  boards,
  selectedBoard,
  activities,
  entries,
  earliestEntryDate,
  activeDateKeys,
  selectedDate,
  year,
  todayKey,
}: BoardWorkspaceProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState("");
  const [activityId, setActivityId] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryState, entryAction, entryPending] = useActionState(
    createStudyEntry,
    initialActionState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateStudyEntry,
    initialActionState,
  );
  const [activityState, activityAction, activityPending] = useActionState(
    createActivityType,
    initialActionState,
  );

  useEffect(() => {
    if (entryState.status !== "success") return;
    const resetId = window.setTimeout(() => {
      setFormOpen(false);
      setEditingEntryId(null);
      setDuration(null);
      setCustomDuration("");
      setActivityId("");
      router.refresh();
    }, 0);
    return () => window.clearTimeout(resetId);
  }, [entryState, router]);

  useEffect(() => {
    if (updateState.status !== "success") return;
    const resetId = window.setTimeout(() => {
      setFormOpen(false);
      setEditingEntryId(null);
      setDuration(null);
      setCustomDuration("");
      setActivityId("");
      router.refresh();
    }, 0);
    return () => window.clearTimeout(resetId);
  }, [updateState, router]);

  useEffect(() => {
    if (!activityState.resourceId) return;
    const selectId = window.setTimeout(() => {
      setActivityId(activityState.resourceId ?? "");
      setOtherOpen(false);
      router.refresh();
    }, 0);
    return () => window.clearTimeout(selectId);
  }, [activityState, router]);

  const availableActivities = useMemo(() => {
    const active = activities.filter((activity) => !activity.archived);
    if (
      activityState.resourceId &&
      activityState.resourceName &&
      !active.some((activity) => activity.id === activityState.resourceId)
    ) {
      return [
        ...active,
        {
          id: activityState.resourceId,
          name: activityState.resourceName,
          systemKey: null,
          archived: false,
        },
      ];
    }
    return active;
  }, [activities, activityState]);

  const activityById = useMemo(
    () => new Map(activities.map((activity) => [activity.id, activity])),
    [activities],
  );
  const calendarCells = useMemo(() => getCalendarCells(year), [year]);
  const totalsByDate = useMemo(() => {
    const totals = new Map<string, number>();
    entries.forEach((entry) =>
      totals.set(
        entry.studyDate,
        (totals.get(entry.studyDate) ?? 0) + entry.durationMinutes,
      ),
    );
    return totals;
  }, [entries]);
  const selectedEntries = entries.filter(
    (entry) => entry.studyDate === selectedDate,
  );
  const selectedTotal = selectedEntries.reduce(
    (total, entry) => total + entry.durationMinutes,
    0,
  );
  const annualTotal = entries.reduce(
    (total, entry) => total + entry.durationMinutes,
    0,
  );
  const activeDays = new Set(
    entries
      .filter((entry) => entry.studyDate <= todayKey)
      .map((entry) => entry.studyDate),
  ).size;
  const activeDateKeySet = new Set(activeDateKeys);
  const latestEligibleDate = activeDateKeySet.has(todayKey)
    ? todayKey
    : shiftDate(todayKey, -1);
  let currentStreak = 0;
  let streakDate = latestEligibleDate;
  while (activeDateKeySet.has(streakDate)) {
    currentStreak += 1;
    streakDate = shiftDate(streakDate, -1);
  }
  const resolvedDuration = customDuration ? Number(customDuration) : duration;
  const canSave =
    Boolean(activityId) &&
    Number.isInteger(resolvedDuration) &&
    Number(resolvedDuration) >= 1 &&
    Number(resolvedDuration) <= 1440;

  function navigateToDate(dateKey: string) {
    router.replace(
      `/dashboard?board=${selectedBoard.id}&date=${dateKey}&today=${todayKey}`,
      { scroll: false },
    );
  }

  function resetEntryForm() {
    setFormOpen(false);
    setEditingEntryId(null);
    setDuration(null);
    setCustomDuration("");
    setActivityId("");
    setOtherOpen(false);
  }

  function beginEdit(entry: StudyEntrySummary) {
    setEditingEntryId(entry.id);
    setActivityId(entry.activityTypeId);
    if (quickDurations.includes(entry.durationMinutes)) {
      setDuration(entry.durationMinutes);
      setCustomDuration("");
    } else {
      setDuration(null);
      setCustomDuration(String(entry.durationMinutes));
    }
    setOtherOpen(false);
    setFormOpen(true);
  }

  function navigateYear(offset: number) {
    const nextYear = year + offset;
    const current = fromDateKey(selectedDate);
    const next = new Date(
      nextYear,
      current.getMonth(),
      Math.min(current.getDate(), 28),
    );
    navigateToDate(toDateKey(next));
  }

  function renderHeatCell(
    cell: { dateKey: string; visible: boolean },
    compact: boolean,
  ) {
    const minutes = totalsByDate.get(cell.dateKey) ?? 0;
    const isMissed =
      minutes === 0 &&
      earliestEntryDate !== null &&
      cell.dateKey >= earliestEntryDate &&
      cell.dateKey < todayKey;
    const background =
      minutes > 0
        ? heatColors.levels[studyHeatLevel(minutes) - 1]
        : isMissed
          ? heatColors.missed
          : heatColors.empty;

    return (
      <button
        key={cell.dateKey}
        type="button"
        disabled={!cell.visible}
        onClick={() => navigateToDate(cell.dateKey)}
        aria-label={`${formatLongDate(cell.dateKey)}: ${minutes} minutes`}
        title={`${formatLongDate(cell.dateKey)}: ${minutes} minutes`}
        className={`${compact ? "size-2.5 rounded-[2px]" : "size-3.5 rounded-[3px] sm:size-4"} border ${
          cell.dateKey === selectedDate
            ? "border-slate-950 ring-1 ring-slate-950"
            : "border-white"
        } disabled:invisible`}
        style={{ backgroundColor: background }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex min-h-17 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
          <details className="group relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-lg font-bold text-slate-950 hover:bg-slate-50">
              {selectedBoard.name}
              <span
                aria-hidden="true"
                className="text-sm text-slate-400 transition group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <div className="absolute top-full left-0 z-20 mt-2 min-w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/dashboard?board=${board.id}`}
                  className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                    board.id === selectedBoard.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {board.name}
                </Link>
              ))}
            </div>
          </details>

          <nav aria-label="Primary" className="hidden items-stretch sm:flex">
            <span className="flex min-h-17 items-center gap-2 border-b-3 border-blue-600 px-5 font-semibold text-blue-600">
              <Clock3 aria-hidden="true" className="size-5" />
              Study Time
            </span>
            <span
              aria-disabled="true"
              className="flex min-h-17 items-center gap-2 px-5 text-slate-400"
            >
              <BookOpen aria-hidden="true" className="size-5" />
              Vocabulary
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                Coming soon
              </span>
            </span>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href={`/statistics?board=${selectedBoard.id}&year=${year}&today=${todayKey}`}
              className="hidden min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700 sm:flex"
            >
              <BarChart3 aria-hidden="true" className="size-5" />
              Statistics
            </Link>
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            >
              <Settings aria-hidden="true" className="size-5" />
            </Link>
            <ConfirmSignOutForm className="sm:hidden">
              <button
                type="submit"
                aria-label="Sign out"
                className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              >
                <LogOut aria-hidden="true" className="size-5" />
              </button>
            </ConfirmSignOutForm>
            <ConfirmSignOutForm className="hidden sm:block">
              <button
                type="submit"
                className="min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              >
                Sign out
              </button>
            </ConfirmSignOutForm>
          </div>
        </div>
        <nav
          aria-label="Mobile primary"
          className="grid grid-cols-3 border-t border-slate-100 sm:hidden"
        >
          <span className="flex min-h-14 items-center justify-center gap-1.5 border-b-3 border-blue-600 px-2 text-xs font-semibold text-blue-600">
            <Clock3 aria-hidden="true" className="size-4.5" />
            Study Time
          </span>
          <span
            aria-disabled="true"
            className="flex min-h-14 flex-col items-center justify-center text-slate-400"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <BookOpen aria-hidden="true" className="size-4.5" />
              Vocabulary
            </span>
            <span className="text-[10px]">Coming soon</span>
          </span>
          <Link
            href={`/statistics?board=${selectedBoard.id}&year=${year}&today=${todayKey}`}
            className="flex min-h-14 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          >
            <BarChart3 aria-hidden="true" className="size-4.5" />
            Statistics
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <section aria-labelledby="year-heading">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => navigateYear(-1)}
              className="flex size-11 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <h1
              id="year-heading"
              className="min-w-24 text-center text-3xl font-bold text-slate-950"
            >
              {year}
            </h1>
            <button
              type="button"
              aria-label="Next year"
              onClick={() => navigateYear(1)}
              className="flex size-11 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="mt-6 hidden overflow-x-auto pb-2 sm:block">
            <div className="mx-auto w-max">
              <div className="mb-2 flex justify-between px-1 text-xs text-slate-500">
                {[
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
                ].map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
              <div className="grid grid-flow-col grid-rows-7 gap-1">
                {calendarCells.map((cell) =>
                  renderHeatCell(
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
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                cells: getCalendarRangeCells(`${year}-01-01`, `${year}-06-30`),
              },
              {
                label: "Jul–Dec",
                months: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                cells: getCalendarRangeCells(`${year}-07-01`, `${year}-12-31`),
              },
            ].map((halfYear) => (
              <div key={halfYear.label}>
                <h2 className="text-center text-sm font-semibold text-slate-600">
                  {halfYear.label}
                </h2>
                <div className="mx-auto mt-2 w-max max-w-full">
                  <div className="mb-1.5 flex justify-between px-0.5 text-[9px] text-slate-500">
                    {halfYear.months.map((month) => (
                      <span key={month}>{month}</span>
                    ))}
                  </div>
                  <div className="grid grid-flow-col grid-rows-7 gap-0.5">
                    {halfYear.cells.map((cell) =>
                      renderHeatCell(
                        {
                          dateKey: cell.dateKey,
                          visible: cell.inRange,
                        },
                        true,
                      ),
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            {[
              ["0 min", heatColors.missed],
              ["1–14", heatColors.levels[0]],
              ["15–29", heatColors.levels[1]],
              ["30–59", heatColors.levels[2]],
              ["60–119", heatColors.levels[3]],
              ["120–180", heatColors.levels[4]],
              ["181+", heatColors.levels[5]],
            ].map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-4 text-center">
            <strong className="block text-2xl text-blue-600">
              {formatDuration(annualTotal)}
            </strong>
            <span className="text-sm text-slate-500">Total ({year})</span>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-center">
            <strong className="block text-2xl text-blue-600">
              {activeDays}
            </strong>
            <span className="text-sm text-slate-500">Days studied</span>
          </div>
          <div className="col-span-2 rounded-2xl border border-slate-200 p-4 text-center sm:col-span-1">
            <strong className="inline-flex items-center gap-1 text-2xl text-blue-600">
              <Flame aria-hidden="true" className="size-5 text-orange-500" />
              {currentStreak}
            </strong>
            <span className="block text-sm text-slate-500">Current streak</span>
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-3xl border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => navigateToDate(shiftDate(selectedDate, -1))}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <div className="min-w-0 text-center">
              <h2 className="text-xl font-bold text-slate-950">
                {selectedDate === todayKey
                  ? "Today"
                  : formatLongDate(selectedDate)}
              </h2>
              {selectedDate === todayKey && (
                <p className="mt-1 text-sm text-slate-500">
                  {formatLongDate(selectedDate)}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Next day"
              onClick={() => navigateToDate(shiftDate(selectedDate, 1))}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>

          <p className="mt-5 text-right text-base text-slate-600">
            <strong className="text-2xl text-blue-600">
              {formatDuration(selectedTotal)}
            </strong>{" "}
            total
          </p>

          <div className="mt-4 space-y-3">
            {selectedEntries.map((entry) => (
              <article
                key={entry.id}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <ActivityIcon
                  systemKey={
                    activityById.get(entry.activityTypeId)?.systemKey ?? null
                  }
                  aria-hidden="true"
                  className="size-5 shrink-0 text-slate-500"
                />
                <strong className="text-lg text-slate-950">
                  {formatDuration(entry.durationMinutes)}
                </strong>
                <span className="min-w-0 flex-1 text-slate-600">
                  {activityById.get(entry.activityTypeId)?.name ??
                    "Archived activity"}
                </span>
                <button
                  type="button"
                  onClick={() => beginEdit(entry)}
                  aria-label={`Edit ${activityById.get(entry.activityTypeId)?.name ?? "study session"}`}
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-700"
                >
                  <Pencil aria-hidden="true" className="size-4.5" />
                </button>
                <form
                  action={deleteStudyEntry}
                  onSubmit={(event) => {
                    if (
                      !window.confirm(
                        "Delete this study session? This action cannot be undone.",
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="entryId" value={entry.id} />
                  <button
                    type="submit"
                    aria-label={`Delete ${activityById.get(entry.activityTypeId)?.name ?? "study session"}`}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 aria-hidden="true" className="size-4.5" />
                  </button>
                </form>
              </article>
            ))}
            {selectedEntries.length === 0 && (
              <p className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
                No study session for this day yet.
              </p>
            )}
          </div>

          {!formOpen ? (
            <button
              type="button"
              onClick={() => {
                setEditingEntryId(null);
                setDuration(null);
                setCustomDuration("");
                setActivityId("");
                setFormOpen(true);
              }}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-400 font-semibold text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
            >
              <Plus aria-hidden="true" className="size-5" />
              Add study session
            </button>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
              <h3 className="font-semibold text-slate-950">
                {editingEntryId ? "Edit study session" : "How long?"}
              </h3>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {quickDurations.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => {
                      setDuration(minutes);
                      setCustomDuration("");
                    }}
                    className={`min-h-11 rounded-xl border px-2 text-sm font-medium ${
                      duration === minutes && !customDuration
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={1440}
                inputMode="numeric"
                value={customDuration}
                onChange={(event) => {
                  setCustomDuration(event.target.value);
                  setDuration(null);
                }}
                placeholder="Custom minutes"
                aria-label="Custom minutes"
                className="mt-3 min-h-11 w-full rounded-xl border border-dashed border-slate-400 px-4"
              />

              <h3 className="mt-5 font-semibold text-slate-950">Activity</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableActivities.map((activity) => {
                  return (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => setActivityId(activity.id)}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium ${
                        activityId === activity.id
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <ActivityIcon
                        systemKey={activity.systemKey}
                        aria-hidden="true"
                        className="size-4"
                      />
                      {activity.name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setOtherOpen((current) => !current)}
                  className="inline-flex min-h-10 items-center gap-1 rounded-full border border-dashed border-slate-400 px-3 text-sm font-medium text-slate-600 hover:border-blue-500 hover:text-blue-700"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Other
                </button>
              </div>

              {otherOpen && (
                <form action={activityAction} className="mt-3 flex gap-2">
                  <input
                    name="name"
                    required
                    maxLength={50}
                    autoComplete="off"
                    placeholder="Custom activity name"
                    className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-4"
                  />
                  <button
                    type="submit"
                    disabled={activityPending}
                    className="rounded-xl bg-slate-900 px-4 font-semibold text-white disabled:bg-slate-400"
                  >
                    {activityPending ? "Adding..." : "Add"}
                  </button>
                </form>
              )}
              {activityState.status === "error" && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {activityState.message}
                </p>
              )}

              <form
                action={editingEntryId ? updateAction : entryAction}
                className="mt-6 flex gap-2"
              >
                {editingEntryId ? (
                  <input type="hidden" name="entryId" value={editingEntryId} />
                ) : (
                  <>
                    <input
                      type="hidden"
                      name="boardId"
                      value={selectedBoard.id}
                    />
                    <input
                      type="hidden"
                      name="studyDate"
                      value={selectedDate}
                    />
                  </>
                )}
                <input type="hidden" name="activityTypeId" value={activityId} />
                <input
                  type="hidden"
                  name="durationMinutes"
                  value={resolvedDuration ?? ""}
                />
                <button
                  type="submit"
                  disabled={
                    !canSave || (editingEntryId ? updatePending : entryPending)
                  }
                  className="min-h-12 flex-1 rounded-xl bg-blue-600 px-5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {editingEntryId
                    ? updatePending
                      ? "Updating..."
                      : "Update"
                    : entryPending
                      ? "Saving..."
                      : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetEntryForm}
                  className="min-h-12 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </form>
              {entryState.status === "error" && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {entryState.message}
                </p>
              )}
              {updateState.status === "error" && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {updateState.message}
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
