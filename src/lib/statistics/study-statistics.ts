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

export type ActivityAverageComparisonRow = {
  id: string;
  kind: "total" | "activity" | "other";
  selectedYearAverageMinutes: number;
  thirtyDayAverageMinutes: number;
  sevenDayAverageMinutes: number;
  thirtyDayVsYearPercent: number | null;
  sevenDayVsThirtyDayPercent: number | null;
};

const TOTAL_ACTIVITY_AVERAGE_ID = "__total__";
const OTHER_ACTIVITY_AVERAGE_ID = "__other__";

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

function selectedYearCutoff(selectedYear: number, todayKey: string) {
  const todayYear = fromDateKey(todayKey).getFullYear();
  if (selectedYear < todayYear) return `${selectedYear}-12-31`;
  if (selectedYear > todayYear) return null;
  return todayKey;
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
  periodDays = 7,
) {
  const startDate = shiftDate(todayKey, -(periodDays - 1));
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

function getBoundedActivityTotals({
  entries,
  startDate,
  endDate,
}: {
  entries: StudyStatisticsEntry[];
  startDate: string;
  endDate: string | null;
}) {
  const totals = new Map<string, number>();
  if (endDate === null) return totals;

  for (const entry of entries) {
    if (entry.studyDate < startDate || entry.studyDate > endDate) continue;
    totals.set(
      entry.activityTypeId,
      (totals.get(entry.activityTypeId) ?? 0) + entry.durationMinutes,
    );
  }

  return totals;
}

function topActivityIds(totals: Map<string, number>) {
  return [...totals.entries()]
    .filter(([, minutes]) => minutes > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([activityTypeId]) => activityTypeId);
}

function calculatePercentChange(
  previousAverageMinutes: number,
  currentAverageMinutes: number,
) {
  if (previousAverageMinutes === 0) {
    return currentAverageMinutes > 0 ? 100 : null;
  }

  return (
    ((currentAverageMinutes - previousAverageMinutes) /
      previousAverageMinutes) *
    100
  );
}

function averageMinutes(totalMinutes: number, periodDays: number) {
  return periodDays === 0 ? 0 : totalMinutes / periodDays;
}

export function getActivityAverageComparisonRows(
  entries: StudyStatisticsEntry[],
  selectedYear: number,
  todayKey: string,
): ActivityAverageComparisonRow[] {
  const selectedYearStart = `${selectedYear}-01-01`;
  const selectedYearEnd = selectedYearCutoff(selectedYear, todayKey);
  const selectedYearDays = elapsedDaysInYear(selectedYear, todayKey);
  const selectedYearTotals = getBoundedActivityTotals({
    entries,
    startDate: selectedYearStart,
    endDate: selectedYearEnd,
  });
  const thirtyDayTotals = getRecentActivityTotals(entries, todayKey, 30);
  const sevenDayTotals = getRecentActivityTotals(entries, todayKey, 7);
  const selectedActivityIds = new Set<string>();

  for (const activityId of [
    ...topActivityIds(selectedYearTotals),
    ...topActivityIds(thirtyDayTotals),
    ...topActivityIds(sevenDayTotals),
  ]) {
    selectedActivityIds.add(activityId);
  }

  const createRow = (
    id: string,
    kind: ActivityAverageComparisonRow["kind"],
    selectedYearMinutes: number,
    thirtyDayMinutes: number,
    sevenDayMinutes: number,
  ): ActivityAverageComparisonRow => {
    const selectedYearAverageMinutes = averageMinutes(
      selectedYearMinutes,
      selectedYearDays,
    );
    const thirtyDayAverageMinutes = averageMinutes(thirtyDayMinutes, 30);
    const sevenDayAverageMinutes = averageMinutes(sevenDayMinutes, 7);

    return {
      id,
      kind,
      selectedYearAverageMinutes,
      thirtyDayAverageMinutes,
      sevenDayAverageMinutes,
      thirtyDayVsYearPercent: calculatePercentChange(
        selectedYearAverageMinutes,
        thirtyDayAverageMinutes,
      ),
      sevenDayVsThirtyDayPercent: calculatePercentChange(
        thirtyDayAverageMinutes,
        sevenDayAverageMinutes,
      ),
    };
  };

  const selectedYearTotal = sumMinutes(
    selectedYearEnd === null
      ? []
      : entries.filter(
          (entry) =>
            entry.studyDate >= selectedYearStart &&
            entry.studyDate <= selectedYearEnd,
        ),
  );
  const thirtyDayTotal = [...thirtyDayTotals.values()].reduce(
    (total, minutes) => total + minutes,
    0,
  );
  const sevenDayTotal = [...sevenDayTotals.values()].reduce(
    (total, minutes) => total + minutes,
    0,
  );

  const rows = [
    createRow(
      TOTAL_ACTIVITY_AVERAGE_ID,
      "total",
      selectedYearTotal,
      thirtyDayTotal,
      sevenDayTotal,
    ),
  ];

  for (const activityId of selectedActivityIds) {
    rows.push(
      createRow(
        activityId,
        "activity",
        selectedYearTotals.get(activityId) ?? 0,
        thirtyDayTotals.get(activityId) ?? 0,
        sevenDayTotals.get(activityId) ?? 0,
      ),
    );
  }

  const otherSelectedYearMinutes = [...selectedYearTotals.entries()].reduce(
    (total, [activityId, minutes]) =>
      selectedActivityIds.has(activityId) ? total : total + minutes,
    0,
  );
  const otherThirtyDayMinutes = [...thirtyDayTotals.entries()].reduce(
    (total, [activityId, minutes]) =>
      selectedActivityIds.has(activityId) ? total : total + minutes,
    0,
  );
  const otherSevenDayMinutes = [...sevenDayTotals.entries()].reduce(
    (total, [activityId, minutes]) =>
      selectedActivityIds.has(activityId) ? total : total + minutes,
    0,
  );

  if (
    otherSelectedYearMinutes > 0 ||
    otherThirtyDayMinutes > 0 ||
    otherSevenDayMinutes > 0
  ) {
    rows.push(
      createRow(
        OTHER_ACTIVITY_AVERAGE_ID,
        "other",
        otherSelectedYearMinutes,
        otherThirtyDayMinutes,
        otherSevenDayMinutes,
      ),
    );
  }

  return rows;
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
