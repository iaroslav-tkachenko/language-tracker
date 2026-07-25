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

function MetricCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </span>
        <div>
          <strong className="block text-xl text-slate-950 sm:text-2xl">
            {value}
          </strong>
          <span className="text-sm text-slate-500">{label}</span>
        </div>
      </div>
    </article>
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

export function StatisticsWorkspace({
  boards,
  selectedBoard,
  activities,
  entries,
  selectedYear,
  todayKey,
}: StatisticsWorkspaceProps) {
  const router = useRouter();
  const todayMonth = Number(todayKey.slice(5, 7));
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);
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
            <span
              aria-disabled="true"
              className="flex items-center gap-2 px-5 text-slate-400"
            >
              <BookOpen aria-hidden="true" className="size-5" />
              Vocabulary
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
                Coming soon
              </span>
            </span>
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
          className="grid grid-cols-3 border-t border-slate-100 md:hidden"
        >
          <Link
            href={`/dashboard?board=${selectedBoard.id}&date=${todayKey}&today=${todayKey}`}
            className="flex min-h-14 items-center justify-center gap-1.5 px-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-700"
          >
            <Clock3 aria-hidden="true" className="size-4.5" />
            Study Time
          </Link>
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
          <span className="flex min-h-14 items-center justify-center gap-1.5 border-b-3 border-blue-600 px-2 text-xs font-semibold text-blue-600">
            <BarChart3 aria-hidden="true" className="size-4.5" />
            Statistics
          </span>
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase">
              {selectedBoard.name}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Study Time statistics
            </h1>
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
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
