"use client";

import {
  BarChart3,
  BookOpen,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Gauge,
  LogOut,
  Pencil,
  Plus,
  Settings,
  Trash2,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

import {
  createVocabularyTotalBatch,
  deleteVocabularyDailyTotal,
  type ResourceActionState,
  saveVocabularyDailyTotal,
} from "@/app/dashboard/actions";
import { ConfirmSignOutForm } from "@/components/auth/confirm-sign-out-form";
import {
  fromDateKey,
  getCalendarCells,
  getCalendarRangeCells,
  shiftDate,
  toDateKey,
} from "@/lib/dates/study-calendar";
import { getInclusiveDateCount } from "@/lib/resources/validation";
import {
  calculateVocabularyStatistics,
  isVocabularyMissedDate,
  vocabularyHeatLevel,
} from "@/lib/vocabulary/vocabulary-statistics";

type BoardSummary = { id: string; name: string };
type VocabularyTotalSummary = {
  id: string;
  studyDate: string;
  wordsLearned: number;
};
type VocabularyWorkspaceProps = {
  boards: BoardSummary[];
  selectedBoard: BoardSummary;
  totals: VocabularyTotalSummary[];
  selectedDate: string;
  year: number;
  todayKey: string;
  reviewMode?: boolean;
};

const initialActionState: ResourceActionState = { status: "idle" };
const heatColors = [
  "#f8fafc",
  "#dcfce7",
  "#bbf7d0",
  "#86efac",
  "#4ade80",
  "#22c55e",
  "#15803d",
  "#166534",
];
const missedColor = "#f2aaa4";

function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(fromDateKey(dateKey));
}

function wordsLabel(words: number) {
  return `${words.toLocaleString("en")} ${words === 1 ? "word" : "words"}`;
}

function formatAverage(value: number) {
  return value.toLocaleString("en", {
    minimumFractionDigits: value > 0 && value < 1 ? 1 : 0,
    maximumFractionDigits: 1,
  });
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

export function VocabularyWorkspace({
  boards,
  selectedBoard,
  totals,
  selectedDate,
  year,
  todayKey,
  reviewMode = false,
}: VocabularyWorkspaceProps) {
  const router = useRouter();
  const [reviewDate, setReviewDate] = useState(selectedDate);
  const [reviewBoard, setReviewBoard] = useState(selectedBoard);
  const [reviewTotalsByBoard, setReviewTotalsByBoard] = useState<
    Record<string, VocabularyTotalSummary[]>
  >({ [selectedBoard.id]: totals });
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"single" | "range">("single");
  const [editing, setEditing] = useState(false);
  const [wordsLearned, setWordsLearned] = useState("");
  const [rangeStart, setRangeStart] = useState(selectedDate);
  const [rangeEnd, setRangeEnd] = useState(selectedDate);
  const [rangeReviewOpen, setRangeReviewOpen] = useState(false);
  const [batchOperationId, setBatchOperationId] = useState<string | null>(null);
  const [actionState, action, pending] = useActionState(
    saveVocabularyDailyTotal,
    initialActionState,
  );
  const [batchState, batchAction, batchPending] = useActionState(
    createVocabularyTotalBatch,
    initialActionState,
  );

  useEffect(() => {
    if (actionState.status !== "success") return;
    const resetId = window.setTimeout(() => {
      setFormOpen(false);
      setEditing(false);
      setWordsLearned("");
      router.refresh();
    }, 0);
    return () => window.clearTimeout(resetId);
  }, [actionState, router]);

  useEffect(() => {
    if (batchState.status !== "success") return;
    const resetId = window.setTimeout(() => {
      closeForm();
      router.refresh();
    }, 0);
    return () => window.clearTimeout(resetId);
  }, [batchState, router]);

  const activeDate = reviewMode ? reviewDate : selectedDate;
  const activeYear = reviewMode ? Number(reviewDate.slice(0, 4)) : year;
  const activeBoard = reviewMode ? reviewBoard : selectedBoard;
  const visibleTotals = useMemo(
    () => (reviewMode ? (reviewTotalsByBoard[activeBoard.id] ?? []) : totals),
    [activeBoard.id, reviewMode, reviewTotalsByBoard, totals],
  );
  const calendarCells = useMemo(
    () => getCalendarCells(activeYear),
    [activeYear],
  );
  const totalByDate = useMemo(
    () => new Map(visibleTotals.map((total) => [total.studyDate, total])),
    [visibleTotals],
  );
  const statistics = useMemo(
    () => calculateVocabularyStatistics(visibleTotals, activeYear, todayKey),
    [visibleTotals, activeYear, todayKey],
  );
  const earliestPositiveDate = useMemo(
    () =>
      visibleTotals
        .filter((total) => total.wordsLearned > 0)
        .map((total) => total.studyDate)
        .sort()[0] ?? null,
    [visibleTotals],
  );
  const selectedTotal = totalByDate.get(activeDate) ?? null;
  const parsedWords = Number(wordsLearned);
  const canSave =
    wordsLearned.trim() !== "" &&
    Number.isInteger(parsedWords) &&
    parsedWords >= 0 &&
    parsedWords <= 2_147_483_647;
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
  const preservedPreviewCount = visibleTotals.filter(
    (total) => total.studyDate >= rangeStart && total.studyDate <= rangeEnd,
  ).length;
  const newPreviewCount = Math.max(0, rangeCount - preservedPreviewCount);

  function navigateToDate(dateKey: string) {
    if (reviewMode) {
      setReviewDate(dateKey);
      closeForm();
      return;
    }
    router.replace(
      `/dashboard?board=${activeBoard.id}&date=${dateKey}&today=${todayKey}&tracker=vocabulary`,
      { scroll: false },
    );
  }

  function navigateYear(offset: number) {
    const nextYear = activeYear + offset;
    const current = fromDateKey(activeDate);
    const next = new Date(
      nextYear,
      current.getMonth(),
      Math.min(current.getDate(), 28),
    );
    navigateToDate(toDateKey(next));
  }

  function openCreate(mode: "single" | "range" = "single") {
    setEditing(false);
    setWordsLearned("");
    setFormMode(mode);
    setRangeStart(activeDate);
    setRangeEnd(activeDate);
    setRangeReviewOpen(false);
    setBatchOperationId(null);
    setFormOpen(true);
  }

  function openEdit() {
    if (!selectedTotal) return;
    setEditing(true);
    setFormMode("single");
    setWordsLearned(String(selectedTotal.wordsLearned));
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(false);
    setWordsLearned("");
    setFormMode("single");
    setRangeReviewOpen(false);
    setBatchOperationId(null);
  }

  function openRangeReview() {
    if (!canSave || rangeError) return;
    setBatchOperationId(createOperationId());
    setRangeReviewOpen(true);
  }

  function applyReviewBatch() {
    setReviewTotalsByBoard((current) => {
      const boardTotals = current[activeBoard.id] ?? [];
      const occupiedDates = new Set(
        boardTotals.map((total) => total.studyDate),
      );
      const additions = Array.from({ length: rangeCount }, (_, index) => {
        const studyDate = shiftDate(rangeStart, index);
        return {
          id: `53000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
          studyDate,
          wordsLearned: parsedWords,
        };
      }).filter((total) => !occupiedDates.has(total.studyDate));

      return {
        ...current,
        [activeBoard.id]: [...boardTotals, ...additions],
      };
    });
    closeForm();
  }

  function renderHeatCell(
    cell: { dateKey: string; visible: boolean },
    compact: boolean,
  ) {
    const dailyTotal = totalByDate.get(cell.dateKey);
    const words = dailyTotal?.wordsLearned ?? 0;
    const isMissed = isVocabularyMissedDate(
      cell.dateKey,
      words,
      dailyTotal !== undefined,
      earliestPositiveDate,
      todayKey,
    );
    const label = `${formatLongDate(cell.dateKey)}: ${wordsLabel(words)}${
      isMissed ? ", no new words recorded" : ""
    }`;

    return (
      <button
        key={cell.dateKey}
        type="button"
        disabled={!cell.visible}
        onClick={() => navigateToDate(cell.dateKey)}
        aria-label={label}
        title={label}
        className={`${compact ? "size-2.5 rounded-[2px]" : "size-3.5 rounded-[3px] sm:size-4"} border ${
          cell.dateKey === activeDate
            ? "border-slate-950 ring-1 ring-slate-950"
            : "border-white"
        } disabled:invisible`}
        style={{
          backgroundColor: isMissed
            ? missedColor
            : heatColors[vocabularyHeatLevel(words)],
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex min-h-17 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
          <details className="group relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-lg font-bold text-slate-950 hover:bg-slate-50">
              {activeBoard.name}
              <span
                aria-hidden="true"
                className="text-sm text-slate-400 transition group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <div className="absolute top-full left-0 z-20 mt-2 min-w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              {boards.map((board) =>
                reviewMode ? (
                  <button
                    key={board.id}
                    type="button"
                    onClick={(event) => {
                      setReviewBoard(board);
                      setReviewDate(todayKey);
                      closeForm();
                      event.currentTarget
                        .closest("details")
                        ?.removeAttribute("open");
                    }}
                    className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium ${
                      board.id === activeBoard.id
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {board.name}
                  </button>
                ) : (
                  <Link
                    key={board.id}
                    href={`/dashboard?board=${board.id}&date=${activeDate}&today=${todayKey}&tracker=vocabulary`}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                      board.id === activeBoard.id
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {board.name}
                  </Link>
                ),
              )}
            </div>
          </details>

          <nav aria-label="Primary" className="hidden items-stretch sm:flex">
            <Link
              href={
                reviewMode
                  ? "/dashboard"
                  : `/dashboard?board=${activeBoard.id}&date=${activeDate}&today=${todayKey}`
              }
              className="flex min-h-17 items-center gap-2 px-5 font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
            >
              <Clock3 aria-hidden="true" className="size-5" />
              Study Time
            </Link>
            <span className="flex min-h-17 items-center gap-2 border-b-3 border-emerald-600 px-5 font-semibold text-emerald-700">
              <BookOpen aria-hidden="true" className="size-5" />
              Vocabulary
            </span>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href={
                reviewMode
                  ? "/statistics"
                  : `/statistics?board=${activeBoard.id}&year=${activeYear}&today=${todayKey}`
              }
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
          <Link
            href={
              reviewMode
                ? "/dashboard"
                : `/dashboard?board=${activeBoard.id}&date=${activeDate}&today=${todayKey}`
            }
            className="flex min-h-14 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          >
            <Clock3 aria-hidden="true" className="size-4.5" />
            Study Time
          </Link>
          <span className="flex min-h-14 items-center justify-center gap-1.5 border-b-3 border-emerald-600 px-2 text-xs font-semibold text-emerald-700">
            <BookOpen aria-hidden="true" className="size-4.5" />
            Vocabulary
          </span>
          <Link
            href={
              reviewMode
                ? "/statistics"
                : `/statistics?board=${activeBoard.id}&year=${activeYear}&today=${todayKey}`
            }
            className="flex min-h-14 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          >
            <BarChart3 aria-hidden="true" className="size-4.5" />
            Statistics
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <section aria-labelledby="vocabulary-year-heading">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous year"
              onClick={() => navigateYear(-1)}
              className="flex size-11 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <div className="min-w-28 text-center">
              <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
                New words
              </p>
              <h1
                id="vocabulary-year-heading"
                className="text-3xl font-bold text-slate-950"
              >
                {activeYear}
              </h1>
            </div>
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
                cells: getCalendarRangeCells(
                  `${activeYear}-01-01`,
                  `${activeYear}-06-30`,
                ),
              },
              {
                label: "Jul–Dec",
                months: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                cells: getCalendarRangeCells(
                  `${activeYear}-07-01`,
                  `${activeYear}-12-31`,
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

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            {[
              "0 words",
              "1–2 words",
              "3–5 words",
              "6–9 words",
              "10–14 words",
              "15–19 words",
              "20–39 words",
              "40+ words",
            ].map((label, level) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-sm border border-slate-100"
                  style={{
                    backgroundColor:
                      level === 0 ? missedColor : heatColors[level],
                  }}
                />
                {label}
              </span>
            ))}
          </div>
        </section>

        <section
          aria-label="Vocabulary summary"
          className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6"
        >
          <div className="rounded-2xl border border-slate-200 p-4 text-center">
            <strong className="block text-2xl text-emerald-700">
              {statistics.totalWords.toLocaleString("en")}
            </strong>
            <span className="text-sm text-slate-500">Words ({activeYear})</span>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-center">
            <strong className="block text-2xl text-emerald-700">
              {statistics.activeDays}
            </strong>
            <span className="text-sm text-slate-500">Active days</span>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-center">
            <strong className="inline-flex items-center gap-1 text-2xl text-emerald-700">
              <Flame aria-hidden="true" className="size-5 text-orange-500" />
              {statistics.currentStreak}{" "}
              {statistics.currentStreak === 1 ? "day" : "days"}
            </strong>
            <span className="block text-sm text-slate-500">Current streak</span>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-center">
            <strong className="inline-flex items-center gap-1 text-2xl text-emerald-700">
              <Trophy aria-hidden="true" className="size-5 text-amber-500" />
              {statistics.longestStreak}{" "}
              {statistics.longestStreak === 1 ? "day" : "days"}
            </strong>
            <span className="block text-sm text-slate-500">Longest streak</span>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-center">
            <strong className="inline-flex items-center gap-1 text-2xl text-emerald-700">
              <Gauge aria-hidden="true" className="size-5 text-emerald-500" />
              {formatAverage(statistics.calendarDayAverage)}{" "}
              {statistics.calendarDayAverage === 1 ? "word" : "words"}
            </strong>
            <span className="block text-sm text-slate-500">
              Average / calendar day
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4 text-center">
            <strong className="inline-flex items-center gap-1 text-2xl text-emerald-700">
              <Gauge aria-hidden="true" className="size-5 text-emerald-500" />
              {formatAverage(statistics.activeDayAverage)}{" "}
              {statistics.activeDayAverage === 1 ? "word" : "words"}
            </strong>
            <span className="block text-sm text-slate-500">
              Average / study day
            </span>
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-3xl border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => navigateToDate(shiftDate(activeDate, -1))}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <div className="min-w-0 text-center">
              <h2 className="text-xl font-bold text-slate-950">
                {activeDate === todayKey ? "Today" : formatLongDate(activeDate)}
              </h2>
              {activeDate === todayKey && (
                <p className="mt-1 text-sm text-slate-500">
                  {formatLongDate(activeDate)}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Next day"
              onClick={() => navigateToDate(shiftDate(activeDate, 1))}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>

          {selectedTotal ? (
            <article className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700">
                <BookOpen aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-2xl text-slate-950">
                  {selectedTotal.wordsLearned.toLocaleString("en")}
                </strong>
                <span className="text-sm text-slate-600">
                  new {selectedTotal.wordsLearned === 1 ? "word" : "words"}{" "}
                  learned
                </span>
              </span>
              <button
                type="button"
                onClick={openEdit}
                aria-label="Edit vocabulary total"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-emerald-700"
              >
                <Pencil aria-hidden="true" className="size-4.5" />
              </button>
              <form
                action={deleteVocabularyDailyTotal}
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      "Delete this vocabulary total? This action cannot be undone.",
                    )
                  ) {
                    event.preventDefault();
                    return;
                  }
                  if (reviewMode) {
                    event.preventDefault();
                    setReviewTotalsByBoard((current) => ({
                      ...current,
                      [activeBoard.id]: (current[activeBoard.id] ?? []).filter(
                        (total) => total.id !== selectedTotal.id,
                      ),
                    }));
                    closeForm();
                  }
                }}
              >
                <input
                  type="hidden"
                  name="vocabularyTotalId"
                  value={selectedTotal.id}
                />
                <button
                  type="submit"
                  aria-label="Delete vocabulary total"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 aria-hidden="true" className="size-4.5" />
                </button>
              </form>
            </article>
          ) : (
            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-6 text-center">
              <BookOpen
                aria-hidden="true"
                className="mx-auto size-7 text-slate-400"
              />
              <p className="mt-2 text-sm font-medium text-slate-700">
                No new words learned on this day yet.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Record only words you actively learned—not words you simply
                heard or read.
              </p>
            </div>
          )}

          {!formOpen ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {!selectedTotal && (
                <button
                  type="button"
                  onClick={() => openCreate("single")}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-500 font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus aria-hidden="true" className="size-5" />
                  Add word total
                </button>
              )}
              <button
                type="button"
                onClick={() => openCreate("range")}
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-500 font-semibold text-emerald-700 hover:bg-emerald-50 ${
                  selectedTotal ? "sm:col-span-2" : ""
                }`}
              >
                <CalendarRange aria-hidden="true" className="size-5" />
                Add date range
              </button>
            </div>
          ) : formMode === "range" ? (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
              {rangeReviewOpen ? (
                <>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
                    <p className="text-sm font-semibold text-emerald-700">
                      REVIEW DATE RANGE
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-950">
                      Add totals to {newPreviewCount} empty{" "}
                      {newPreviewCount === 1 ? "date" : "dates"}?
                    </h3>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-slate-500">Words per empty date</dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">
                          {wordsLabel(parsedWords)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Selected dates</dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">
                          {rangeCount}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-slate-500">Inclusive range</dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">
                          {formatLongDate(rangeStart)} –{" "}
                          {formatLongDate(rangeEnd)}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {preservedPreviewCount} existing{" "}
                      {preservedPreviewCount === 1 ? "total" : "totals"} will be
                      kept unchanged. Only empty dates will receive the new
                      value.
                    </p>
                  </div>
                  <form
                    action={batchAction}
                    onSubmit={(event) => {
                      if (!reviewMode) return;
                      event.preventDefault();
                      applyReviewBatch();
                    }}
                    className="mt-5 flex flex-wrap gap-2"
                  >
                    <input
                      type="hidden"
                      name="operationId"
                      value={batchOperationId ?? ""}
                    />
                    <input
                      type="hidden"
                      name="boardId"
                      value={activeBoard.id}
                    />
                    <input type="hidden" name="startDate" value={rangeStart} />
                    <input type="hidden" name="endDate" value={rangeEnd} />
                    <input
                      type="hidden"
                      name="wordsLearned"
                      value={parsedWords}
                    />
                    <button
                      type="submit"
                      disabled={batchPending}
                      className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-5 font-semibold text-white disabled:bg-emerald-300"
                    >
                      {batchPending ? "Adding totals..." : "Confirm and add"}
                    </button>
                    <button
                      type="button"
                      disabled={batchPending}
                      onClick={() => {
                        setRangeReviewOpen(false);
                        setBatchOperationId(null);
                      }}
                      className="min-h-12 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 hover:bg-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={batchPending}
                      onClick={closeForm}
                      className="min-h-12 rounded-xl px-4 font-semibold text-slate-600 hover:bg-white"
                    >
                      Cancel
                    </button>
                  </form>
                  {batchState.status === "error" && (
                    <p role="alert" className="mt-2 text-sm text-red-700">
                      {batchState.message}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-slate-950">
                    Add word totals by date range
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Existing daily totals are preserved. The new value is added
                    only to empty dates.
                  </p>
                  <label className="mt-4 block font-semibold text-slate-950">
                    Words learned per empty date
                    <input
                      type="number"
                      min={0}
                      max={2_147_483_647}
                      step={1}
                      inputMode="numeric"
                      autoFocus
                      value={wordsLearned}
                      onChange={(event) => setWordsLearned(event.target.value)}
                      placeholder="Enter a whole number"
                      className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-lg outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                      {rangeCount} {rangeCount === 1 ? "date" : "dates"}:{" "}
                      {newPreviewCount} empty, {preservedPreviewCount} already
                      saved
                    </p>
                  )}
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={openRangeReview}
                      disabled={!canSave || Boolean(rangeError)}
                      className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      Review range
                    </button>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="min-h-12 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <form
              action={action}
              onSubmit={(event) => {
                if (!reviewMode || !canSave) return;
                event.preventDefault();
                setReviewTotalsByBoard((current) => {
                  const boardTotals = current[activeBoard.id] ?? [];
                  const replacement = {
                    id:
                      selectedTotal?.id ??
                      "52000000-0000-4000-8000-000000000099",
                    studyDate: activeDate,
                    wordsLearned: parsedWords,
                  };
                  return {
                    ...current,
                    [activeBoard.id]: [
                      ...boardTotals.filter(
                        (total) => total.studyDate !== activeDate,
                      ),
                      replacement,
                    ],
                  };
                });
                closeForm();
              }}
              className="mt-4 rounded-2xl border border-slate-200 p-4 sm:p-5"
            >
              <input type="hidden" name="boardId" value={activeBoard.id} />
              <input type="hidden" name="studyDate" value={activeDate} />
              <label className="block font-semibold text-slate-950">
                {editing ? "Edit words learned" : "Words learned"}
                <input
                  name="wordsLearned"
                  type="number"
                  min={0}
                  max={2_147_483_647}
                  step={1}
                  inputMode="numeric"
                  autoFocus
                  value={wordsLearned}
                  onChange={(event) => setWordsLearned(event.target.value)}
                  placeholder="Enter a whole number"
                  className="mt-3 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-lg outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <p className="mt-2 text-sm text-slate-500">
                Save one final non-negative total for this date.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="submit"
                  disabled={!canSave || pending}
                  className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {pending ? "Saving..." : editing ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="min-h-12 rounded-xl border border-slate-300 px-5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
              {actionState.status === "error" && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {actionState.message}
                </p>
              )}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
