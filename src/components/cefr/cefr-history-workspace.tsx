"use client";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
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
  createCefrLevelEvent,
  deleteCefrLevelEvent,
  type ResourceActionState,
  updateCefrLevelEvent,
} from "@/app/dashboard/actions";
import { ConfirmSignOutForm } from "@/components/auth/confirm-sign-out-form";
import { MissingLevelBubble } from "@/components/cefr/cefr-level-prompt";
import { WeeklyPlanCard } from "@/components/cefr/weekly-plan-card";
import { getWeeklyRecommendation } from "@/lib/cefr/recommendations";
import {
  CEFR_LEVEL_DETAILS,
  CEFR_LEVELS,
  type CefrLevel,
} from "@/lib/cefr/reference";
import type { CefrLevelEvent } from "@/lib/cefr/history";

type BoardSummary = { id: string; name: string };

type CefrHistoryWorkspaceProps = {
  boards: BoardSummary[];
  selectedBoard: BoardSummary;
  history: CefrLevelEvent[];
  todayKey: string;
};

type FormMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; event: CefrLevelEvent };

const initialActionState: ResourceActionState = { status: "idle" };

function levelLabel(level: CefrLevel) {
  if (level === "A0") return "Level A0 - Absolute zero";
  return `Level ${level}`;
}

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateKey}T00:00:00`));
}

function LevelBadge({
  level,
  current = false,
}: {
  level: CefrLevel;
  current?: boolean;
}) {
  return (
    <span
      className={`flex size-15 shrink-0 items-center justify-center rounded-full text-lg font-black shadow-sm ${
        current ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      {level}
    </span>
  );
}

function LevelForm({
  boardId,
  mode,
  todayKey,
  onClose,
}: {
  boardId: string;
  mode: Exclude<FormMode, { kind: "closed" }>;
  todayKey: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = mode.kind === "edit";
  const actionHandler = isEdit ? updateCefrLevelEvent : createCefrLevelEvent;
  const [state, formAction, pending] = useActionState(
    actionHandler,
    initialActionState,
  );
  const [level, setLevel] = useState<CefrLevel>(
    isEdit ? mode.event.level : "A1",
  );
  const [effectiveDate, setEffectiveDate] = useState(
    isEdit ? mode.event.effectiveDate : todayKey,
  );
  const details = CEFR_LEVEL_DETAILS[level];

  useEffect(() => {
    if (state.status !== "success") return;
    const resetId = window.setTimeout(() => {
      onClose();
      router.refresh();
    }, 0);
    return () => window.clearTimeout(resetId);
  }, [onClose, router, state.status]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/30 p-0 sm:items-center sm:justify-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cefr-form-heading"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-wide text-violet-700 uppercase">
              {isEdit ? "Edit level update" : "Add level update"}
            </p>
            <h2
              id="cefr-form-heading"
              className="mt-1 text-2xl font-black text-slate-950"
            >
              {isEdit
                ? "Update your language level"
                : "Set your language level"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            Cancel
          </button>
        </div>

        <form action={formAction} className="mt-6 space-y-5">
          <input type="hidden" name="boardId" value={boardId} />
          <input type="hidden" name="localToday" value={todayKey} />
          {isEdit && (
            <input type="hidden" name="eventId" value={mode.event.id} />
          )}

          <fieldset>
            <legend className="text-sm font-bold text-slate-700">
              Choose level
            </legend>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {CEFR_LEVELS.map((option) => (
                <label key={option} className="block">
                  <input
                    type="radio"
                    name="level"
                    value={option}
                    checked={level === option}
                    onChange={() => setLevel(option)}
                    className="peer sr-only"
                  />
                  <span className="flex min-h-13 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-600 peer-checked:border-violet-600 peer-checked:bg-violet-600 peer-checked:text-white hover:bg-slate-50">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">
              Date when this level became current
            </span>
            <input
              type="date"
              name="effectiveDate"
              value={effectiveDate}
              max={todayKey}
              onChange={(event) => setEffectiveDate(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base font-semibold text-slate-950"
            />
          </label>

          <div className="rounded-3xl border border-violet-100 bg-violet-50/60 p-5">
            <div className="flex items-center gap-3">
              <LevelBadge level={level} current />
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  {levelLabel(level)}
                </h3>
                <p className="text-sm font-medium text-violet-700">
                  {details.name}
                </p>
              </div>
            </div>
            <p className="mt-4 leading-7 text-slate-700">
              {details.description}
            </p>
          </div>

          {state.status === "error" && (
            <p
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              {state.message}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-2xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="min-h-12 rounded-2xl bg-slate-950 px-5 font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {pending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Add level update"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function CefrHistoryWorkspace({
  boards,
  selectedBoard,
  history,
  todayKey,
}: CefrHistoryWorkspaceProps) {
  const [formMode, setFormMode] = useState<FormMode>({ kind: "closed" });
  const currentEvent = history[0] ?? null;
  const currentDetails = currentEvent
    ? CEFR_LEVEL_DETAILS[currentEvent.level]
    : null;
  const todayYear = Number(todayKey.slice(0, 4));
  const dashboardHref = `/dashboard?board=${selectedBoard.id}&date=${todayKey}&today=${todayKey}`;
  const vocabularyHref = `${dashboardHref}&tracker=vocabulary`;
  const statisticsHref = `/statistics?board=${selectedBoard.id}&year=${todayYear}&today=${todayKey}`;
  const levelLabelText = currentEvent
    ? levelLabel(currentEvent.level)
    : "No level yet";
  const description = currentEvent
    ? currentDetails?.description
    : "Add your first level update to start building a transparent history. The app will use this date as the baseline for approximate progress guidance in the next Phase 4 milestones.";
  const boardOptions = useMemo(() => boards, [boards]);
  const weeklyRecommendation = currentEvent
    ? getWeeklyRecommendation(currentEvent.level)
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-17 max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
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
              {boardOptions.map((board) => (
                <Link
                  key={board.id}
                  href={`/cefr?board=${board.id}&today=${todayKey}`}
                  className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                    board.id === selectedBoard.id
                      ? "bg-violet-50 text-violet-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {board.name}
                </Link>
              ))}
            </div>
          </details>

          <nav aria-label="Primary" className="hidden items-stretch md:flex">
            <Link
              href={dashboardHref}
              className="flex min-h-17 items-center gap-2 px-5 font-semibold text-slate-600 hover:text-blue-700"
            >
              <Clock3 aria-hidden="true" className="size-5" />
              Study Time
            </Link>
            <Link
              href={vocabularyHref}
              className="flex min-h-17 items-center gap-2 px-5 font-semibold text-slate-600 hover:text-emerald-700"
            >
              <BookOpen aria-hidden="true" className="size-5" />
              Vocabulary
            </Link>
            <span className="relative flex min-h-17 items-center gap-2 border-b-3 border-violet-600 px-5 font-semibold text-violet-700">
              {!currentEvent && <MissingLevelBubble />}
              <GraduationCap aria-hidden="true" className="size-5" />
              Level
            </span>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href={statisticsHref}
              className="hidden min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700 sm:flex"
            >
              <BarChart3 aria-hidden="true" className="size-5" />
              Statistics
            </Link>
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              <Settings aria-hidden="true" className="size-5" />
            </Link>
            <ConfirmSignOutForm>
              <button
                type="submit"
                className="hidden min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950 sm:block"
              >
                Sign out
              </button>
            </ConfirmSignOutForm>
            <ConfirmSignOutForm className="sm:hidden">
              <button
                type="submit"
                aria-label="Sign out"
                className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              >
                <LogOut aria-hidden="true" className="size-5" />
              </button>
            </ConfirmSignOutForm>
          </div>
        </div>
        <nav
          aria-label="Mobile primary"
          className="grid grid-cols-4 border-t border-slate-100 md:hidden"
        >
          <Link
            href={dashboardHref}
            className="flex min-h-14 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          >
            <Clock3 aria-hidden="true" className="size-4.5" />
            Study Time
          </Link>
          <Link
            href={vocabularyHref}
            className="flex min-h-14 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
          >
            <BookOpen aria-hidden="true" className="size-4.5" />
            Vocabulary
          </Link>
          <span className="relative flex min-h-14 items-center justify-center gap-1.5 border-b-3 border-violet-600 px-2 text-xs font-semibold text-violet-700">
            {!currentEvent && <MissingLevelBubble />}
            <GraduationCap aria-hidden="true" className="size-4.5" />
            Level
          </span>
          <Link
            href={statisticsHref}
            className="flex min-h-14 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          >
            <BarChart3 aria-hidden="true" className="size-4.5" />
            Statistics
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Your language level
              </h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
                Track your progress and get approximate forecasts for reaching
                the next CEFR level.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormMode({ kind: "create" })}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-base font-bold text-white hover:bg-slate-800"
            >
              <Plus aria-hidden="true" className="size-5" />
              Add level update
            </button>
          </div>

          <div className="relative isolate border-t border-slate-200 bg-gradient-to-r from-blue-50 to-emerald-50 p-6 sm:p-8">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-black text-slate-950">
                  {levelLabelText}
                </h2>
                {currentEvent && (
                  <span className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-black text-white">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-2 text-lg text-slate-700">
                {currentEvent
                  ? `Since ${formatDate(currentEvent.effectiveDate)}`
                  : "No current level has been added for this board."}
              </p>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
                {description}
              </p>
            </div>
            {currentEvent ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-8 bottom-2 -z-10 hidden text-[13rem] leading-none font-black text-emerald-500/10 lg:block"
              >
                {currentEvent.level}
              </span>
            ) : (
              <GraduationCap
                aria-hidden="true"
                className="pointer-events-none absolute right-12 bottom-8 -z-10 hidden size-40 text-violet-500/10 lg:block"
              />
            )}
          </div>
        </section>

        {weeklyRecommendation && (
          <div className="mt-6">
            <WeeklyPlanCard recommendation={weeklyRecommendation} />
          </div>
        )}

        <section
          aria-labelledby="level-history-heading"
          className="mt-6 rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="level-history-heading"
                className="flex items-center gap-3 text-2xl font-black text-slate-950"
              >
                <CalendarDays aria-hidden="true" className="size-7" />
                Level history
              </h2>
              <p className="mt-1 text-slate-500">
                Your level updates for this language board, newest first.
              </p>
            </div>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setFormMode({ kind: "create" })}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 font-bold text-slate-700 hover:bg-slate-50"
              >
                <Plus aria-hidden="true" className="size-4.5" />
                Add update
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-violet-200 bg-violet-50/60 p-6 text-center">
              <GraduationCap
                aria-hidden="true"
                className="mx-auto size-12 text-violet-600"
              />
              <h3 className="mt-3 text-xl font-black text-slate-950">
                Set your current level
              </h3>
              <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
                Add the level you believe is current for this board and the date
                it became current. You can edit the update later from this
                history.
              </p>
              <button
                type="button"
                onClick={() => setFormMode({ kind: "create" })}
                className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 font-bold text-white hover:bg-violet-700"
              >
                <Plus aria-hidden="true" className="size-5" />
                Set current level
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {history.map((event, index) => {
                const isCurrent = index === 0;
                return (
                  <article
                    key={event.id}
                    className={`flex flex-col gap-4 rounded-3xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                      isCurrent
                        ? "border-blue-200 bg-blue-50/70"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <LevelBadge level={event.level} current={isCurrent} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black text-slate-950">
                            {levelLabel(event.level)}
                          </h3>
                          {isCurrent && (
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-lg text-slate-600">
                          {isCurrent ? "Since" : "From"}{" "}
                          {formatDate(event.effectiveDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:shrink-0">
                      <button
                        type="button"
                        onClick={() => setFormMode({ kind: "edit", event })}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 font-bold text-slate-700 hover:bg-white sm:flex-none"
                      >
                        <Pencil aria-hidden="true" className="size-4.5" />
                        Edit
                      </button>
                      <form
                        action={deleteCefrLevelEvent}
                        onSubmit={(submitEvent) => {
                          if (
                            !window.confirm(
                              "Delete this level update? Your current level will move to the previous update if one exists.",
                            )
                          ) {
                            submitEvent.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="eventId" value={event.id} />
                        <button
                          type="submit"
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 font-bold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 aria-hidden="true" className="size-4.5" />
                          Delete
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950">
            <CheckCircle2
              aria-hidden="true"
              className="size-6 text-emerald-600"
            />
            How this history is used
          </h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-600">
            The app never promotes you automatically. Your newest non-future
            update becomes the current level for this board, and later Phase 4
            screens will use that date as the starting point for approximate
            Study Time and Vocabulary forecasts.
          </p>
        </section>
      </div>

      {formMode.kind !== "closed" && (
        <LevelForm
          boardId={selectedBoard.id}
          mode={formMode}
          todayKey={todayKey}
          onClose={() => setFormMode({ kind: "closed" })}
        />
      )}
    </main>
  );
}
