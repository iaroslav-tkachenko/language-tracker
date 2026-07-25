import { fromDateKey, shiftDate, toDateKey } from "@/lib/dates/study-calendar";

export type StudyStatisticsEntry = {
  studyDate: string;
  durationMinutes: number;
  activityTypeId: string;
};

export type ChartPoint = {
  key: string;
  label: string;
  minutes: number;
};

export type StudyStatistics = {
  selectedYearTotal: number;
  selectedYearActiveDays: number;
  calendarDayAverage: number;
  activeDayAverage: number;
  currentDayTotal: number;
  currentWeekTotal: number;
  currentMonthTotal: number;
  currentStreak: number;
  longestStreak: number;
};

function sumMinutes(entries: StudyStatisticsEntry[]) {
  return entries.reduce((total, entry) => total + entry.durationMinutes, 0);
}

function startOfWeek(dateKey: string) {
  const date = fromDateKey(dateKey);
  const mondayOffset = (date.getDay() + 6) % 7;
  return shiftDate(dateKey, -mondayOffset);
}

function daysInYear(year: number) {
  return Math.round(
    (new Date(year + 1, 0, 1).getTime() - new Date(year, 0, 1).getTime()) /
      86_400_000,
  );
}

function elapsedDaysInYear(year: number, todayKey: string) {
  const today = fromDateKey(todayKey);
  const todayYear = today.getFullYear();
  if (year < todayYear) return daysInYear(year);
  if (year > todayYear) return 0;
  return (
    Math.round(
      (today.getTime() - new Date(year, 0, 1).getTime()) / 86_400_000,
    ) + 1
  );
}

function calculateStreaks(activeDateKeys: Set<string>, todayKey: string) {
  let latestEligibleDate = todayKey;
  if (!activeDateKeys.has(todayKey)) {
    latestEligibleDate = shiftDate(todayKey, -1);
  }

  let currentStreak = 0;
  let cursor = latestEligibleDate;
  while (activeDateKeys.has(cursor)) {
    currentStreak += 1;
    cursor = shiftDate(cursor, -1);
  }

  const sortedDates = [...activeDateKeys].sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: string | null = null;
  for (const dateKey of sortedDates) {
    runningStreak =
      previousDate !== null && shiftDate(previousDate, 1) === dateKey
        ? runningStreak + 1
        : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
    previousDate = dateKey;
  }

  return { currentStreak, longestStreak };
}

export function calculateStudyStatistics(
  entries: StudyStatisticsEntry[],
  selectedYear: number,
  todayKey: string,
): StudyStatistics {
  const selectedYearPrefix = `${selectedYear}-`;
  const selectedYearEntries = entries.filter((entry) =>
    entry.studyDate.startsWith(selectedYearPrefix),
  );
  const eligibleSelectedYearEntries = selectedYearEntries.filter(
    (entry) => entry.studyDate <= todayKey,
  );
  const eligibleEntries = entries.filter(
    (entry) => entry.studyDate <= todayKey,
  );
  const activeDateKeys = new Set(
    eligibleEntries.map((entry) => entry.studyDate),
  );
  const selectedYearActiveDays = new Set(
    eligibleSelectedYearEntries.map((entry) => entry.studyDate),
  ).size;
  const eligibleSelectedYearTotal = sumMinutes(eligibleSelectedYearEntries);
  const elapsedDays = elapsedDaysInYear(selectedYear, todayKey);
  const weekStart = startOfWeek(todayKey);
  const monthPrefix = todayKey.slice(0, 7);
  const { currentStreak, longestStreak } = calculateStreaks(
    activeDateKeys,
    todayKey,
  );

  return {
    selectedYearTotal: sumMinutes(selectedYearEntries),
    selectedYearActiveDays,
    calendarDayAverage:
      elapsedDays === 0 ? 0 : eligibleSelectedYearTotal / elapsedDays,
    activeDayAverage:
      selectedYearActiveDays === 0
        ? 0
        : eligibleSelectedYearTotal / selectedYearActiveDays,
    currentDayTotal: sumMinutes(
      eligibleEntries.filter((entry) => entry.studyDate === todayKey),
    ),
    currentWeekTotal: sumMinutes(
      eligibleEntries.filter((entry) => entry.studyDate >= weekStart),
    ),
    currentMonthTotal: sumMinutes(
      eligibleEntries.filter((entry) =>
        entry.studyDate.startsWith(monthPrefix),
      ),
    ),
    currentStreak,
    longestStreak,
  };
}

export function getActivityTotals(
  entries: StudyStatisticsEntry[],
  selectedYear: number,
) {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.studyDate.startsWith(`${selectedYear}-`)) continue;
    totals.set(
      entry.activityTypeId,
      (totals.get(entry.activityTypeId) ?? 0) + entry.durationMinutes,
    );
  }
  return totals;
}

export function getRecentActivityTotals(
  entries: StudyStatisticsEntry[],
  todayKey: string,
) {
  const startDate = shiftDate(todayKey, -6);
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (entry.studyDate < startDate || entry.studyDate > todayKey) continue;
    totals.set(
      entry.activityTypeId,
      (totals.get(entry.activityTypeId) ?? 0) + entry.durationMinutes,
    );
  }
  return totals;
}

export function getDayDistribution(
  entries: StudyStatisticsEntry[],
  year: number,
  month: number,
): ChartPoint[] {
  const lastDay = new Date(year, month, 0).getDate();
  const totals = new Map<string, number>();
  for (const entry of entries) {
    totals.set(
      entry.studyDate,
      (totals.get(entry.studyDate) ?? 0) + entry.durationMinutes,
    );
  }
  return Array.from({ length: lastDay }, (_, index) => {
    const dateKey = toDateKey(new Date(year, month - 1, index + 1));
    return {
      key: dateKey,
      label: String(index + 1),
      minutes: totals.get(dateKey) ?? 0,
    };
  });
}

export function getMonthDistribution(
  entries: StudyStatisticsEntry[],
  year: number,
): ChartPoint[] {
  const formatter = new Intl.DateTimeFormat("en", { month: "short" });
  return Array.from({ length: 12 }, (_, index) => {
    const prefix = `${year}-${String(index + 1).padStart(2, "0")}`;
    return {
      key: prefix,
      label: formatter.format(new Date(year, index, 1)),
      minutes: sumMinutes(
        entries.filter((entry) => entry.studyDate.startsWith(prefix)),
      ),
    };
  });
}

export function getWeekDistribution(
  entries: StudyStatisticsEntry[],
  year: number,
): ChartPoint[] {
  const firstDate = `${year}-01-01`;
  let cursor = startOfWeek(firstDate);
  const finalDate = `${year}-12-31`;
  const points: ChartPoint[] = [];
  let weekNumber = 1;

  while (cursor <= finalDate) {
    const weekEnd = shiftDate(cursor, 6);
    points.push({
      key: cursor,
      label: `W${weekNumber}`,
      minutes: sumMinutes(
        entries.filter(
          (entry) =>
            entry.studyDate >= cursor &&
            entry.studyDate <= weekEnd &&
            entry.studyDate.startsWith(`${year}-`),
        ),
      ),
    });
    cursor = shiftDate(cursor, 7);
    weekNumber += 1;
  }

  return points;
}

export function getYearDistribution(
  entries: StudyStatisticsEntry[],
): ChartPoint[] {
  const years = [
    ...new Set(entries.map((entry) => entry.studyDate.slice(0, 4))),
  ]
    .map(Number)
    .sort((left, right) => left - right);

  return years.map((year) => ({
    key: String(year),
    label: String(year),
    minutes: sumMinutes(
      entries.filter((entry) => entry.studyDate.startsWith(`${year}-`)),
    ),
  }));
}
