"use client";

import {
  BookOpen,
  BarChart3,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Gauge,
  GraduationCap,
  LogOut,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type WheelEvent,
} from "react";

import {
  createActivityType,
  createLanguageBoardAndRedirect,
  createStudyEntryBatch,
  createStudyEntry,
  deleteStudyEntry,
  type ResourceActionState,
  updateStudyEntry,
} from "@/app/dashboard/actions";
import { ActivityIcon } from "@/components/activities/activity-icon";
import { ConfirmSignOutForm } from "@/components/auth/confirm-sign-out-form";
import {
  CefrLevelPrompt,
  MissingLevelBubble,
} from "@/components/cefr/cefr-level-prompt";
import { ForecastCalculationHelp } from "@/components/cefr/forecast-calculation-help";
import {
  highestLevelDescription,
  progressForecastDescription,
} from "@/lib/cefr/copy";
import {
  fromDateKey,
  getCalendarCells,
  getCalendarRangeCells,
  shiftDate,
  studyHeatLevel,
  toDateKey,
} from "@/lib/dates/study-calendar";
import { getInclusiveDateCount } from "@/lib/resources/validation";
import {
  formatCalendarDuration,
  formatEstimatedMonth,
  formatForecastHours,
  formatPaceMinutes,
  type StudyTimeForecast,
  type StudyTimePaceEstimate,
} from "@/lib/cefr/study-time";
import { calculateStudyStatistics } from "@/lib/statistics/study-statistics";

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
  statisticsEntries: StudyEntrySummary[];
  earliestEntryDate: string | null;
  activeDateKeys: string[];
  selectedDate: string;
  year: number;
  todayKey: string;
  hasCurrentCefrLevel: boolean;
  studyTimeForecast: StudyTimeForecast;
};

const quickDurations = [10, 15, 20, 30, 45, 60, 90, 120];
const initialActionState: ResourceActionState = { status: "idle" };
const heatColors = {
  missed: "var(--study-heat-missed)",
  empty: "var(--study-heat-empty)",
  levels: [
    "var(--study-heat-1)",
    "var(--study-heat-2)",
    "var(--study-heat-3)",
    "var(--study-heat-4)",
    "var(--study-heat-5)",
    "var(--study-heat-6)",
  ],
};
function formatDuration(minutes: number, precise = false) {
  const roundedMinutes = precise ? Math.round(minutes) : minutes;
  if (roundedMinutes < 60) return `${roundedMinutes}m`;
  const hours = Math.floor(roundedMinutes / 60);
  const remainder = roundedMinutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function SummaryValue({
  value,
  accentClass = "text-blue-600",
}: {
  value: string | number;
  accentClass?: string;
}) {
  const tokens = String(value).split(" ");

  return (
    <strong
      className={`flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0.5 text-2xl leading-tight ${accentClass}`}
    >
      {tokens.map((token, index) => {
        const compactMatch = token.match(/^([≈><]?\d[\d,.]*)([a-zA-Z]+)$/);
        if (compactMatch) {
          return (
            <span
              key={`${token}-${index}`}
              className="inline-flex items-baseline"
            >
              <span>{compactMatch[1]}</span>
              <span className="ml-0.5 text-[0.65em] font-bold text-slate-500">
                {compactMatch[2]}
              </span>
            </span>
          );
        }

        if (/^[a-zA-Z]+$/.test(token)) {
          return (
            <span
              key={`${token}-${index}`}
              className="text-[0.65em] font-bold text-slate-500"
            >
              {token}
            </span>
          );
        }

        return <span key={`${token}-${index}`}>{token}</span>;
      })}
    </strong>
  );
}

function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(fromDateKey(dateKey));
}

function createOperationId() {
  if (typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10).join(""),
  ].join("-");
}

function formatCompactForecastValue(value: string) {
  return value.replace(/\s+(?:hour|hours)$/, " h");
}

function StudyTimeForecastCard({
  forecast,
  compact = false,
}: {
  forecast: StudyTimeForecast;
  compact?: boolean;
}) {
  if (forecast.status === "no-level") return null;

  if (forecast.status === "highest-level") {
    return (
      <section
        className={`${compact ? "mt-0 h-full" : "mx-auto mt-5 max-w-6xl"} rounded-3xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm sm:p-5`}
      >
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600">
            <Clock3 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Study Time progress
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-700">
              {highestLevelDescription(forecast.currentLevel)}
            </p>
            <p className="mt-4 text-sm font-bold tracking-wide text-slate-500 uppercase">
              Estimated total learning time
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              &gt; {formatForecastHours(forecast.estimatedTotalLearningMinutes)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const completedPercent = Math.round(forecast.progressRatio * 100);
  const paceColumns: StudyTimePaceEstimate[] = [
    forecast.sevenDayPace,
    forecast.thirtyDayPace,
  ];

  return (
    <section
      className={`${compact ? "mt-0 h-full" : "mx-auto mt-5 max-w-6xl"} rounded-3xl border border-blue-200 bg-white p-4 shadow-sm sm:p-5`}
    >
      <div className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Clock3 aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            Study Time progress
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {progressForecastDescription(
              forecast.currentLevel,
              forecast.nextLevel,
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Current
          </p>
          <p className="mt-2 flex min-h-11 items-center gap-2">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
              {forecast.currentLevel}
            </span>
            <span className="min-w-0 text-sm leading-5 text-slate-600">
              ≈{" "}
              {formatCompactForecastValue(
                formatForecastHours(forecast.baselineMinutes),
              )}
            </span>
          </p>
        </div>

        <div className="min-w-0 text-left md:text-center">
          <p className="text-xs font-bold tracking-wide text-blue-700 uppercase">
            Progress
          </p>
          <p className="mt-2 text-xl font-bold leading-6 text-slate-950">
            +{formatForecastHours(forecast.eligibleMinutes)}
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            ≈{" "}
            {formatCompactForecastValue(
              formatForecastHours(forecast.estimatedTotalLearningMinutes),
            )}{" "}
            now
          </p>
        </div>

        <div className="min-w-0 md:text-right">
          <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
            Next
          </p>
          <p className="mt-2 flex min-h-11 items-center gap-2 md:justify-end">
            <span className="min-w-0 text-sm leading-5 text-slate-600">
              ≈{" "}
              {formatCompactForecastValue(
                formatForecastHours(forecast.nextLevelBaselineMinutes),
              )}{" "}
              total
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
              {forecast.nextLevel}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${completedPercent}%` }}
          />
        </div>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-base font-bold text-blue-700">
          <span>{completedPercent}% completed</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-700">
            ≈ {formatForecastHours(forecast.remainingMinutes)} left
          </span>
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <h3 className="break-words text-base font-bold text-slate-700">
          Forecast to reach {forecast.nextLevel} with your current pace
        </h3>
        <div className="relative mt-4">
          <div className="w-full max-w-3xl overflow-x-auto rounded-2xl border border-white/70 bg-white/80">
            <div className="grid min-w-[440px] grid-cols-[1.05fr_1fr_1fr] border-b border-blue-100 text-sm font-bold text-slate-700">
              <div className="px-3 py-3 text-slate-500" />
              {paceColumns.map((pace) => (
                <div key={pace.periodDays} className="px-3 py-3">
                  Last {pace.periodDays} days
                </div>
              ))}
            </div>
            <div className="grid min-w-[440px] grid-cols-[1.05fr_1fr_1fr] border-b border-blue-100">
              <div className="px-3 py-3 text-sm text-slate-700">
                Active days
              </div>
              {paceColumns.map((pace) => (
                <div
                  key={pace.periodDays}
                  className="px-3 py-3 text-sm text-slate-700"
                >
                  {pace.entryDays} {pace.entryDays === 1 ? "day" : "days"}
                </div>
              ))}
            </div>
            <div className="grid min-w-[440px] grid-cols-[1.05fr_1fr_1fr] border-b border-blue-100">
              <div className="px-3 py-3 text-sm text-slate-700">
                Average pace
              </div>
              {paceColumns.map((pace) => (
                <div
                  key={pace.periodDays}
                  className="px-3 py-3 text-sm text-slate-700"
                >
                  {formatPaceMinutes(pace.averageMinutes)}
                </div>
              ))}
            </div>
            <div className="grid min-w-[440px] grid-cols-[1.05fr_1fr_1fr] border-b border-blue-100">
              <div className="px-3 py-3 text-sm text-slate-700">
                Reach {forecast.nextLevel} in
              </div>
              {paceColumns.map((pace) => (
                <div
                  key={pace.periodDays}
                  className="px-3 py-3 text-sm text-slate-700"
                >
                  {pace.estimate
                    ? `≈ ${formatCalendarDuration(pace.estimate.duration)}`
                    : "Not available"}
                </div>
              ))}
            </div>
            <div className="grid min-w-[440px] grid-cols-[1.05fr_1fr_1fr]">
              <div className="px-3 py-3 text-sm text-slate-700">
                Estimated date
              </div>
              {paceColumns.map((pace) => (
                <div
                  key={pace.periodDays}
                  className="px-3 py-3 text-sm text-slate-700"
                >
                  {pace.estimate
                    ? formatEstimatedMonth(pace.estimate.estimatedDate)
                    : "Not available"}
                </div>
              ))}
            </div>
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-1 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm md:hidden"
          >
            <ChevronRight className="size-4" />
          </span>
        </div>
      </div>

      <ForecastCalculationHelp
        effectiveDate={forecast.effectiveDate}
        mode="study"
      />
    </section>
  );
}

export function BoardWorkspace({
  boards,
  selectedBoard,
  activities,
  entries,
  statisticsEntries,
  earliestEntryDate,
  activeDateKeys,
  selectedDate,
  year,
  todayKey,
  hasCurrentCefrLevel,
  studyTimeForecast,
}: BoardWorkspaceProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [createMode, setCreateMode] = useState<"single" | "range">("single");
  const [duration, setDuration] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState("");
  const [activityId, setActivityId] = useState("");
  const [otherOpen, setOtherOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [rangeStart, setRangeStart] = useState(selectedDate);
  const [rangeEnd, setRangeEnd] = useState(selectedDate);
  const [rangeReviewOpen, setRangeReviewOpen] = useState(false);
  const [batchOperationId, setBatchOperationId] = useState<string | null>(null);
  const [entryState, entryAction, entryPending] = useActionState(
    createStudyEntry,
    initialActionState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateStudyEntry,
    initialActionState,
  );
  const [batchState, batchAction, batchPending] = useActionState(
    createStudyEntryBatch,
    initialActionState,
  );
  const [activityState, activityAction, activityPending] = useActionState(
    createActivityType,
    initialActionState,
  );
  const [boardState, boardAction, boardPending] = useActionState(
    createLanguageBoardAndRedirect,
    initialActionState,
  );
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

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
    if (batchState.status !== "success") return;
    const resetId = window.setTimeout(() => {
      setFormOpen(false);
      setEditingEntryId(null);
      setDuration(null);
      setCustomDuration("");
      setActivityId("");
      setOtherOpen(false);
      setCreateMode("single");
      setRangeReviewOpen(false);
      setBatchOperationId(null);
      router.refresh();
    }, 0);
    return () => window.clearTimeout(resetId);
  }, [batchState, router]);

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
  const trimmedBoardName = newBoardName.trim();
  const duplicateBoardName = boards.some(
    (board) => board.name.toLowerCase() === trimmedBoardName.toLowerCase(),
  );
  const boardLimitReached = boards.length >= 6;
  const canCreateBoard =
    trimmedBoardName.length > 0 &&
    trimmedBoardName.length <= 50 &&
    !duplicateBoardName &&
    !boardLimitReached;

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
  const statistics = useMemo(
    () => calculateStudyStatistics(statisticsEntries, year, todayKey),
    [statisticsEntries, year, todayKey],
  );
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
  const rangeCount =
    rangeStart && rangeEnd ? getInclusiveDateCount(rangeStart, rangeEnd) : 0;
  const rangeError =
    !rangeStart || !rangeEnd
      ? "Choose both dates."
      : rangeStart > rangeEnd
        ? "End date must be on or after the start date."
        : rangeStart.slice(0, 4) !== rangeEnd.slice(0, 4)
          ? "The date range must stay within one calendar year."
          : rangeCount > 366
            ? "The date range can contain at most 366 days."
            : null;

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
    setCreateMode("single");
    setRangeStart(selectedDate);
    setRangeEnd(selectedDate);
    setRangeReviewOpen(false);
    setBatchOperationId(null);
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
    setCreateMode("single");
    setRangeReviewOpen(false);
    setBatchOperationId(null);
    setFormOpen(true);
  }

  function preventWheelNumberChange(event: WheelEvent<HTMLInputElement>) {
    event.currentTarget.blur();
  }

  function selectCreateMode(mode: "single" | "range") {
    setCreateMode(mode);
    setRangeReviewOpen(false);
    setBatchOperationId(null);
    if (mode === "range") {
      setRangeStart(selectedDate);
      setRangeEnd(selectedDate);
    }
  }

  function openRangeReview() {
    if (!canSave || rangeError) return;
    setBatchOperationId(createOperationId());
    setRangeReviewOpen(true);
  }

  function renderEntryForm(className = "mt-4") {
    return (
      <div
        className={`${className} rounded-2xl border border-slate-200 p-4 sm:p-5`}
      >
        {!editingEntryId && (
          <div
            role="group"
            aria-label="Study session date mode"
            className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => selectCreateMode("single")}
              aria-pressed={createMode === "single"}
              className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${
                createMode === "single"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              Single day
            </button>
            <button
              type="button"
              onClick={() => selectCreateMode("range")}
              aria-pressed={createMode === "range"}
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                createMode === "range"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <CalendarRange aria-hidden="true" className="size-4" />
              Date range
            </button>
          </div>
        )}

        {rangeReviewOpen && !editingEntryId ? (
          <div aria-labelledby="range-review-heading">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
              <p className="text-sm font-semibold text-blue-700">
                REVIEW DATE RANGE
              </p>
              <h3
                id="range-review-heading"
                className="mt-1 text-xl font-bold text-slate-950"
              >
                Add {rangeCount} study{" "}
                {rangeCount === 1 ? "session" : "sessions"}?
              </h3>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Activity</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {activityById.get(activityId)?.name ??
                      availableActivities.find(
                        (activity) => activity.id === activityId,
                      )?.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Daily duration</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {formatDuration(Number(resolvedDuration))}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Inclusive dates</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {formatLongDate(rangeStart)} вЂ“ {formatLongDate(rangeEnd)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                One independent session will be added to every date. Existing
                sessions, including matching ones, will be kept.
              </p>
            </div>

            <form action={batchAction} className="mt-5 flex flex-wrap gap-2">
              <input
                type="hidden"
                name="operationId"
                value={batchOperationId ?? ""}
              />
              <input type="hidden" name="boardId" value={selectedBoard.id} />
              <input type="hidden" name="activityTypeId" value={activityId} />
              <input
                type="hidden"
                name="durationMinutes"
                value={resolvedDuration ?? ""}
              />
              <input type="hidden" name="startDate" value={rangeStart} />
              <input type="hidden" name="endDate" value={rangeEnd} />
              <button
                type="submit"
                disabled={batchPending}
                className="min-h-12 flex-1 rounded-xl bg-blue-600 px-5 font-semibold text-white disabled:bg-blue-300"
              >
                {batchPending ? "Adding sessions..." : "Confirm and add"}
              </button>
              <button
                type="button"
                disabled={batchPending}
                onClick={() => {
                  setRangeReviewOpen(false);
                  setBatchOperationId(null);
                }}
                className="min-h-12 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 hover:bg-white disabled:text-slate-400"
              >
                Back
              </button>
              <button
                type="button"
                disabled={batchPending}
                onClick={resetEntryForm}
                className="min-h-12 rounded-xl px-4 font-semibold text-slate-600 hover:bg-white disabled:text-slate-400"
              >
                Cancel
              </button>
            </form>
            {batchState.status === "error" && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {batchState.message}
              </p>
            )}
          </div>
        ) : (
          <>
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
              onWheel={preventWheelNumberChange}
              onChange={(event) => {
                setCustomDuration(event.target.value);
                setDuration(null);
              }}
              placeholder="Custom minutes"
              aria-label="Custom minutes"
              className="mt-3 min-h-11 w-full rounded-xl border border-dashed border-slate-400 px-4"
            />

            {createMode === "range" && !editingEntryId && (
              <fieldset className="mt-5">
                <legend className="font-semibold text-slate-950">
                  Date range
                </legend>
                <p className="mt-1 text-sm text-slate-500">
                  Both dates are included. The range must stay within one
                  calendar year.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700">
                    Start date
                    <input
                      type="date"
                      value={rangeStart}
                      onChange={(event) => {
                        setRangeStart(event.target.value);
                        setRangeReviewOpen(false);
                        setBatchOperationId(null);
                      }}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    End date
                    <input
                      type="date"
                      value={rangeEnd}
                      onChange={(event) => {
                        setRangeEnd(event.target.value);
                        setRangeReviewOpen(false);
                        setBatchOperationId(null);
                      }}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3"
                    />
                  </label>
                </div>
                {rangeError ? (
                  <p className="mt-2 text-sm text-red-700">{rangeError}</p>
                ) : (
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {rangeCount} {rangeCount === 1 ? "date" : "dates"} selected
                  </p>
                )}
              </fieldset>
            )}

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

            {createMode === "range" && !editingEntryId ? (
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={openRangeReview}
                  disabled={!canSave || Boolean(rangeError)}
                  className="min-h-12 flex-1 rounded-xl bg-blue-600 px-5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  Review range
                </button>
                <button
                  type="button"
                  onClick={resetEntryForm}
                  className="min-h-12 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
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
            )}
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
          </>
        )}
      </div>
    );
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
        className={`heatmap-cell ${compact ? "size-2.5 rounded-[2px]" : "h-[1.0625rem] w-full rounded-[3px]"} border ${
          cell.dateKey === selectedDate
            ? "heatmap-cell-selected border-slate-950 ring-1 ring-slate-950"
            : "border-white"
        } disabled:invisible`}
        style={{ backgroundColor: background }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex min-h-14 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
          <details className="group relative">
            <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 text-base font-bold text-slate-950 hover:bg-slate-50">
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
                  href={`/dashboard?board=${board.id}&date=${selectedDate}&today=${todayKey}`}
                  className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                    board.id === selectedBoard.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {board.name}
                </Link>
              ))}
              <div className="mt-2 border-t border-slate-100 pt-2">
                {boardLimitReached ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500">
                    You can have up to 6 active language boards. Remove one in
                    Settings before adding another.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBoardDialogOpen(true)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    Add language
                  </button>
                )}
              </div>
            </div>
          </details>

          <nav aria-label="Primary" className="hidden items-stretch sm:flex">
            <span className="flex min-h-14 items-center gap-2 border-b-2 border-blue-600 px-4 text-sm font-semibold text-blue-600">
              <Clock3 aria-hidden="true" className="size-4.5" />
              Study Time
            </span>
            <Link
              href={`/dashboard?board=${selectedBoard.id}&date=${selectedDate}&today=${todayKey}&tracker=vocabulary`}
              className="flex min-h-14 items-center gap-2 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
            >
              <BookOpen aria-hidden="true" className="size-4.5" />
              Vocabulary
            </Link>
            <Link
              href={`/cefr?board=${selectedBoard.id}&today=${todayKey}`}
              className="relative flex min-h-14 items-center gap-2 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-violet-700"
            >
              {!hasCurrentCefrLevel && <MissingLevelBubble />}
              <GraduationCap aria-hidden="true" className="size-4.5" />
              Level
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href={`/statistics?board=${selectedBoard.id}&year=${year}&today=${todayKey}`}
              className="hidden min-h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700 sm:flex"
            >
              <BarChart3 aria-hidden="true" className="size-4.5" />
              Statistics
            </Link>
            <Link
              href={`/settings?returnTo=${encodeURIComponent(
                `/dashboard?board=${selectedBoard.id}&date=${selectedDate}&today=${todayKey}`,
              )}`}
              aria-label="Settings"
              className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            >
              <Settings aria-hidden="true" className="size-4.5" />
            </Link>
            <ConfirmSignOutForm>
              <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              >
                <LogOut aria-hidden="true" className="size-4.5" />
              </button>
            </ConfirmSignOutForm>
          </div>
        </div>
        <nav
          aria-label="Mobile primary"
          className="grid grid-cols-4 border-t border-slate-100 sm:hidden"
        >
          <span className="flex min-h-12 items-center justify-center gap-1.5 border-b-2 border-blue-600 px-2 text-xs font-semibold text-blue-600">
            <Clock3 aria-hidden="true" className="size-4.5" />
            Study Time
          </span>
          <Link
            href={`/dashboard?board=${selectedBoard.id}&date=${selectedDate}&today=${todayKey}&tracker=vocabulary`}
            className="flex min-h-12 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
          >
            <BookOpen aria-hidden="true" className="size-4.5" />
            Vocabulary
          </Link>
          <Link
            href={`/cefr?board=${selectedBoard.id}&today=${todayKey}`}
            className="relative flex min-h-12 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-violet-700"
          >
            {!hasCurrentCefrLevel && <MissingLevelBubble />}
            <GraduationCap aria-hidden="true" className="size-4.5" />
            Level
          </Link>
          <Link
            href={`/statistics?board=${selectedBoard.id}&year=${year}&today=${todayKey}`}
            className="flex min-h-12 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          >
            <BarChart3 aria-hidden="true" className="size-4.5" />
            Statistics
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
        {boardDialogOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-language-heading"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4"
          >
            <form
              action={boardAction}
              onSubmit={(event) => {
                if (!canCreateBoard) event.preventDefault();
              }}
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            >
              <h2
                id="add-language-heading"
                className="text-lg font-bold text-slate-950"
              >
                Add language
              </h2>
              <label className="mt-4 block text-sm font-semibold text-slate-800">
                Language name
                <input
                  name="name"
                  required
                  maxLength={50}
                  autoComplete="off"
                  value={newBoardName}
                  onChange={(event) => setNewBoardName(event.target.value)}
                  placeholder="German"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              {duplicateBoardName && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  You already have an active board with this name.
                </p>
              )}
              {boardState.status === "error" && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {boardState.message}
                </p>
              )}
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBoardDialogOpen(false);
                    setNewBoardName("");
                  }}
                  className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canCreateBoard || boardPending}
                  className="min-h-11 flex-1 rounded-xl bg-blue-600 px-4 font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {boardPending ? "Adding..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        )}
        {!hasCurrentCefrLevel && (
          <div className="mb-6">
            <CefrLevelPrompt
              href={`/cefr?board=${selectedBoard.id}&today=${todayKey}`}
              accent="blue"
            />
          </div>
        )}

        <div className="mx-auto max-w-6xl">
          <section aria-labelledby="year-heading">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="Previous year"
                onClick={() => navigateYear(-1)}
                className="flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <ChevronLeft aria-hidden="true" className="size-4.5" />
              </button>
              <div className="w-32 text-center">
                <p className="h-4 text-xs leading-4 font-semibold tracking-wide text-blue-600 uppercase">
                  Minutes studied
                </p>
                <h1
                  id="year-heading"
                  className="mt-0.5 text-2xl leading-7 font-bold text-slate-950"
                >
                  {year}
                </h1>
              </div>
              <button
                type="button"
                aria-label="Next year"
                onClick={() => navigateYear(1)}
                className="flex size-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <ChevronRight aria-hidden="true" className="size-4.5" />
              </button>
            </div>

            <div className="mt-5 hidden overflow-x-auto pb-2 sm:block">
              <div className="grid min-w-[720px] grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2">
                <div />
                <div className="mb-2 flex justify-between px-0.5 text-xs text-slate-500">
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
                <div className="grid grid-rows-7 gap-1 text-[10px] leading-none text-slate-500">
                  {["M", "T", "W", "T", "F", "S", "S"].map((weekday, index) => (
                    <span
                      key={`${weekday}-${index}`}
                      className="flex h-[1.0625rem] items-center justify-center"
                    >
                      {weekday}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-[repeat(53,minmax(0,1fr))] grid-flow-col grid-rows-7 gap-1">
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
                  cells: getCalendarRangeCells(
                    `${year}-01-01`,
                    `${year}-06-30`,
                  ),
                },
                {
                  label: "Jul–Dec",
                  months: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                  cells: getCalendarRangeCells(
                    `${year}-07-01`,
                    `${year}-12-31`,
                  ),
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

            <div className="mt-3 text-center text-xs text-slate-500">
              <p>Minutes per day</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                {[
                  ["0", heatColors.missed],
                  ["1–14", heatColors.levels[0]],
                  ["15–29", heatColors.levels[1]],
                  ["30–59", heatColors.levels[2]],
                  ["60–119", heatColors.levels[3]],
                  ["120–180", heatColors.levels[4]],
                  ["181+", heatColors.levels[5]],
                ].map(([label, color]) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span
                      aria-hidden="true"
                      className="size-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-slate-200 p-3 text-center">
              <SummaryValue value={formatDuration(annualTotal)} />
              <span className="text-sm text-slate-500">Total ({year})</span>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 text-center">
              <SummaryValue value={activeDays} />
              <span className="text-sm text-slate-500">Days studied</span>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 text-center">
              <span className="inline-flex items-baseline justify-center gap-1">
                <Flame aria-hidden="true" className="size-5 text-orange-500" />
                <SummaryValue
                  value={`${currentStreak} ${
                    currentStreak === 1 ? "day" : "days"
                  }`}
                />
              </span>
              <span className="block text-sm text-slate-500">
                Current streak
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 text-center">
              <span className="inline-flex items-baseline justify-center gap-1">
                <Trophy aria-hidden="true" className="size-5 text-amber-500" />
                <SummaryValue
                  value={`${statistics.longestStreak} ${
                    statistics.longestStreak === 1 ? "day" : "days"
                  }`}
                />
              </span>
              <span className="block text-sm text-slate-500">
                Longest streak
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 text-center">
              <span className="inline-flex items-baseline justify-center gap-1">
                <Gauge aria-hidden="true" className="size-5 text-blue-600" />
                <SummaryValue
                  value={formatDuration(statistics.calendarDayAverage, true)}
                />
              </span>
              <span className="block text-sm text-slate-500">
                Average / calendar day
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 text-center">
              <span className="inline-flex items-baseline justify-center gap-1">
                <Gauge aria-hidden="true" className="size-5 text-blue-600" />
                <SummaryValue
                  value={formatDuration(statistics.activeDayAverage, true)}
                />
              </span>
              <span className="block text-sm text-slate-500">
                Average / active day
              </span>
            </div>
          </section>
        </div>

        <section className="mx-auto mt-7 max-w-3xl border-t border-slate-200 pt-5">
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

          {selectedEntries.length > 0 && (
            <p className="mt-5 text-right text-base text-slate-600">
              <strong className="text-2xl text-blue-600">
                {formatDuration(selectedTotal)}
              </strong>{" "}
              total
            </p>
          )}

          <div className="mt-4 space-y-3">
            {selectedEntries.map((entry) => (
              <div key={entry.id}>
                <article className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-700"
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
                {formOpen &&
                  editingEntryId === entry.id &&
                  renderEntryForm("mt-3")}
              </div>
            ))}
            {selectedEntries.length === 0 && (
              <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center">
                <Clock3
                  aria-hidden="true"
                  className="mx-auto size-7 text-slate-400"
                />
                <p className="mt-3 text-base font-semibold text-slate-800">
                  No study sessions yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Add the time you spent studying on this date.
                </p>
              </div>
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
                setCreateMode("single");
                setRangeStart(selectedDate);
                setRangeEnd(selectedDate);
                setRangeReviewOpen(false);
                setBatchOperationId(null);
                setFormOpen(true);
              }}
              className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus aria-hidden="true" className="size-5" />
              Add study session
            </button>
          ) : !editingEntryId ? (
            renderEntryForm()
          ) : null}
        </section>

        {studyTimeForecast.status !== "no-level" && (
          <div
            aria-hidden="true"
            className="mx-auto mt-8 max-w-6xl border-t border-slate-200"
          />
        )}

        <StudyTimeForecastCard forecast={studyTimeForecast} />
      </div>
    </main>
  );
}
