"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  Flag,
  History,
  Info,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { progressForecastDescription } from "@/lib/cefr/copy";

type CefrLevel = "A0" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type Scenario =
  | "active"
  | "a0"
  | "a1"
  | "a2"
  | "b2"
  | "c1"
  | "none"
  | "zero"
  | "reached"
  | "c2";
type Surface = "journey" | "statistics";
type HistoryEvent = {
  id: string;
  level: CefrLevel;
  effectiveDate: string;
};
type RecommendationCategory =
  | "Vocabulary"
  | "Grammar"
  | "Shadowing"
  | "Conversation"
  | "Listening"
  | "Reading";
type LevelRecommendation = {
  target: CefrLevel;
  categories: Array<{
    label: RecommendationCategory;
    percentage: number;
  }>;
  tips: Array<{
    title: string;
    text: string;
  }>;
};

const todayKey = "2026-07-27";
const levelOrder: CefrLevel[] = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const levelDescriptions: Record<CefrLevel, string> = {
  A0: "A0 · Absolute zero is an application-defined starting point for a complete beginner, not an official CEFR level. You may know few or no words and may not yet understand basic phrases. At this stage, the focus is on building the first essential vocabulary and recognizing simple sounds and expressions.",
  A1: "A1 is the beginner level for understanding and using familiar everyday expressions and basic phrases. You can introduce yourself, ask and answer simple personal questions, and follow slow, clear speech. Communication is possible when the other person speaks carefully and offers support.",
  A2: "A2 is the elementary level for communicating in simple, routine situations about familiar matters. You can understand frequently used language about topics such as family, shopping, work, and your immediate surroundings. You can describe your background, needs, and everyday activities in straightforward terms.",
  B1: "B1 is the intermediate level for handling most familiar situations in daily life, work, study, and travel. You can understand the main points of clear standard language and produce connected text on topics you know. You can describe experiences, plans, opinions, and ambitions with brief explanations.",
  B2: "B2 is the upper-intermediate level for understanding the main ideas of complex texts and discussions. You can interact with enough fluency and spontaneity to communicate comfortably with proficient speakers. You can explain viewpoints in detail and discuss the advantages and disadvantages of different options.",
  C1: "C1 is the advanced level for understanding demanding language and expressing ideas fluently. You can use the language flexibly and effectively for social, academic, and professional purposes. You can produce clear, well-structured communication about complex subjects with controlled organization and detail.",
  C2: "C2 is the highest level in this model and represents highly proficient language use. You can understand virtually everything heard or read and combine information from different sources coherently. You can express precise shades of meaning fluently, even in complex or sensitive situations.",
};
const recommendationColors: Record<RecommendationCategory, string> = {
  Vocabulary: "#10b981",
  Grammar: "#8b5cf6",
  Shadowing: "#3b82f6",
  Conversation: "#f59e0b",
  Listening: "#06b6d4",
  Reading: "#ec4899",
};
const reviewScenarioLevels: Partial<Record<Scenario, CefrLevel>> = {
  a0: "A0",
  a1: "A1",
  a2: "A2",
  b2: "B2",
  c1: "C1",
  c2: "C2",
};
const levelRecommendations: Record<
  Exclude<CefrLevel, "C2">,
  LevelRecommendation
> = {
  A0: {
    target: "A1",
    categories: [
      { label: "Vocabulary", percentage: 70 },
      { label: "Grammar", percentage: 15 },
      { label: "Shadowing", percentage: 15 },
    ],
    tips: [
      {
        title: "Build pronunciation habits.",
        text: "Learn basic phonetics and get used to accurate pronunciation from the beginning.",
      },
      {
        title: "Use beginner-friendly video.",
        text: "Watch level-appropriate YouTube videos and repeat after the speaker with shadowing.",
      },
      {
        title: "Learn basic sentence structure.",
        text: "Focus on how sentences are built and how words, especially verbs, change in the present tense.",
      },
      {
        title: "Recognize cases and articles.",
        text: "Learn to tell them apart, but do not get stuck trying to master every detail immediately.",
      },
      {
        title: "Learn language in context.",
        text: "Study complete sentences instead of isolated words.",
      },
      {
        title: "Use spaced repetition.",
        text: "Anki is a good option for reviewing material at the right intervals.",
      },
      {
        title: "Create practical verb cards.",
        text: "Make cards for the most common verbs in each present-tense form.",
      },
      {
        title: "Keep a daily target.",
        text: "Aim to add at least 10 new cards each day.",
      },
    ],
  },
  A1: {
    target: "A2",
    categories: [
      { label: "Vocabulary", percentage: 65 },
      { label: "Grammar", percentage: 15 },
      { label: "Shadowing", percentage: 20 },
    ],
    tips: [
      {
        title: "Keep practicing pronunciation.",
        text: "Watch level-appropriate YouTube videos and repeat after the speaker with shadowing.",
      },
      {
        title: "Learn the main verb tenses.",
        text: "Build a practical foundation in the grammar of the most common tenses.",
      },
      {
        title: "Learn language in context.",
        text: "Study complete sentences instead of isolated words.",
      },
      {
        title: "Use spaced repetition.",
        text: "Use Anki or a similar system to review material consistently.",
      },
      {
        title: "Create verb cards.",
        text: "Make cards for common verbs in different tense forms.",
      },
      {
        title: "Keep a daily target.",
        text: "Aim to add at least 10 new cards each day.",
      },
    ],
  },
  A2: {
    target: "B1",
    categories: [
      { label: "Vocabulary", percentage: 50 },
      { label: "Conversation", percentage: 10 },
      { label: "Listening", percentage: 40 },
    ],
    tips: [
      {
        title: "Start speaking regularly.",
        text: "Talk with native speakers, practice with AI, or speak to yourself aloud.",
      },
      {
        title: "Increase listening practice.",
        text: "Listen extensively to level-appropriate podcasts and YouTube videos.",
      },
      {
        title: "Capture useful vocabulary.",
        text: "Write down important new words, create cards with them, and review them consistently.",
      },
    ],
  },
  B1: {
    target: "B2",
    categories: [
      { label: "Vocabulary", percentage: 20 },
      { label: "Reading", percentage: 20 },
      { label: "Conversation", percentage: 20 },
      { label: "Listening", percentage: 40 },
    ],
    tips: [
      {
        title: "Speak more often.",
        text: "Increase practice with native speakers, AI, or by talking to yourself aloud.",
      },
      {
        title: "Move toward native content.",
        text: "Start with cartoons or series you have already watched in your own language and remember well.",
      },
      {
        title: "Begin reading for enjoyment.",
        text: "Try comics or accessible fiction in the language you are learning.",
      },
      {
        title: "Make news easier to read.",
        text: "Read news articles and ask AI to simplify difficult passages to your level.",
      },
      {
        title: "Keep collecting useful words.",
        text: "Write them down, turn them into cards, and review them consistently.",
      },
    ],
  },
  B2: {
    target: "C1",
    categories: [
      { label: "Reading", percentage: 20 },
      { label: "Conversation", percentage: 40 },
      { label: "Listening", percentage: 40 },
    ],
    tips: [
      {
        title: "Consume more native content.",
        text: "Make content created for native speakers a regular part of your learning.",
      },
      {
        title: "Speak about varied topics.",
        text: "Talk with native speakers as much as possible and explore a wide range of subjects.",
      },
      {
        title: "Change your digital environment.",
        text: "Switch your devices and interfaces to the language you are learning.",
      },
    ],
  },
  C1: {
    target: "C2",
    categories: [
      { label: "Reading", percentage: 20 },
      { label: "Conversation", percentage: 40 },
      { label: "Listening", percentage: 40 },
    ],
    tips: [
      {
        title: "Consume more native content.",
        text: "Make content created for native speakers a regular part of your learning.",
      },
      {
        title: "Speak about varied topics.",
        text: "Talk with native speakers as much as possible and explore a wide range of subjects.",
      },
      {
        title: "Change your digital environment.",
        text: "Switch your devices and interfaces to the language you are learning.",
      },
    ],
  },
};
const studyTransitions: Record<Exclude<CefrLevel, "C2">, number> = {
  A0: 40,
  A1: 60,
  A2: 140,
  B1: 240,
  B2: 300,
  C1: 450,
};
const studyBaselines: Record<CefrLevel, number> = {
  A0: 0,
  A1: 40,
  A2: 100,
  B1: 240,
  B2: 480,
  C1: 780,
  C2: 1230,
};
const vocabularyMidpoints: Record<CefrLevel, number> = {
  A0: 0,
  A1: 900,
  A2: 1600,
  B1: 2500,
  B2: 3700,
  C1: 5000,
  C2: 7000,
};
const initialHistory: HistoryEvent[] = [
  { id: "event-b1", level: "B1", effectiveDate: "2026-07-12" },
  { id: "event-a2", level: "A2", effectiveDate: "2025-01-10" },
  { id: "event-a1", level: "A1", effectiveDate: "2024-02-12" },
  { id: "event-a0", level: "A0", effectiveDate: "2023-09-01" },
];

function nextLevel(level: CefrLevel) {
  const index = levelOrder.indexOf(level);
  return index < levelOrder.length - 1 ? levelOrder[index + 1] : null;
}

function formatDate(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function forecastDate(days: number) {
  const date = new Date(`${todayKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date;
}

function calendarDuration(days: number) {
  const start = new Date(`${todayKey}T12:00:00`);
  const end = forecastDate(days);
  let cursor = new Date(start);
  let years = 0;
  let months = 0;

  while (true) {
    const candidate = new Date(cursor);
    candidate.setFullYear(candidate.getFullYear() + 1);
    if (candidate > end) break;
    cursor = candidate;
    years += 1;
  }
  while (true) {
    const candidate = new Date(cursor);
    candidate.setMonth(candidate.getMonth() + 1);
    if (candidate > end) break;
    cursor = candidate;
    months += 1;
  }
  const remainingDays = Math.round(
    (end.getTime() - cursor.getTime()) / 86_400_000,
  );
  return [
    years ? `${years} ${years === 1 ? "year" : "years"}` : "",
    months ? `${months} ${months === 1 ? "month" : "months"}` : "",
    remainingDays
      ? `${remainingDays} ${remainingDays === 1 ? "day" : "days"}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");
}

function percentage(value: number, target: number) {
  return Math.min(100, Math.round((value / target) * 100));
}

function LevelBadge({
  level,
  muted = false,
  small = false,
}: {
  level: CefrLevel;
  muted?: boolean;
  small?: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-extrabold ${
        small ? "size-10 text-sm" : "size-16 text-xl sm:size-20 sm:text-2xl"
      } ${
        muted
          ? "border border-slate-200 bg-slate-100 text-slate-500"
          : "bg-slate-950 text-white shadow-lg shadow-slate-300"
      }`}
    >
      {level}
    </span>
  );
}

function PaceComparison({
  sevenAverage,
  thirtyAverage,
  remaining,
  unit,
  accent,
  next,
}: {
  sevenAverage: number;
  thirtyAverage: number;
  remaining: number;
  unit: "minutes" | "words";
  accent: "blue" | "green";
  next: CefrLevel;
}) {
  const windows = [sevenAverage, thirtyAverage].map((average) => {
    if (average <= 0) return null;
    const days = Math.ceil(remaining / average);
    return {
      average,
      duration: calendarDuration(days),
      date: formatMonthYear(forecastDate(days)),
    };
  });
  const accentClasses =
    accent === "blue"
      ? {
          border: "border-blue-200",
          background: "bg-blue-50/60",
          heading: "text-blue-800",
        }
      : {
          border: "border-emerald-200",
          background: "bg-emerald-50/60",
          heading: "text-emerald-800",
        };

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${accentClasses.border} ${accentClasses.background}`}
    >
      <div className="border-b border-slate-200/80 p-4">
        <strong className="text-base font-bold text-slate-700">
          Forecast to reach {next} with your current pace
        </strong>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[300px] table-fixed text-left text-xs sm:text-sm">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[35%]" />
            <col className="w-[35%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200/80">
              <th
                scope="col"
                className="px-3 py-3 font-semibold text-slate-500"
              >
                <span className="sr-only">Measure</span>
              </th>
              <th
                scope="col"
                className={`px-2 py-3 font-bold ${accentClasses.heading}`}
              >
                Last 7 days
              </th>
              <th
                scope="col"
                className={`px-2 py-3 font-bold ${accentClasses.heading}`}
              >
                Last 30 days
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            <tr>
              <th scope="row" className="px-3 py-3 font-medium text-slate-500">
                Average pace
              </th>
              {windows.map((window, index) => (
                <td
                  key={`pace-${index}`}
                  className="px-2 py-3 font-bold text-slate-950"
                >
                  {window ? (
                    <>
                      {window.average.toLocaleString("en", {
                        maximumFractionDigits: 1,
                      })}{" "}
                      {unit === "minutes" ? "min/day" : "words/day"}
                    </>
                  ) : (
                    "No data"
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="px-3 py-3 font-medium text-slate-500">
                Reach {next} in
              </th>
              {windows.map((window, index) => (
                <td
                  key={`duration-${index}`}
                  className="px-2 py-3 font-bold text-slate-950"
                >
                  {window ? `≈ ${window.duration}` : "Not available"}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="px-3 py-3 font-medium text-slate-500">
                Estimated date
              </th>
              {windows.map((window, index) => (
                <td key={`date-${index}`} className="px-2 py-3 text-slate-600">
                  {window?.date ?? "Not available"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ForecastCard({
  kind,
  level,
  scenario,
}: {
  kind: "study" | "vocabulary";
  level: CefrLevel;
  scenario: Scenario;
}) {
  const next = nextLevel(level);
  const isStudy = kind === "study";
  const eligible =
    scenario === "reached" ? (isStudy ? 220 : 1320) : isStudy ? 60 : 400;
  const target =
    next === null
      ? 0
      : isStudy
        ? studyTransitions[level as Exclude<CefrLevel, "C2">]
        : vocabularyMidpoints[next] - vocabularyMidpoints[level];
  const remaining = Math.max(0, target - eligible);
  const currentBaseline = isStudy
    ? studyBaselines[level]
    : vocabularyMidpoints[level];
  const nextTotal =
    next === null
      ? currentBaseline
      : isStudy
        ? studyBaselines[next]
        : vocabularyMidpoints[next];
  const estimatedTotal = isStudy
    ? studyBaselines[level] + eligible
    : vocabularyMidpoints[level] + eligible;
  const sevenAverage = scenario === "zero" ? 0 : isStudy ? 60 : 5;
  const thirtyAverage = scenario === "zero" ? 0 : isStudy ? 36 : 3;
  const accent = isStudy ? "blue" : "green";

  return (
    <section
      className={`rounded-3xl border bg-white p-5 shadow-sm sm:p-6 ${
        isStudy ? "border-blue-200" : "border-emerald-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-2xl ${
            isStudy
              ? "bg-blue-50 text-blue-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isStudy ? (
            <Clock3 aria-hidden="true" className="size-5" />
          ) : (
            <BookOpen aria-hidden="true" className="size-5" />
          )}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-950">
            {isStudy ? "Study Time progress" : "Vocabulary progress"}
          </h2>
          {next && (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {progressForecastDescription(level, next)}
            </p>
          )}
        </div>
      </div>

      {next === null ? (
        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-amber-500"
            />
            <div>
              <strong className="text-slate-950">
                Highest level in this model
              </strong>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Your estimated totals remain visible, but there is no next-level
                forecast after C2.
              </p>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <span className="block text-xs font-bold tracking-wide text-slate-500 uppercase">
                  {isStudy
                    ? "Estimated total learning time"
                    : "Estimated vocabulary size"}
                </span>
                <strong className="mt-1 block text-lg text-slate-950">
                  &gt; {estimatedTotal.toLocaleString("en")}{" "}
                  {isStudy ? "hours" : "words"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <div className="grid grid-cols-3 items-end gap-2 sm:gap-5">
              <span className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                Current
              </span>
              <span
                className={`text-center text-xs font-bold tracking-wide uppercase ${
                  isStudy ? "text-blue-700" : "text-emerald-700"
                }`}
              >
                Progress
              </span>
              <span className="text-right text-xs font-bold tracking-wide text-slate-500 uppercase">
                Next
              </span>
            </div>

            <div className="mt-2 grid grid-cols-3 items-center gap-2 sm:gap-5">
              <div className="flex justify-start">
                <LevelBadge level={level} small />
              </div>
              <strong className="block whitespace-nowrap text-center text-xl leading-6 text-slate-950">
                +{eligible.toLocaleString("en")}
                {isStudy ? " hours" : " words"}
              </strong>
              <div className="flex justify-end">
                <LevelBadge level={next} small muted />
              </div>
            </div>

            <div className="mt-1 grid grid-cols-3 items-start gap-2 text-sm leading-5 text-slate-600 sm:gap-5">
              <span className="text-left">
                ≈ {currentBaseline.toLocaleString("en")}
                {isStudy ? " h" : " w"}
              </span>
              <span className="text-center">
                ≈ {estimatedTotal.toLocaleString("en")}
                {isStudy ? " h" : " w"} now
              </span>
              <span className="text-right">
                ≈ {nextTotal.toLocaleString("en")}
                {isStudy ? " h total" : " w total"}
              </span>
            </div>
          </div>

          <div
            className="relative mt-6 h-3 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage(eligible, target)}
            aria-label={`${isStudy ? "Study Time" : "Vocabulary"} reference progress`}
          >
            <div
              className={`h-full rounded-full ${
                isStudy ? "bg-blue-600" : "bg-emerald-600"
              }`}
              style={{ width: `${percentage(eligible, target)}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base font-bold">
            <strong className={isStudy ? "text-blue-700" : "text-emerald-700"}>
              {percentage(eligible, target)}% completed
            </strong>
            {remaining > 0 ? (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  •
                </span>
                <span className="text-slate-700">
                  ≈ {remaining.toLocaleString("en")}{" "}
                  {isStudy ? "hours" : "words"} left
                </span>
              </>
            ) : (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  •
                </span>
                <span className="text-slate-700">Reference reached</span>
              </>
            )}
          </div>

          {remaining === 0 ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Check
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-amber-700"
              />
              <p className="text-sm leading-6 text-amber-950">
                You reached this reference point. Consider reassessing your
                level; the app will never change it automatically.
              </p>
            </div>
          ) : (
            <div className="mt-8">
              <PaceComparison
                sevenAverage={sevenAverage}
                thirtyAverage={thirtyAverage}
                remaining={isStudy ? remaining * 60 : remaining}
                unit={isStudy ? "minutes" : "words"}
                accent={accent}
                next={next}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function WeeklyRecommendation({ level }: { level: CefrLevel }) {
  if (level === "C2") return null;

  const recommendation = levelRecommendations[level];
  const gradient = recommendation.categories
    .map((category, index) => {
      const start = recommendation.categories
        .slice(0, index)
        .reduce((total, item) => total + item.percentage, 0);
      const end = start + category.percentage;
      return `${recommendationColors[category.label]} ${start}% ${end}%`;
    })
    .join(", ");
  const chartLabel = recommendation.categories
    .map(
      (category) =>
        `${category.label} ${category.percentage} percent, ${category.percentage / 10} hours per week`,
    )
    .join("; ");

  return (
    <section className="rounded-3xl border border-violet-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <Target aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Weekly plan to reach {recommendation.target}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A suggested 10-hour weekly mix for faster progress.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(280px,0.85fr)_1.4fr]">
        <div className="rounded-2xl bg-slate-50 p-4 sm:p-5">
          <div className="grid items-center gap-5 sm:grid-cols-[11rem_minmax(0,1fr)] lg:grid-cols-1">
            <div
              role="img"
              aria-label={chartLabel}
              className="relative mx-auto size-44 rounded-full"
              style={{ background: `conic-gradient(${gradient})` }}
            >
              <div className="absolute inset-7 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                <strong className="text-2xl text-slate-950">10h</strong>
                <span className="text-xs font-medium text-slate-500">
                  per week
                </span>
              </div>
            </div>

            <ul className="min-w-0 space-y-3">
              {recommendation.categories.map((category) => {
                const weeklyHours = category.percentage / 10;
                return (
                  <li
                    key={category.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-700">
                      <span
                        aria-hidden="true"
                        className="size-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: recommendationColors[category.label],
                        }}
                      />
                      {category.label}
                    </span>
                    <strong className="whitespace-nowrap text-sm text-slate-950">
                      {category.percentage}% · {weeklyHours}h
                    </strong>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-950">
            How to use this plan
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {recommendation.tips.map((tip) => (
              <li
                key={tip.title}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 p-3"
              >
                <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Check aria-hidden="true" className="size-3.5" />
                </span>
                <p className="text-sm leading-6 text-slate-600">
                  <strong className="text-slate-900">{tip.title}</strong>{" "}
                  {tip.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Disclosure() {
  return (
    <details className="group rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Info aria-hidden="true" className="size-5" />
          </span>
          <span>
            <strong className="block text-slate-950">
              How these estimates work
            </strong>
            <span className="text-sm text-slate-500">
              Sources, units, and limitations
            </span>
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-5 text-slate-400 transition group-open:rotate-180"
        />
      </summary>
      <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-600 lg:grid-cols-2">
        <div>
          <strong className="text-slate-900">Study Time</strong>
          <p className="mt-2">
            The table shows typical hour ranges for each level step, the exact
            value the app uses for calculations, and the cumulative totals from
            A0.
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-bold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-3">Step</th>
                  <th className="px-3 py-3">Typical hours for this step</th>
                  <th className="px-3 py-3">Hours used in the app</th>
                  <th className="px-3 py-3">Total typical hours from A0</th>
                  <th className="px-3 py-3">Total hours used in the app</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <th className="px-3 py-3">A0 {"->"} A1</th>
                  <td className="px-3 py-3">40-60 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">40 h</td>
                  <td className="px-3 py-3">40-60 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">40 h</td>
                </tr>
                <tr>
                  <th className="px-3 py-3">A1 {"->"} A2</th>
                  <td className="px-3 py-3">60-90 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">60 h</td>
                  <td className="px-3 py-3">100-150 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">100 h</td>
                </tr>
                <tr>
                  <th className="px-3 py-3">A2 {"->"} B1</th>
                  <td className="px-3 py-3">140-200 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">140 h</td>
                  <td className="px-3 py-3">240-350 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">240 h</td>
                </tr>
                <tr>
                  <th className="px-3 py-3">B1 {"->"} B2</th>
                  <td className="px-3 py-3">160-240 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">240 h</td>
                  <td className="px-3 py-3">400-590 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">480 h</td>
                </tr>
                <tr>
                  <th className="px-3 py-3">B2 {"->"} C1</th>
                  <td className="px-3 py-3">200-300 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">300 h</td>
                  <td className="px-3 py-3">600-890 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">780 h</td>
                </tr>
                <tr>
                  <th className="px-3 py-3">C1 {"->"} C2</th>
                  <td className="px-3 py-3">280-450 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">450 h</td>
                  <td className="px-3 py-3">880-1,340 h</td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    1,230 h
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 border-t border-slate-100 pt-3">
            These figures are based on averaged data from Cambridge English, the
            Goethe-Institut, and European language institutes. They are
            approximate guides, not guaranteed timeframes.
          </p>
        </div>
        <div>
          <strong className="text-slate-900">Vocabulary</strong>
          <p className="mt-2">
            The table shows typical vocabulary ranges for each level, and the
            exact value the app uses for calculations.
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-[500px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-bold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-3">Level</th>
                  <th className="px-3 py-3">Typical vocabulary range</th>
                  <th className="px-3 py-3">Words used in the app</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <th className="px-3 py-3">A0</th>
                  <td className="px-3 py-3">0 words</td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    0 words
                  </td>
                </tr>
                <tr>
                  <th className="px-3 py-3">A1</th>
                  <td className="px-3 py-3">700-1,200 words</td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    900 words
                  </td>
                </tr>
                <tr>
                  <th className="px-3 py-3">A2</th>
                  <td className="px-3 py-3">1,200-2,000 words</td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    1,600 words
                  </td>
                </tr>
                <tr>
                  <th className="px-3 py-3">B1</th>
                  <td className="px-3 py-3">2,000-3,000 words</td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    2,500 words
                  </td>
                </tr>
                <tr>
                  <th className="px-3 py-3">B2</th>
                  <td className="px-3 py-3">3,000-4,500 words</td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    3,700 words
                  </td>
                </tr>
                <tr>
                  <th className="px-3 py-3">C1</th>
                  <td className="px-3 py-3">4,000-6,000 words</td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    5,000 words
                  </td>
                </tr>
                <tr>
                  <th className="px-3 py-3">C2</th>
                  <td className="px-3 py-3">5,000-8,000+ words</td>
                  <td className="px-3 py-3 font-bold text-slate-900">
                    7,000 words
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 border-t border-slate-100 pt-3">
            These ranges are based on vocabulary research by Milton and by
            Finlayson, Marsden, and Hawkes. They are not official CEFR
            standards.
          </p>
        </div>
      </div>
    </details>
  );
}

function LevelForm({
  event,
  history,
  onClose,
  onSave,
}: {
  event: HistoryEvent | null;
  history: HistoryEvent[];
  onClose: () => void;
  onSave: (event: HistoryEvent) => void;
}) {
  const [level, setLevel] = useState<CefrLevel>(event?.level ?? "B2");
  const [date, setDate] = useState(event?.effectiveDate ?? todayKey);
  const [error, setError] = useState("");

  function submit() {
    if (date > todayKey) {
      setError("The effective date cannot be in the future.");
      return;
    }
    if (
      history.some(
        (item) => item.id !== event?.id && item.effectiveDate === date,
      )
    ) {
      setError(
        "A level declaration already exists for this date. Choose another date.",
      );
      return;
    }
    const candidate = [
      ...history.filter((item) => item.id !== event?.id),
      {
        id: event?.id ?? `event-${Date.now()}`,
        level,
        effectiveDate: date,
      },
    ].sort((left, right) =>
      right.effectiveDate.localeCompare(left.effectiveDate),
    );
    const index = candidate.findIndex(
      (item) =>
        item.id ===
        (event?.id ??
          candidate.find(
            (item) => item.level === level && item.effectiveDate === date,
          )?.id),
    );
    if (
      (index > 0 && candidate[index - 1]?.level === level) ||
      (index < candidate.length - 1 && candidate[index + 1]?.level === level)
    ) {
      setError(
        "This level is already effective for the adjacent period. Choose a different level or edit that declaration.",
      );
      return;
    }
    onSave(candidate[index]);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-form-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-blue-600 uppercase">
              Language level
            </p>
            <h2
              id="level-form-title"
              className="mt-2 text-2xl font-bold text-slate-950"
            >
              {event ? "Edit level update" : "Add level update"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold text-slate-900">
            Choose your level
          </legend>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {levelOrder.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setLevel(option);
                  setError("");
                }}
                aria-pressed={level === option}
                className={`min-h-12 rounded-xl border font-bold ${
                  level === option
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-400"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <strong className="text-slate-950">
            {level === "A0" ? "Absolute zero" : `Level ${level}`}
          </strong>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {levelDescriptions[level]}
          </p>
        </div>

        <label className="mt-5 block text-sm font-bold text-slate-900">
          Effective date
          <input
            type="date"
            max={todayKey}
            value={date}
            onChange={(changeEvent) => {
              setDate(changeEvent.target.value);
              setError("");
            }}
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base"
          />
        </label>
        <p className="mt-2 text-sm text-slate-500">
          Use today or a past date. This date becomes the starting point for
          progress calculations.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-4.5 shrink-0"
            />
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={submit}
            className="min-h-12 flex-1 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700"
          >
            {event ? "Save changes" : "Add update"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryList({
  history,
  onAdd,
  onEdit,
  onDelete,
}: {
  history: HistoryEvent[];
  onAdd: () => void;
  onEdit: (event: HistoryEvent) => void;
  onDelete: (event: HistoryEvent) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History aria-hidden="true" className="size-5 text-slate-500" />
            <h2 className="text-xl font-bold text-slate-950">Level history</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Your level updates, newest first.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800"
        >
          <Plus aria-hidden="true" className="size-4.5" />
          Add update
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {history.map((event, index) => (
          <article
            key={event.id}
            className={`flex items-center gap-3 rounded-2xl border p-3 sm:p-4 ${
              index === 0 ? "border-blue-200 bg-blue-50/60" : "border-slate-200"
            }`}
          >
            <LevelBadge level={event.level} small muted={index !== 0} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-slate-950">
                  {event.level === "A0"
                    ? "Level A0 - Absolute zero"
                    : `Level ${event.level}`}
                </strong>
                {index === 0 && (
                  <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {index === 0 ? "Since" : "From"}{" "}
                {formatDate(event.effectiveDate)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(event)}
              aria-label={`Edit ${event.level} declaration`}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:text-blue-700"
            >
              <Pencil aria-hidden="true" className="size-4.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(event)}
              aria-label={`Delete ${event.level} declaration`}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 aria-hidden="true" className="size-4.5" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm">
      <div className="grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr] lg:p-10">
        <div>
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <Target aria-hidden="true" className="size-6" />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Set your current level
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Add your current level to unlock approximate Study Time and
            Vocabulary progress. The app will never assess or promote you
            automatically.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white hover:bg-blue-700"
          >
            <Plus aria-hidden="true" className="size-5" />
            Set current level
          </button>
        </div>
        <div className="relative mx-auto flex h-52 w-full max-w-sm items-center justify-center">
          <div className="absolute size-44 rounded-full bg-blue-100 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <LevelBadge level="A0" muted />
            <ArrowRight aria-hidden="true" className="size-6 text-slate-300" />
            <LevelBadge level="A1" muted />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatisticsPreview({
  level,
  scenario,
}: {
  level: CefrLevel | null;
  scenario: Scenario;
}) {
  if (!level) {
    return <EmptyState onAdd={() => undefined} />;
  }
  const studyEligible = scenario === "reached" ? 220 : 60;
  const wordEligible = scenario === "reached" ? 1320 : 400;
  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold text-slate-950">
              Your learning overview
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Your saved totals are shown alongside approximate values based on
              your current {level} level and progress since July 12, 2026.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700">
            <Flag aria-hidden="true" className="size-4" />
            Current level · {level}
          </span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              value: "312h",
              label: "Tracked study time",
              detail: "Saved in Study Time",
              icon: Clock3,
              iconClass: "bg-blue-50 text-blue-700",
            },
            {
              value: `≈ ${(studyBaselines[level] + studyEligible).toLocaleString("en")}h`,
              label: "Estimated learning time",
              detail: `${level} level + ${studyEligible}h since July 12`,
              icon: Target,
              iconClass: "bg-violet-50 text-violet-700",
            },
            {
              value: "1,140",
              label: "Tracked words",
              detail: "Saved in Vocabulary",
              icon: BookOpen,
              iconClass: "bg-emerald-50 text-emerald-700",
            },
            {
              value: `≈ ${(vocabularyMidpoints[level] + wordEligible).toLocaleString("en")}`,
              label: "Estimated words known",
              detail: `${level} level + ${wordEligible.toLocaleString("en")} words since July 12`,
              icon: Sparkles,
              iconClass: "bg-violet-50 text-violet-700",
            },
          ].map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${metric.iconClass}`}
                >
                  <metric.icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <strong className="block text-2xl text-slate-950">
                    {metric.value}
                  </strong>
                  <span className="mt-1 block text-sm font-semibold text-slate-700">
                    {metric.label}
                  </span>
                </div>
              </div>
              <span className="mt-2 block text-xs text-slate-500">
                {metric.detail}
              </span>
            </article>
          ))}
        </div>
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ForecastCard kind="study" level={level} scenario={scenario} />
        <ForecastCard kind="vocabulary" level={level} scenario={scenario} />
      </div>
      {level !== "C2" && (
        <div className="mt-6">
          <WeeklyRecommendation level={level} />
        </div>
      )}
      <div className="mt-6">
        <Disclosure />
      </div>
    </>
  );
}

export function CefrPreview() {
  const [scenario, setScenario] = useState<Scenario>("active");
  const [surface, setSurface] = useState<Surface>("journey");
  const [history, setHistory] = useState<HistoryEvent[]>(initialHistory);
  const [editingEvent, setEditingEvent] = useState<HistoryEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteEvent, setDeleteEvent] = useState<HistoryEvent | null>(null);

  const scenarioHistory = useMemo(() => {
    if (scenario === "none") return [];
    const reviewLevel = reviewScenarioLevels[scenario];
    if (reviewLevel) {
      return [
        {
          id: `scenario-${scenario}-${reviewLevel.toLowerCase()}`,
          level: reviewLevel,
          effectiveDate: "2026-07-12",
        },
        ...history.filter((event) => event.effectiveDate < "2026-07-12"),
      ];
    }
    return history;
  }, [history, scenario]);
  const currentLevel = scenarioHistory[0]?.level ?? null;

  function saveEvent(event: HistoryEvent) {
    setHistory((current) => {
      if (scenario === "none") return [event];
      return [...current.filter((item) => item.id !== event.id), event].sort(
        (left, right) => right.effectiveDate.localeCompare(left.effectiveDate),
      );
    });
    setFormOpen(false);
    setEditingEvent(null);
    setScenario("active");
  }

  return (
    <main
      ref={(node) => {
        if (node) node.dataset.previewReady = "true";
      }}
      className="min-h-screen bg-slate-50"
    >
      <aside className="border-b border-violet-200 bg-violet-50">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles aria-hidden="true" className="size-4 text-violet-600" />
            <strong className="text-violet-950">Phase 4A review mode</strong>
            <span className="hidden text-violet-700 sm:inline">
              Static data · no changes are saved
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-xl bg-white p-1 shadow-sm">
              {(
                [
                  ["journey", "CEFR journey"],
                  ["statistics", "Statistics"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSurface(value)}
                  className={`min-h-9 rounded-lg px-3 text-xs font-bold ${
                    surface === value
                      ? "bg-violet-600 text-white"
                      : "text-violet-700 hover:bg-violet-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-violet-800 shadow-sm">
              State
              <select
                value={scenario}
                onChange={(event) =>
                  setScenario(event.target.value as Scenario)
                }
                className="bg-transparent text-sm text-slate-900"
              >
                <option value="active">B1 · active pace</option>
                <option value="a0">A0 · weekly plan</option>
                <option value="a1">A1 · weekly plan</option>
                <option value="a2">A2 · weekly plan</option>
                <option value="b2">B2 · weekly plan</option>
                <option value="c1">C1 · weekly plan</option>
                <option value="none">No level</option>
                <option value="zero">B1 · zero pace</option>
                <option value="reached">B1 · reference reached</option>
                <option value="c2">C2 · highest level</option>
              </select>
            </label>
          </div>
        </div>
      </aside>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-17 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-lg font-bold text-slate-950 hover:bg-slate-50"
          >
            German
            <ChevronDown aria-hidden="true" className="size-4 text-slate-400" />
          </button>
          <nav aria-label="Primary" className="hidden items-stretch md:flex">
            <Link
              href="/dashboard"
              className="flex min-h-17 items-center gap-2 px-5 font-semibold text-slate-600 hover:text-blue-700"
            >
              <Clock3 aria-hidden="true" className="size-5" />
              Study Time
            </Link>
            <Link
              href="/vocabulary-preview"
              className="flex min-h-17 items-center gap-2 px-5 font-semibold text-slate-600 hover:text-emerald-700"
            >
              <BookOpen aria-hidden="true" className="size-5" />
              Vocabulary
            </Link>
            <button
              type="button"
              onClick={() => setSurface("statistics")}
              className={`flex min-h-17 items-center gap-2 border-b-3 px-5 font-semibold ${
                surface === "statistics"
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-600 hover:text-violet-700"
              }`}
            >
              <BarChart3 aria-hidden="true" className="size-5" />
              Statistics
            </button>
          </nav>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Settings"
              className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Settings aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              className="hidden min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:block"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav
          aria-label="Mobile primary"
          className="grid grid-cols-3 border-t border-slate-100 md:hidden"
        >
          <Link
            href="/dashboard"
            className="flex min-h-14 items-center justify-center gap-1.5 text-xs font-semibold text-slate-600"
          >
            <Clock3 aria-hidden="true" className="size-4.5" />
            Study Time
          </Link>
          <Link
            href="/vocabulary-preview"
            className="flex min-h-14 items-center justify-center gap-1.5 text-xs font-semibold text-slate-600"
          >
            <BookOpen aria-hidden="true" className="size-4.5" />
            Vocabulary
          </Link>
          <button
            type="button"
            onClick={() => setSurface("statistics")}
            className={`flex min-h-14 items-center justify-center gap-1.5 border-b-3 text-xs font-semibold ${
              surface === "statistics"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-600"
            }`}
          >
            <BarChart3 aria-hidden="true" className="size-4.5" />
            Statistics
          </button>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <button
          type="button"
          onClick={() => setSurface("journey")}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {surface === "statistics" ? "CEFR journey" : "Back to Study Time"}
        </button>

        {surface === "statistics" ? (
          <div className="mt-4">
            <StatisticsPreview level={currentLevel} scenario={scenario} />
          </div>
        ) : scenarioHistory.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              onAdd={() => {
                setEditingEvent(null);
                setFormOpen(true);
              }}
            />
          </div>
        ) : (
          <>
            <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                    Your language level
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                    Track your progress and get approximate forecasts for
                    reaching the next CEFR level.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setFormOpen(true);
                  }}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 font-bold text-white hover:bg-slate-800"
                >
                  <Plus aria-hidden="true" className="size-5" />
                  Add level update
                </button>
              </div>
              <div
                data-current-level-summary
                className="relative overflow-hidden border-t border-slate-200 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-6 sm:p-8"
              >
                <div className="relative z-10 max-w-3xl sm:pr-24 lg:max-w-[72%] lg:pr-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-950">
                      {currentLevel === "A0"
                        ? "Level A0 - Absolute zero"
                        : `Level ${currentLevel}`}
                    </h2>
                    <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
                      Current
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Since {formatDate(scenarioHistory[0].effectiveDate)}
                  </p>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                    {levelDescriptions[currentLevel!]}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-8 hidden -translate-y-1/2 text-[8rem] leading-none font-black tracking-tighter text-emerald-900/10 select-none sm:block lg:right-14 lg:text-[10rem]"
                >
                  {currentLevel}
                </span>
              </div>
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <ForecastCard
                kind="study"
                level={currentLevel!}
                scenario={scenario}
              />
              <ForecastCard
                kind="vocabulary"
                level={currentLevel!}
                scenario={scenario}
              />
            </div>

            {currentLevel !== "C2" && (
              <div className="mt-6">
                <WeeklyRecommendation level={currentLevel!} />
              </div>
            )}

            <div className="mt-6">
              <Disclosure />
            </div>

            <div className="mt-6">
              <HistoryList
                history={scenarioHistory}
                onAdd={() => {
                  setEditingEvent(null);
                  setFormOpen(true);
                }}
                onEdit={(event) => {
                  setEditingEvent(event);
                  setFormOpen(true);
                }}
                onDelete={setDeleteEvent}
              />
            </div>
          </>
        )}
      </div>

      {formOpen && (
        <LevelForm
          event={editingEvent}
          history={scenarioHistory}
          onClose={() => {
            setFormOpen(false);
            setEditingEvent(null);
          }}
          onSave={saveEvent}
        />
      )}

      {deleteEvent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-level-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        >
          <div className="w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <Trash2 aria-hidden="true" className="size-5" />
            </span>
            <h2
              id="delete-level-title"
              className="mt-5 text-2xl font-bold text-slate-950"
            >
              Delete {deleteEvent.level} update?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This declaration is effective{" "}
              {formatDate(deleteEvent.effectiveDate)}.
              {deleteEvent.id === scenarioHistory[0]?.id &&
                scenarioHistory[1] &&
                ` ${scenarioHistory[1].level} will become your current level.`}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setHistory((current) =>
                    current.filter((event) => event.id !== deleteEvent.id),
                  );
                  setDeleteEvent(null);
                  setScenario("active");
                }}
                className="min-h-12 flex-1 rounded-xl bg-red-600 px-5 font-bold text-white hover:bg-red-700"
              >
                Delete update
              </button>
              <button
                type="button"
                onClick={() => setDeleteEvent(null)}
                className="min-h-12 rounded-xl border border-slate-300 px-5 font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
