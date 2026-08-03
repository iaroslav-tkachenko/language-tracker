"use client";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Gauge,
  GraduationCap,
  LogOut,
  Settings,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ActivityIcon } from "@/components/activities/activity-icon";
import { ConfirmSignOutForm } from "@/components/auth/confirm-sign-out-form";
import {
  CefrLevelPrompt,
  MissingLevelBubble,
} from "@/components/cefr/cefr-level-prompt";
import { WeeklyPlanCard } from "@/components/cefr/weekly-plan-card";
import type { CefrLevel } from "@/lib/cefr/reference";
import { getWeeklyRecommendation } from "@/lib/cefr/recommendations";
import {
  calculateStudyTimeForecast,
  formatCalendarDuration,
  formatEstimatedMonth,
  formatForecastHours,
  formatPaceMinutes,
  getStudyTimeBaselineMinutes,
  type StudyTimeForecast,
} from "@/lib/cefr/study-time";
import {
  calculateVocabularyForecast,
  formatVocabularyPace,
  formatVocabularyWords,
  getVocabularyBaselineWords,
  type VocabularyForecast,
} from "@/lib/cefr/vocabulary";
import {
  calculateStudyStatistics,
  getActivityTotals,
  getDayDistribution,
  getMonthDistribution,
  getRecentActivityTotals,
  getWeekDistribution,
  getYearDistribution,
  type ChartPoint,
  type StudyStatisticsEntry,
} from "@/lib/statistics/study-statistics";
import {
  calculateVocabularyStatistics,
  getVocabularyDayDistribution,
  getVocabularyMonthDistribution,
  getVocabularyWeekDistribution,
  getVocabularyYearDistribution,
  type VocabularyChartPoint,
  type VocabularyDailyTotal,
} from "@/lib/vocabulary/vocabulary-statistics";

type BoardSummary = { id: string; name: string };
type ActivitySummary = {
  id: string;
  name: string;
  systemKey: string | null;
};
type Granularity = "day" | "week" | "month" | "year";

type StatisticsWorkspaceProps = {
  boards: BoardSummary[];
  selectedBoard: BoardSummary;
  activities: ActivitySummary[];
  entries: StudyStatisticsEntry[];
  vocabularyTotals: VocabularyDailyTotal[];
  currentCefrLevel: { level: CefrLevel; effectiveDate: string } | null;
  selectedYear: number;
  todayKey: string;
};

const monthNames = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("en", { month: "long" }).format(
    new Date(2026, month, 1),
  ),
);

function formatDuration(minutes: number, precise = false) {
  if (minutes === 0) return "0m";
  if (minutes < 60) return `${precise ? Math.round(minutes) : minutes}m`;
  const roundedMinutes = precise ? Math.round(minutes) : minutes;
  const hours = Math.floor(roundedMinutes / 60);
  const remainder = roundedMinutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function MetricValue({ value }: { value: string | number }) {
  const tokens = String(value).split(" ");

  return (
    <strong className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xl leading-tight text-slate-950 sm:text-2xl">
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

function MetricCard({
  icon,
  value,
  label,
  accent = "blue",
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accent?: "blue" | "green";
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            accent === "green"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          {icon}
        </span>
        <div>
          <MetricValue value={value} />
          <span className="text-sm text-slate-500">{label}</span>
        </div>
      </div>
    </article>
  );
}

function formatApproxDuration(minutes: number) {
  return `≈ ${formatDuration(Math.round(minutes))}`;
}

function sumTrackedMinutes(entries: StudyStatisticsEntry[]) {
  return entries.reduce((total, entry) => total + entry.durationMinutes, 0);
}

function sumEligibleMinutesSinceLevel({
  entries,
  effectiveDate,
  todayKey,
}: {
  entries: StudyStatisticsEntry[];
  effectiveDate: string;
  todayKey: string;
}) {
  return entries.reduce((total, entry) => {
    if (entry.studyDate < effectiveDate || entry.studyDate > todayKey) {
      return total;
    }
    return total + entry.durationMinutes;
  }, 0);
}

function sumTrackedWords(totals: VocabularyDailyTotal[]) {
  return totals.reduce((total, entry) => total + entry.wordsLearned, 0);
}

function sumEligibleWordsSinceLevel({
  effectiveDate,
  todayKey,
  totals,
}: {
  effectiveDate: string;
  todayKey: string;
  totals: VocabularyDailyTotal[];
}) {
  return totals.reduce((total, entry) => {
    if (entry.studyDate < effectiveDate || entry.studyDate > todayKey) {
      return total;
    }
    return total + entry.wordsLearned;
  }, 0);
}

function CompactForecastCard({
  accent,
  forecast,
  icon,
  title,
}: {
  accent: "blue" | "green";
  forecast: StudyTimeForecast | VocabularyForecast;
  icon: React.ReactNode;
  title: string;
}) {
  if (forecast.status === "no-level") return null;

  const accentClasses =
    accent === "green"
      ? {
          border: "border-emerald-200",
          bg: "bg-emerald-50/70",
          icon: "bg-emerald-50 text-emerald-700",
          text: "text-emerald-700",
          bar: "bg-emerald-600",
          tableBorder: "border-emerald-100",
        }
      : {
          border: "border-blue-200",
          bg: "bg-blue-50/70",
          icon: "bg-blue-50 text-blue-600",
          text: "text-blue-700",
          bar: "bg-blue-600",
          tableBorder: "border-blue-100",
        };

  if (forecast.status === "highest-level") {
    const total =
      "estimatedTotalLearningMinutes" in forecast
        ? formatForecastHours(forecast.estimatedTotalLearningMinutes)
        : formatVocabularyWords(forecast.estimatedVocabularySize);
    const totalLabel =
      "estimatedTotalLearningMinutes" in forecast
        ? "Estimated learning time"
        : "Estimated words known";

    return (
      <section
        className={`min-w-0 rounded-3xl border ${accentClasses.border} ${accentClasses.bg} p-5`}
      >
        <div className="flex min-w-0 items-start gap-4">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${accentClasses.icon}`}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-slate-950">{title}</h3>
            <p className="mt-1 leading-7 text-slate-600">
              {forecast.currentLevel} is the highest level in this model, so
              there is no next-level forecast.
            </p>
            <p className="mt-3 text-sm font-bold tracking-wide text-slate-500 uppercase">
              {totalLabel}
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              &gt; {total}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isStudyTime = "estimatedTotalLearningMinutes" in forecast;
  const completedPercent = Math.round(forecast.progressRatio * 100);
  const baseline = isStudyTime
    ? formatForecastHours(forecast.baselineMinutes)
    : formatVocabularyWords(forecast.baselineWords);
  const added = isStudyTime
    ? formatForecastHours(forecast.eligibleMinutes)
    : formatVocabularyWords(forecast.eligibleWords);
  const estimatedNow = isStudyTime
    ? formatForecastHours(forecast.estimatedTotalLearningMinutes)
    : formatVocabularyWords(forecast.estimatedVocabularySize);
  const nextTotal = isStudyTime
    ? formatForecastHours(forecast.nextLevelBaselineMinutes)
    : formatVocabularyWords(forecast.nextLevelBaselineWords);
  const remaining = isStudyTime
    ? formatForecastHours(forecast.remainingMinutes)
    : formatVocabularyWords(forecast.remainingWords);
  const paceColumns = [forecast.sevenDayPace, forecast.thirtyDayPace];

  return (
    <section
      className={`min-w-0 overflow-hidden rounded-3xl border ${accentClasses.border} bg-white p-4 shadow-sm`}
    >
      <div className="flex min-w-0 items-start gap-4">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${accentClasses.icon}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">
            Approximate progress from {forecast.currentLevel} to{" "}
            {forecast.nextLevel}.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1.15fr_1fr]">
        <div>
          <p className="text-xs font-black tracking-wide text-slate-500 uppercase">
            Current
          </p>
          <p className="mt-2 flex items-center gap-2">
            <span className="flex size-11 items-center justify-center rounded-full bg-slate-950 text-base font-black text-white">
              {forecast.currentLevel}
            </span>
            <span className="text-base text-slate-600">≈ {baseline}</span>
          </p>
        </div>

        <div className="text-left md:text-center">
          <p
            className={`text-xs font-black tracking-wide uppercase ${accentClasses.text}`}
          >
            Progress
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">+{added}</p>
          <p className="mt-1 text-base text-slate-600">≈ {estimatedNow} now</p>
        </div>

        <div className="md:text-right">
          <p className="text-xs font-black tracking-wide text-slate-500 uppercase">
            Next
          </p>
          <p className="mt-2 flex items-center gap-2 md:justify-end">
            <span className="text-base text-slate-600">
              ≈ {nextTotal} total
            </span>
            <span className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-base font-black text-slate-500">
              {forecast.nextLevel}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${accentClasses.bar}`}
            style={{ width: `${completedPercent}%` }}
          />
        </div>
        <p
          className={`mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-base font-black ${accentClasses.text}`}
        >
          <span>{completedPercent}% completed</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-700">≈ {remaining} left</span>
        </p>
      </div>

      <div
        className={`mt-5 rounded-2xl border ${accentClasses.tableBorder} ${accentClasses.bg} p-3`}
      >
        <h4 className={`break-words text-lg font-black ${accentClasses.text}`}>
          Forecast to reach {forecast.nextLevel} with your current pace
        </h4>
        <p className="mt-1 text-sm text-slate-600">
          Based on every calendar day in the last 7 and 30 days.
        </p>
        <div className="mt-3 w-full max-w-full overflow-x-auto rounded-2xl border border-white/70 bg-white/80">
          <div
            className={`grid min-w-[500px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder} text-base font-black ${accentClasses.text}`}
          >
            <div className="px-4 py-3 text-slate-500" />
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3">
                Last {pace.periodDays} days
              </div>
            ))}
          </div>
          <div
            className={`grid min-w-[500px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder}`}
          >
            <div className="px-4 py-3 text-slate-500">Active days</div>
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3 text-slate-700">
                {pace.entryDays} {pace.entryDays === 1 ? "day" : "days"}
              </div>
            ))}
          </div>
          <div
            className={`grid min-w-[500px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder}`}
          >
            <div className="px-4 py-3 text-slate-500">Average pace</div>
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3 text-slate-950">
                {"averageMinutes" in pace
                  ? formatPaceMinutes(pace.averageMinutes)
                  : formatVocabularyPace(pace.averageWords)}
              </div>
            ))}
          </div>
          <div
            className={`grid min-w-[500px] grid-cols-[1.05fr_1fr_1fr] border-b ${accentClasses.tableBorder}`}
          >
            <div className="px-4 py-3 text-slate-500">
              Reach {forecast.nextLevel} in
            </div>
            {paceColumns.map((pace) => (
              <div key={pace.periodDays} className="px-4 py-3 text-slate-950">
                {pace.estimate
                  ? `≈ ${formatCalendarDuration(pace.estimate.duration)}`
                  : "Not available"}
              </div>
            ))}
          </div>
          <div className="grid min-w-[500px] grid-cols-[1.05fr_1fr_1fr]">
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
    </section>
  );
}

const activityChartColors = [
  "#2563eb",
  "#7c3aed",
  "#0d9488",
  "#ea580c",
  "#db2777",
  "#65a30d",
  "#0891b2",
  "#9333ea",
  "#475569",
];

function ActivityDonut({
  title,
  subtitle,
  totals,
  activities,
}: {
  title: string;
  subtitle: string;
  totals: Map<string, number>;
  activities: ActivitySummary[];
}) {
  const activityById = new Map(
    activities.map((activity) => [activity.id, activity]),
  );
  const rows = [...totals.entries()]
    .map(([activityId, minutes]) => ({
      activity: activityById.get(activityId),
      minutes,
    }))
    .sort((left, right) => right.minutes - left.minutes);
  const totalMinutes = rows.reduce((total, row) => total + row.minutes, 0);
  let accumulatedPercentage = 0;
  const chartStops = rows.map((row, index) => {
    const start = accumulatedPercentage;
    accumulatedPercentage += (row.minutes / totalMinutes) * 100;
    return `${activityChartColors[index % activityChartColors.length]} ${start}% ${accumulatedPercentage}%`;
  });
  const chartBackground =
    rows.length === 0 ? "#e2e8f0" : `conic-gradient(${chartStops.join(", ")})`;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      {rows.length > 0 ? (
        <div className="mt-6 grid items-center gap-7 sm:grid-cols-[190px_1fr]">
          <div
            role="img"
            aria-label={`${title}: ${rows
              .map(
                ({ activity, minutes }) =>
                  `${activity?.name ?? "Archived activity"} ${Math.round(
                    (minutes / totalMinutes) * 100,
                  )} percent`,
              )
              .join(", ")}`}
            className="relative mx-auto aspect-square w-44 rounded-full"
            style={{ background: chartBackground }}
          >
            <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
              <strong className="text-xl text-slate-950">
                {formatDuration(totalMinutes)}
              </strong>
              <span className="text-xs text-slate-500">total</span>
            </div>
          </div>
          <div className="space-y-3">
            {rows.map(({ activity, minutes }, index) => {
              const percentage = (minutes / totalMinutes) * 100;
              return (
                <div
                  key={activity?.id ?? `archived-${index}`}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 font-medium text-slate-700">
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          activityChartColors[
                            index % activityChartColors.length
                          ],
                      }}
                    />
                    <ActivityIcon
                      systemKey={activity?.systemKey ?? null}
                      aria-hidden="true"
                      className="size-4 shrink-0"
                    />
                    <span className="truncate">
                      {activity?.name ?? "Archived activity"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <strong className="text-slate-950">
                      {formatDuration(minutes)}
                    </strong>
                    <span className="ml-2 tabular-nums text-slate-500">
                      {percentage.toLocaleString("en", {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <div className="relative mx-auto aspect-square w-36 rounded-full bg-slate-200">
            <div className="absolute inset-[24%] flex items-center justify-center rounded-full bg-white">
              <strong className="text-slate-400">0m</strong>
            </div>
          </div>
          <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
            No study sessions in this period.
          </p>
        </div>
      )}
    </section>
  );
}

function DistributionChart({ points }: { points: ChartPoint[] }) {
  const maximum = Math.max(...points.map((point) => point.minutes), 1);
  return (
    <div className="mt-6 overflow-x-auto pb-2">
      <div
        className="flex min-w-max items-end gap-2"
        role="img"
        aria-label="Study-time distribution chart"
      >
        {points.map((point) => (
          <div
            key={point.key}
            className="flex w-9 flex-col items-center gap-2 sm:w-11"
          >
            <span className="text-[11px] font-medium text-slate-500">
              {point.minutes > 0 ? formatDuration(point.minutes) : ""}
            </span>
            <div className="flex h-40 w-full items-end rounded-lg bg-slate-50 p-1">
              <div
                title={`${point.label}: ${formatDuration(point.minutes)}`}
                className="w-full rounded-md bg-blue-500"
                style={{
                  height:
                    point.minutes === 0
                      ? "0%"
                      : `${Math.max((point.minutes / maximum) * 100, 3)}%`,
                }}
              />
            </div>
            <span className="text-xs text-slate-500">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VocabularyDistributionChart({
  points,
}: {
  points: VocabularyChartPoint[];
}) {
  const maximum = Math.max(...points.map((point) => point.words), 1);
  return (
    <div className="mt-6 overflow-x-auto pb-2">
      <div
        className="flex min-w-max items-end gap-2"
        role="img"
        aria-label="New-words distribution chart"
      >
        {points.map((point) => (
          <div
            key={point.key}
            className="flex w-9 flex-col items-center gap-2 sm:w-11"
          >
            <span className="text-[11px] font-medium text-slate-500">
              {point.words > 0 ? point.words.toLocaleString("en") : ""}
            </span>
            <div className="flex h-40 w-full items-end rounded-lg bg-emerald-50 p-1">
              <div
                title={`${point.label}: ${point.words.toLocaleString("en")} words`}
                className="w-full rounded-md bg-emerald-500"
                style={{
                  height:
                    point.words === 0
                      ? "0%"
                      : `${Math.max((point.words / maximum) * 100, 3)}%`,
                }}
              />
            </div>
            <span className="text-xs text-slate-500">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatisticsWorkspace({
  boards,
  selectedBoard,
  activities,
  entries,
  vocabularyTotals,
  currentCefrLevel,
  selectedYear,
  todayKey,
}: StatisticsWorkspaceProps) {
  const router = useRouter();
  const todayMonth = Number(todayKey.slice(5, 7));
  const vocabularyDate =
    selectedYear === Number(todayKey.slice(0, 4))
      ? todayKey
      : `${selectedYear}-01-01`;
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);
  const [vocabularyGranularity, setVocabularyGranularity] =
    useState<Granularity>("month");
  const [vocabularySelectedMonth, setVocabularySelectedMonth] =
    useState(todayMonth);
  const statistics = useMemo(
    () => calculateStudyStatistics(entries, selectedYear, todayKey),
    [entries, selectedYear, todayKey],
  );
  const activityTotals = useMemo(
    () => getActivityTotals(entries, selectedYear),
    [entries, selectedYear],
  );
  const recentTotals = useMemo(
    () => getRecentActivityTotals(entries, todayKey),
    [entries, todayKey],
  );
  const vocabularyStatistics = useMemo(
    () =>
      calculateVocabularyStatistics(vocabularyTotals, selectedYear, todayKey),
    [selectedYear, todayKey, vocabularyTotals],
  );
  const chartPoints = useMemo(() => {
    if (granularity === "day") {
      return getDayDistribution(entries, selectedYear, selectedMonth);
    }
    if (granularity === "week") {
      return getWeekDistribution(entries, selectedYear);
    }
    if (granularity === "year") return getYearDistribution(entries);
    return getMonthDistribution(entries, selectedYear);
  }, [entries, granularity, selectedMonth, selectedYear]);
  const vocabularyChartPoints = useMemo(() => {
    if (vocabularyGranularity === "day") {
      return getVocabularyDayDistribution(
        vocabularyTotals,
        selectedYear,
        vocabularySelectedMonth,
      );
    }
    if (vocabularyGranularity === "week") {
      return getVocabularyWeekDistribution(vocabularyTotals, selectedYear);
    }
    if (vocabularyGranularity === "year") {
      return getVocabularyYearDistribution(vocabularyTotals);
    }
    return getVocabularyMonthDistribution(vocabularyTotals, selectedYear);
  }, [
    selectedYear,
    vocabularyGranularity,
    vocabularySelectedMonth,
    vocabularyTotals,
  ]);
  const hasCurrentCefrLevel = currentCefrLevel !== null;
  const trackedStudyMinutes = useMemo(
    () => sumTrackedMinutes(entries),
    [entries],
  );
  const trackedVocabularyWords = useMemo(
    () => sumTrackedWords(vocabularyTotals),
    [vocabularyTotals],
  );
  const cefrOverview = useMemo(() => {
    if (!currentCefrLevel) return null;
    const eligibleMinutes = sumEligibleMinutesSinceLevel({
      entries,
      effectiveDate: currentCefrLevel.effectiveDate,
      todayKey,
    });
    const eligibleWords = sumEligibleWordsSinceLevel({
      effectiveDate: currentCefrLevel.effectiveDate,
      todayKey,
      totals: vocabularyTotals,
    });

    return {
      level: currentCefrLevel.level,
      estimatedLearningMinutes:
        getStudyTimeBaselineMinutes(currentCefrLevel.level) + eligibleMinutes,
      estimatedWordsKnown:
        getVocabularyBaselineWords(currentCefrLevel.level) + eligibleWords,
      studyTimeForecast: calculateStudyTimeForecast({
        currentLevel: currentCefrLevel,
        entries: entries.map((entry) => ({
          studyDate: entry.studyDate,
          durationMinutes: entry.durationMinutes,
        })),
        todayKey,
      }),
      vocabularyForecast: calculateVocabularyForecast({
        currentLevel: currentCefrLevel,
        entries: vocabularyTotals.map((entry) => ({
          studyDate: entry.studyDate,
          wordsLearned: entry.wordsLearned,
        })),
        todayKey,
      }),
      weeklyRecommendation: getWeeklyRecommendation(currentCefrLevel.level),
    };
  }, [currentCefrLevel, entries, todayKey, vocabularyTotals]);

  function navigateYear(offset: number) {
    router.replace(
      `/statistics?board=${selectedBoard.id}&year=${selectedYear + offset}&today=${todayKey}`,
      { scroll: false },
    );
  }

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
              {boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/statistics?board=${board.id}&year=${selectedYear}&today=${todayKey}`}
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

          <nav
            aria-label="Primary"
            className="hidden min-h-17 items-stretch md:flex"
          >
            <Link
              href={`/dashboard?board=${selectedBoard.id}&date=${todayKey}&today=${todayKey}`}
              className="flex items-center gap-2 px-5 font-semibold text-slate-600 hover:text-blue-600"
            >
              <Clock3 aria-hidden="true" className="size-5" />
              Study Time
            </Link>
            <Link
              href={`/dashboard?board=${selectedBoard.id}&date=${vocabularyDate}&today=${todayKey}&tracker=vocabulary`}
              className="flex items-center gap-2 px-5 font-semibold text-slate-600 hover:text-emerald-700"
            >
              <BookOpen aria-hidden="true" className="size-5" />
              Vocabulary
            </Link>
            <Link
              href={`/cefr?board=${selectedBoard.id}&today=${todayKey}`}
              className="relative flex items-center gap-2 px-5 font-semibold text-slate-600 hover:text-violet-700"
            >
              {!hasCurrentCefrLevel && <MissingLevelBubble />}
              <GraduationCap aria-hidden="true" className="size-5" />
              Level
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <span className="hidden min-h-11 items-center gap-2 rounded-xl bg-blue-50 px-3 font-semibold text-blue-700 sm:flex">
              <BarChart3 aria-hidden="true" className="size-5" />
              Statistics
            </span>
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
                aria-label="Sign out"
                className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-950 md:hidden"
              >
                <LogOut aria-hidden="true" className="size-5" />
              </button>
              <button
                type="submit"
                className="hidden min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950 md:block"
              >
                Sign out
              </button>
            </ConfirmSignOutForm>
          </div>
        </div>
        <nav
          aria-label="Mobile primary"
          className="grid grid-cols-4 border-t border-slate-100 md:hidden"
        >
          <Link
            href={`/dashboard?board=${selectedBoard.id}&date=${todayKey}&today=${todayKey}`}
            className="flex min-h-14 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          >
            <Clock3 aria-hidden="true" className="size-4.5" />
            Study Time
          </Link>
          <Link
            href={`/dashboard?board=${selectedBoard.id}&date=${vocabularyDate}&today=${todayKey}&tracker=vocabulary`}
            className="flex min-h-14 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
          >
            <BookOpen aria-hidden="true" className="size-4.5" />
            Vocabulary
          </Link>
          <Link
            href={`/cefr?board=${selectedBoard.id}&today=${todayKey}`}
            className="relative flex min-h-14 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-violet-700"
          >
            {!hasCurrentCefrLevel && <MissingLevelBubble />}
            <GraduationCap aria-hidden="true" className="size-4.5" />
            Level
          </Link>
          <span className="flex min-h-14 items-center justify-center gap-1.5 border-b-3 border-blue-600 px-2 text-xs font-semibold text-blue-600">
            <BarChart3 aria-hidden="true" className="size-4.5" />
            Statistics
          </span>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {!hasCurrentCefrLevel && (
          <div className="mb-6">
            <CefrLevelPrompt
              href={`/cefr?board=${selectedBoard.id}&today=${todayKey}`}
              context="statistics"
              accent="violet"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase">
              {selectedBoard.name}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Your learning overview
            </h1>
            {cefrOverview && (
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-bold text-violet-700">
                <GraduationCap aria-hidden="true" className="size-4" />
                Current level · {cefrOverview.level}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateYear(-1)}
              aria-label="Previous year"
              className="flex size-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <strong className="min-w-16 text-center text-xl">
              {selectedYear}
            </strong>
            <button
              type="button"
              onClick={() => navigateYear(1)}
              aria-label="Next year"
              className="flex size-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>

        {cefrOverview && (
          <section className="mt-6 rounded-4xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Recorded and estimated totals
                </h2>
                <p className="mt-1 max-w-3xl leading-7 text-slate-600">
                  Estimated values combine your current level baseline with
                  entries recorded since that level date. Tracker totals remain
                  the exact values you saved.
                </p>
              </div>
              <Link
                href={`/cefr?board=${selectedBoard.id}&today=${todayKey}`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-violet-50 px-4 text-sm font-bold text-violet-700 hover:bg-violet-100"
              >
                <GraduationCap aria-hidden="true" className="size-4" />
                Level {cefrOverview.level}
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={<Clock3 aria-hidden="true" className="size-5" />}
                value={formatDuration(trackedStudyMinutes)}
                label="Tracked study time"
              />
              <MetricCard
                icon={<Gauge aria-hidden="true" className="size-5" />}
                value={formatApproxDuration(
                  cefrOverview.estimatedLearningMinutes,
                )}
                label="Estimated learning time"
              />
              <MetricCard
                accent="green"
                icon={<BookOpen aria-hidden="true" className="size-5" />}
                value={formatVocabularyWords(trackedVocabularyWords)}
                label="Tracked words"
              />
              <MetricCard
                accent="green"
                icon={<GraduationCap aria-hidden="true" className="size-5" />}
                value={`≈ ${formatVocabularyWords(
                  cefrOverview.estimatedWordsKnown,
                )}`}
                label="Estimated words known"
              />
            </div>
          </section>
        )}

        {cefrOverview && (
          <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-black text-slate-950">
                Progress toward the next level
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Approximate Study Time and Vocabulary forecasts for this board.
              </p>
            </div>
            <div className="grid min-w-0 gap-4 xl:grid-cols-2">
              <CompactForecastCard
                accent="blue"
                forecast={cefrOverview.studyTimeForecast}
                icon={<Clock3 aria-hidden="true" className="size-5" />}
                title="Study Time progress"
              />
              <CompactForecastCard
                accent="green"
                forecast={cefrOverview.vocabularyForecast}
                icon={<BookOpen aria-hidden="true" className="size-5" />}
                title="Vocabulary progress"
              />
            </div>
          </section>
        )}

        {cefrOverview?.weeklyRecommendation && (
          <div className="mt-6">
            <WeeklyPlanCard
              recommendation={cefrOverview.weeklyRecommendation}
            />
          </div>
        )}

        <section aria-labelledby="year-summary-heading" className="mt-6">
          <div>
            <h2
              id="year-summary-heading"
              className="text-xl font-bold text-slate-950"
            >
              Selected year
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              These values change when you select another year.
            </p>
          </div>
          <div className="mt-5">
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-blue-700 uppercase">
              <Clock3 aria-hidden="true" className="size-4" />
              Study Time
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                icon={<Clock3 aria-hidden="true" className="size-5" />}
                value={formatDuration(statistics.selectedYearTotal)}
                label={`Total in ${selectedYear}`}
              />
              <MetricCard
                icon={<CalendarDays aria-hidden="true" className="size-5" />}
                value={statistics.selectedYearActiveDays}
                label={`Days studied in ${selectedYear}`}
              />
              <MetricCard
                icon={<Gauge aria-hidden="true" className="size-5" />}
                value={formatDuration(statistics.calendarDayAverage, true)}
                label="Average / calendar day"
              />
              <MetricCard
                icon={<Gauge aria-hidden="true" className="size-5" />}
                value={formatDuration(statistics.activeDayAverage, true)}
                label="Average / active day"
              />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-emerald-700 uppercase">
              <BookOpen aria-hidden="true" className="size-4" />
              New words
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                accent="green"
                icon={<BookOpen aria-hidden="true" className="size-5" />}
                value={`${vocabularyStatistics.totalWords.toLocaleString("en")} words`}
                label={`Total in ${selectedYear}`}
              />
              <MetricCard
                accent="green"
                icon={<CalendarDays aria-hidden="true" className="size-5" />}
                value={vocabularyStatistics.activeDays}
                label={`Active days in ${selectedYear}`}
              />
              <MetricCard
                accent="green"
                icon={<Gauge aria-hidden="true" className="size-5" />}
                value={`${vocabularyStatistics.calendarDayAverage.toLocaleString(
                  "en",
                  { maximumFractionDigits: 1 },
                )} words`}
                label="Average / calendar day"
              />
              <MetricCard
                accent="green"
                icon={<Gauge aria-hidden="true" className="size-5" />}
                value={`${vocabularyStatistics.activeDayAverage.toLocaleString(
                  "en",
                  { maximumFractionDigits: 1 },
                )} words`}
                label="Average / study day"
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="current-progress-heading" className="mt-8">
          <div>
            <h2
              id="current-progress-heading"
              className="text-xl font-bold text-slate-950"
            >
              Current progress
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Live values through today, independent of the selected year.
            </p>
          </div>
          <div className="mt-5">
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-blue-700 uppercase">
              <Clock3 aria-hidden="true" className="size-4" />
              Study Time
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <MetricCard
                icon={<Flame aria-hidden="true" className="size-5" />}
                value={`${statistics.currentStreak} ${
                  statistics.currentStreak === 1 ? "day" : "days"
                }`}
                label="Current streak"
              />
              <MetricCard
                icon={<Trophy aria-hidden="true" className="size-5" />}
                value={`${statistics.longestStreak} ${
                  statistics.longestStreak === 1 ? "day" : "days"
                }`}
                label="Longest streak"
              />
              <MetricCard
                icon={<Clock3 aria-hidden="true" className="size-5" />}
                value={formatDuration(statistics.currentDayTotal)}
                label="Today"
              />
              <MetricCard
                icon={<CalendarDays aria-hidden="true" className="size-5" />}
                value={formatDuration(statistics.currentWeekTotal)}
                label="Current week"
              />
              <MetricCard
                icon={<CalendarDays aria-hidden="true" className="size-5" />}
                value={formatDuration(statistics.currentMonthTotal)}
                label="Current month"
              />
            </div>
          </div>
          <div className="mt-5">
            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wide text-emerald-700 uppercase">
              <BookOpen aria-hidden="true" className="size-4" />
              New words
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <MetricCard
                accent="green"
                icon={<BookOpen aria-hidden="true" className="size-5" />}
                value={`${vocabularyStatistics.allTimeWords.toLocaleString("en")} words`}
                label="All-time total"
              />
              <MetricCard
                accent="green"
                icon={<Flame aria-hidden="true" className="size-5" />}
                value={`${vocabularyStatistics.currentStreak} ${
                  vocabularyStatistics.currentStreak === 1 ? "day" : "days"
                }`}
                label="Current streak"
              />
              <MetricCard
                accent="green"
                icon={<Trophy aria-hidden="true" className="size-5" />}
                value={`${vocabularyStatistics.longestStreak} ${
                  vocabularyStatistics.longestStreak === 1 ? "day" : "days"
                }`}
                label="Longest streak"
              />
              <MetricCard
                accent="green"
                icon={<CalendarDays aria-hidden="true" className="size-5" />}
                value={`${vocabularyStatistics.currentWeekWords.toLocaleString("en")} words`}
                label="Current week"
              />
              <MetricCard
                accent="green"
                icon={<CalendarDays aria-hidden="true" className="size-5" />}
                value={`${vocabularyStatistics.currentMonthWords.toLocaleString("en")} words`}
                label="Current month"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Time distribution
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Compare exact study minutes across calendar periods.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["day", "week", "month", "year"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGranularity(option)}
                  className={`min-h-10 rounded-xl px-3 text-sm font-semibold capitalize ${
                    granularity === option
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {granularity === "day" && (
            <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              Month
              <select
                value={selectedMonth}
                onChange={(event) =>
                  setSelectedMonth(Number(event.target.value))
                }
                className="min-h-10 rounded-xl border border-slate-300 bg-white px-3"
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
          )}
          <DistributionChart points={chartPoints} />
        </section>

        <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                New words distribution
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Compare the number of actively learned words across calendar
                periods.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["day", "week", "month", "year"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setVocabularyGranularity(option)}
                  className={`min-h-10 rounded-xl px-3 text-sm font-semibold capitalize ${
                    vocabularyGranularity === option
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {vocabularyGranularity === "day" && (
            <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              Month
              <select
                value={vocabularySelectedMonth}
                onChange={(event) =>
                  setVocabularySelectedMonth(Number(event.target.value))
                }
                className="min-h-10 rounded-xl border border-emerald-300 bg-white px-3"
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
          )}
          <VocabularyDistributionChart points={vocabularyChartPoints} />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ActivityDonut
            title={`Activity totals in ${selectedYear}`}
            subtitle="Includes active and archived activity history."
            totals={activityTotals}
            activities={activities}
          />
          <ActivityDonut
            title="Activity totals latest 7 days"
            subtitle="Today and the previous six calendar dates."
            totals={recentTotals}
            activities={activities}
          />
        </div>
      </div>
    </main>
  );
}
