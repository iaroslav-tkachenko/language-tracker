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
import { useActionState, useEffect, useMemo, useState } from "react";

import {
  createLanguageBoardAndRedirect,
  createVocabularyTotalBatch,
  deleteVocabularyDailyTotal,
  type ResourceActionState,
  saveVocabularyDailyTotal,
} from "@/app/dashboard/actions";
import { ConfirmSignOutForm } from "@/components/auth/confirm-sign-out-form";
import {
  CefrLevelPrompt,
  MissingLevelBubble,
} from "@/components/cefr/cefr-level-prompt";
import {
  fromDateKey,
  getCalendarCells,
  getCalendarRangeCells,
  shiftDate,
  toDateKey,
} from "@/lib/dates/study-calendar";
import {
  formatCalendarDuration,
  formatEstimatedMonth,
} from "@/lib/cefr/study-time";
import {
  formatVocabularyPace,
  formatVocabularyWords,
  VOCABULARY_DISCLOSURE_INTRO,
  VOCABULARY_DISCLOSURE_ITEMS,
  VOCABULARY_DISCLOSURE_NOTE,
  VOCABULARY_MODEL_VERSION,
  type VocabularyForecast,
  type VocabularyPaceEstimate,
} from "@/lib/cefr/vocabulary";
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
  hasCurrentCefrLevel?: boolean;
  vocabularyForecast?: VocabularyForecast;
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

function SummaryValue({
  value,
  accentClass = "text-emerald-700",
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

function VocabularyForecastCard({
  forecast,
}: {
  forecast: VocabularyForecast;
}) {
  if (forecast.status === "no-level") return null;

  if (forecast.status === "highest-level") {
    return (
      <section className="mx-auto mt-5 max-w-6xl rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
            <BookOpen aria-hidden="true" className="size-6" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Vocabulary progress
            </h2>
            <p className="mt-2 max-w-3xl leading-7 text-slate-700">
              {forecast.currentLevel} is the highest level in this model, so
              there is no next-level forecast. Your estimated vocabulary size is
              still visible.
            </p>
            <p className="mt-4 text-sm font-bold tracking-wide text-slate-500 uppercase">
              Estimated vocabulary size
            </p>
            <p className="mt-1 text-3xl font-black text-slate-950">
              &gt; {formatVocabularyWords(forecast.estimatedVocabularySize)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const completedPercent = Math.round(forecast.progressRatio * 100);
  const paceColumns: VocabularyPaceEstimate[] = [
    forecast.sevenDayPace,
    forecast.thirtyDayPace,
  ];

  return (
    <section className="mx-auto mt-5 max-w-6xl rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <BookOpen aria-hidden="true" className="size-6" />
        </span>
        <div>
          <h2 className="text-2xl font-black text-slate-950">
            Vocabulary progress
          </h2>
          <p className="mt-1 text-slate-600">
            Approximate progress from {forecast.currentLevel} to{" "}
            {forecast.nextLevel}, based on words recorded since this level.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.2fr_1fr]">
        <div>
          <p className="text-sm font-black tracking-wide text-slate-500 uppercase">
            Current
          </p>
          <p className="mt-2 flex items-center gap-3">
            <span className="flex size-13 items-center justify-center rounded-full bg-slate-950 text-lg font-black text-white">
              {forecast.currentLevel}
            </span>
            <span className="text-xl text-slate-600">
              ≈ {formatVocabularyWords(forecast.baselineWords)}
            </span>
          </p>
        </div>

        <div className="text-left lg:text-center">
          <p className="text-sm font-black tracking-wide text-emerald-700 uppercase">
            Progress
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            +{formatVocabularyWords(forecast.eligibleWords)}
          </p>
          <p className="mt-1 text-xl text-slate-600">
            ≈ {formatVocabularyWords(forecast.estimatedVocabularySize)} now
          </p>
        </div>

        <div className="lg:text-right">
          <p className="text-sm font-black tracking-wide text-slate-500 uppercase">
            Next
          </p>
          <p className="mt-2 flex items-center gap-3 lg:justify-end">
            <span className="text-xl text-slate-600">
              ≈ {formatVocabularyWords(forecast.nextLevelBaselineWords)} total
            </span>
            <span className="flex size-13 items-center justify-center rounded-full bg-slate-100 text-lg font-black text-slate-500">
              {forecast.nextLevel}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-600"
            style={{ width: `${completedPercent}%` }}
          />
        </div>
        <p className="mt-3 text-center text-lg font-black text-emerald-700">
          {completedPercent}% completed
          <span className="px-2 text-slate-300">•</span>
          <span className="text-slate-700">
            ≈ {formatVocabularyWords(forecast.remainingWords)} left
          </span>
        </p>
      </div>

      <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
        <h3 className="text-xl font-black text-emerald-700 sm:text-2xl">
          Forecast to reach {forecast.nextLevel} with your current pace
        </h3>
        <p className="mt-1 text-slate-600">
          Based on your activity across every calendar day in the last 7 and 30
          days, including days with no entries.
        </p>
        <div className="mt-4 max-w-3xl overflow-x-auto rounded-2xl border border-emerald-100 bg-white/80">
          <div className="grid min-w-[560px] grid-cols-[1.1fr_1fr_1fr] border-b border-emerald-100 text-lg font-black text-emerald-700">
            <div className="px-4 py-3 text-slate-500" />
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3">
                Last {pace.periodDays} days
              </div>
            ))}
          </div>
          <div className="grid min-w-[560px] grid-cols-[1.1fr_1fr_1fr] border-b border-emerald-100">
            <div className="px-4 py-3 text-slate-500">Active days</div>
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3 text-slate-700">
                {pace.entryDays} {pace.entryDays === 1 ? "day" : "days"}
              </div>
            ))}
          </div>
          <div className="grid min-w-[560px] grid-cols-[1.1fr_1fr_1fr] border-b border-emerald-100">
            <div className="px-4 py-3 text-slate-500">Average pace</div>
            {paceColumns.map((pace) => (
              <div
                key={pace.periodDays}
                className="px-4 py-3 font-semibold text-slate-950"
              >
                {formatVocabularyPace(pace.averageWords)}
              </div>
            ))}
          </div>
          <div className="grid min-w-[560px] grid-cols-[1.1fr_1fr_1fr] border-b border-emerald-100">
            <div className="px-4 py-3 text-slate-500">
              Reach {forecast.nextLevel} in
            </div>
            {paceColumns.map((pace) => (
              <div
                key={pace.periodDays}
                className="px-4 py-3 font-semibold text-slate-950"
              >
                {pace.estimate
                  ? `≈ ${formatCalendarDuration(pace.estimate.duration)}`
                  : "Not available"}
              </div>
            ))}
          </div>
          <div className="grid min-w-[560px] grid-cols-[1.1fr_1fr_1fr]">
            <div className="px-4 py-3 text-slate-500">Estimated date</div>
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3 text-slate-700">
                {pace.estimate
                  ? formatEstimatedMonth(pace.estimate.estimatedDate)
                  : "Not available"}
              </div>
            ))}
          </div>
        </div>
      </div>

      <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <summary className="cursor-pointer font-bold text-slate-700">
          How we calculate this
        </summary>
        <p className="mt-3 leading-7 text-slate-600">
          {VOCABULARY_DISCLOSURE_INTRO}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-600">
          {VOCABULARY_DISCLOSURE_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 leading-7 text-slate-600">
          {VOCABULARY_DISCLOSURE_NOTE}
        </p>
      </details>
    </section>
  );
}

export function VocabularyWorkspace({
  boards,
  selectedBoard,
  totals,
  selectedDate,
  year,
  todayKey,
  hasCurrentCefrLevel = true,
  vocabularyForecast = {
    status: "no-level",
    modelVersion: VOCABULARY_MODEL_VERSION,
  },
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
  const [boardState, boardAction, boardPending] = useActionState(
    createLanguageBoardAndRedirect,
    initialActionState,
  );
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

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
  const trimmedBoardName = newBoardName.trim();
  const duplicateBoardName = boards.some(
    (board) => board.name.toLowerCase() === trimmedBoardName.toLowerCase(),
  );
  const boardLimitReached = boards.length >= 6;
  const canCreateBoard =
    trimmedBoardName.length > 0 &&
    trimmedBoardName.length <= 50 &&
    !duplicateBoardName &&
    !boardLimitReached &&
    !reviewMode;
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
        className={`${compact ? "size-2.5 rounded-[2px]" : "h-[1.0625rem] w-full rounded-[3px]"} border ${
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
        <div className="mx-auto flex min-h-14 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
          <details className="group relative">
            <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 text-base font-bold text-slate-950 hover:bg-slate-50">
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
              <div className="mt-2 border-t border-slate-100 pt-2">
                {boardLimitReached || reviewMode ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500">
                    {reviewMode
                      ? "Add languages from your live dashboard."
                      : "You can have up to 6 active language boards. Remove one in Settings before adding another."}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBoardDialogOpen(true)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    Add language
                  </button>
                )}
              </div>
            </div>
          </details>

          <nav aria-label="Primary" className="hidden items-stretch sm:flex">
            <Link
              href={
                reviewMode
                  ? "/dashboard"
                  : `/dashboard?board=${activeBoard.id}&date=${activeDate}&today=${todayKey}`
              }
              className="flex min-h-14 items-center gap-2 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
            >
              <Clock3 aria-hidden="true" className="size-4.5" />
              Study Time
            </Link>
            <span className="flex min-h-14 items-center gap-2 border-b-2 border-emerald-600 px-4 text-sm font-semibold text-emerald-700">
              <BookOpen aria-hidden="true" className="size-4.5" />
              Vocabulary
            </span>
            <Link
              href={`/cefr?board=${activeBoard.id}&today=${todayKey}`}
              className="relative flex min-h-14 items-center gap-2 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-violet-700"
            >
              {!hasCurrentCefrLevel && <MissingLevelBubble />}
              <GraduationCap aria-hidden="true" className="size-4.5" />
              Level
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href={
                reviewMode
                  ? "/statistics"
                  : `/statistics?board=${activeBoard.id}&year=${activeYear}&today=${todayKey}`
              }
              className="hidden min-h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700 sm:flex"
            >
              <BarChart3 aria-hidden="true" className="size-4.5" />
              Statistics
            </Link>
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            >
              <Settings aria-hidden="true" className="size-4.5" />
            </Link>
            <ConfirmSignOutForm className="sm:hidden">
              <button
                type="submit"
                aria-label="Sign out"
                className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              >
                <LogOut aria-hidden="true" className="size-4.5" />
              </button>
            </ConfirmSignOutForm>
            <ConfirmSignOutForm className="hidden sm:block">
              <button
                type="submit"
                className="min-h-9 rounded-lg px-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              >
                Sign out
              </button>
            </ConfirmSignOutForm>
          </div>
        </div>
        <nav
          aria-label="Mobile primary"
          className="grid grid-cols-4 border-t border-slate-100 sm:hidden"
        >
          <Link
            href={
              reviewMode
                ? "/dashboard"
                : `/dashboard?board=${activeBoard.id}&date=${activeDate}&today=${todayKey}`
            }
            className="flex min-h-12 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          >
            <Clock3 aria-hidden="true" className="size-4.5" />
            Study Time
          </Link>
          <span className="flex min-h-12 items-center justify-center gap-1.5 border-b-2 border-emerald-600 px-2 text-xs font-semibold text-emerald-700">
            <BookOpen aria-hidden="true" className="size-4.5" />
            Vocabulary
          </span>
          <Link
            href={`/cefr?board=${activeBoard.id}&today=${todayKey}`}
            className="relative flex min-h-12 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-violet-700"
          >
            {!hasCurrentCefrLevel && <MissingLevelBubble />}
            <GraduationCap aria-hidden="true" className="size-4.5" />
            Level
          </Link>
          <Link
            href={
              reviewMode
                ? "/statistics"
                : `/statistics?board=${activeBoard.id}&year=${activeYear}&today=${todayKey}`
            }
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
              <input type="hidden" name="tracker" value="vocabulary" />
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
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base text-slate-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
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
                  className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
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
              href={`/cefr?board=${activeBoard.id}&today=${todayKey}`}
              context="vocabulary"
              accent="green"
            />
          </div>
        )}

        <div className="mx-auto max-w-6xl">
          <section aria-labelledby="vocabulary-year-heading">
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
                <p className="h-4 text-xs leading-4 font-semibold tracking-wide text-emerald-700 uppercase">
                  Words learned
                </p>
                <h1
                  id="vocabulary-year-heading"
                  className="mt-0.5 text-2xl leading-7 font-bold text-slate-950"
                >
                  {activeYear}
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

            <div className="mt-3 text-center text-xs text-slate-500">
              <p>Words per day</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                {[
                  "0",
                  "1–2",
                  "3–5",
                  "6–9",
                  "10–14",
                  "15–19",
                  "20–39",
                  "40+",
                ].map((label, level) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5"
                  >
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
            </div>
          </section>

          <section
            aria-label="Vocabulary summary"
            className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6"
          >
            <div className="rounded-2xl border border-slate-200 p-3 text-center">
              <SummaryValue
                value={statistics.totalWords.toLocaleString("en")}
              />
              <span className="text-sm text-slate-500">
                Words ({activeYear})
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 text-center">
              <SummaryValue value={statistics.activeDays} />
              <span className="text-sm text-slate-500">Active days</span>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 text-center">
              <span className="inline-flex items-baseline justify-center gap-1">
                <Flame aria-hidden="true" className="size-5 text-orange-500" />
                <SummaryValue
                  value={`${statistics.currentStreak} ${
                    statistics.currentStreak === 1 ? "day" : "days"
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
                <Gauge aria-hidden="true" className="size-5 text-emerald-500" />
                <SummaryValue
                  value={`${formatAverage(statistics.calendarDayAverage)} ${
                    statistics.calendarDayAverage === 1 ? "word" : "words"
                  }`}
                />
              </span>
              <span className="block text-sm text-slate-500">
                Average / calendar day
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 text-center">
              <span className="inline-flex items-baseline justify-center gap-1">
                <Gauge aria-hidden="true" className="size-5 text-emerald-500" />
                <SummaryValue
                  value={`${formatAverage(statistics.activeDayAverage)} ${
                    statistics.activeDayAverage === 1 ? "word" : "words"
                  }`}
                />
              </span>
              <span className="block text-sm text-slate-500">
                Average / study day
              </span>
            </div>
          </section>
        </div>

        <section className="mx-auto mt-7 max-w-3xl border-t border-slate-200 pt-5">
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
            <article className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4">
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
              <p className="mt-3 text-base font-semibold text-slate-800">
                No new words yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Record only words you actively learned, not words you simply
                heard or read.
              </p>
            </div>
          )}

          {!formOpen ? (
            <button
              type="button"
              onClick={() => openCreate("single")}
              className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <Plus aria-hidden="true" className="size-5" />
              Add words
            </button>
          ) : formMode === "range" ? (
            <div className="mt-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div
                role="group"
                aria-label="Vocabulary entry date mode"
                className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1"
              >
                <button
                  type="button"
                  onClick={() => {
                    setFormMode("single");
                    setRangeReviewOpen(false);
                    setBatchOperationId(null);
                  }}
                  aria-pressed={false}
                  className="min-h-10 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:text-slate-950"
                >
                  Single day
                </button>
                <button
                  type="button"
                  onClick={() => setFormMode("range")}
                  aria-pressed={true}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-emerald-700 shadow-sm"
                >
                  <CalendarRange aria-hidden="true" className="size-4" />
                  Date range
                </button>
              </div>
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
              {!editing && (
                <div
                  role="group"
                  aria-label="Vocabulary entry date mode"
                  className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1"
                >
                  <button
                    type="button"
                    onClick={() => setFormMode("single")}
                    aria-pressed={formMode === "single"}
                    className="min-h-10 rounded-lg bg-white px-3 text-sm font-semibold text-emerald-700 shadow-sm"
                  >
                    Single day
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode("range");
                      setRangeStart(activeDate);
                      setRangeEnd(activeDate);
                      setRangeReviewOpen(false);
                      setBatchOperationId(null);
                    }}
                    aria-pressed={false}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:text-slate-950"
                  >
                    <CalendarRange aria-hidden="true" className="size-4" />
                    Date range
                  </button>
                </div>
              )}
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

        {vocabularyForecast.status !== "no-level" && (
          <div
            aria-hidden="true"
            className="mx-auto mt-8 max-w-6xl border-t border-slate-200"
          />
        )}
        <VocabularyForecastCard forecast={vocabularyForecast} />
      </div>
    </main>
  );
}
