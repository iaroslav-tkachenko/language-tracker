import { fromDateKey, shiftDate } from "@/lib/dates/study-calendar";
import {
  calculatePeriodRecords,
  type PeriodRecords,
} from "@/lib/statistics/period-records";

export type VocabularyDailyTotal = {
  studyDate: string;
  wordsLearned: number;
};

export type VocabularyStatistics = {
  allTimeWords: number;
  totalWords: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  calendarDayAverage: number;
  activeDayAverage: number;
  currentDayWords: number;
  currentWeekWords: number;
  currentMonthWords: number;
};

export function calculateVocabularyRecords(
  totals: VocabularyDailyTotal[],
  todayKey: string,
): PeriodRecords {
  return calculatePeriodRecords(
    totals.map((total) => ({
      date: total.studyDate,
      value: total.wordsLearned,
    })),
    todayKey,
  );
}

function daysInYear(year: number) {
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
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

export function vocabularyHeatLevel(wordsLearned: number) {
  if (wordsLearned <= 0) return 0;
  if (wordsLearned <= 2) return 1;
  if (wordsLearned <= 5) return 2;
  if (wordsLearned <= 9) return 3;
  if (wordsLearned <= 14) return 4;
  if (wordsLearned <= 19) return 5;
  if (wordsLearned <= 39) return 6;
  return 7;
}

export function isVocabularyDateInYear(dateKey: string, year: number) {
  return dateKey.startsWith(`${year}-`);
}

export function isFutureVocabularyDate(dateKey: string, todayKey: string) {
  return dateKey > todayKey;
}

export function isVocabularyMissedDate(
  dateKey: string,
  wordsLearned: number,
  hasExplicitTotal: boolean,
  earliestPositiveDate: string | null,
  todayKey: string,
) {
  return (
    wordsLearned <= 0 &&
    (hasExplicitTotal ||
      (earliestPositiveDate !== null &&
        dateKey >= earliestPositiveDate &&
        dateKey <= todayKey))
  );
}

export function calculateVocabularyStatistics(
  totals: VocabularyDailyTotal[],
  selectedYear: number,
  todayKey: string,
): VocabularyStatistics {
  const selectedYearTotals = totals.filter((total) =>
    isVocabularyDateInYear(total.studyDate, selectedYear),
  );
  const eligibleSelectedYearTotals = selectedYearTotals.filter(
    (total) => !isFutureVocabularyDate(total.studyDate, todayKey),
  );
  const eligibleSelectedYearWords = eligibleSelectedYearTotals.reduce(
    (sum, total) => sum + total.wordsLearned,
    0,
  );
  const eligibleTotals = totals.filter(
    (total) => !isFutureVocabularyDate(total.studyDate, todayKey),
  );
  const currentWeekStart = startOfWeek(todayKey);
  const currentMonthPrefix = todayKey.slice(0, 7);
  const eligibleDates = [
    ...new Set(
      totals
        .filter(
          (total) =>
            total.wordsLearned > 0 &&
            !isFutureVocabularyDate(total.studyDate, todayKey),
        )
        .map((total) => total.studyDate),
    ),
  ].sort();
  const eligibleDateSet = new Set(eligibleDates);

  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate: string | null = null;
  for (const dateKey of eligibleDates) {
    runningStreak =
      previousDate !== null && shiftDate(previousDate, 1) === dateKey
        ? runningStreak + 1
        : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
    previousDate = dateKey;
  }

  const latestEligibleDate = eligibleDateSet.has(todayKey)
    ? todayKey
    : shiftDate(todayKey, -1);
  let currentStreak = 0;
  let streakDate = latestEligibleDate;
  while (eligibleDateSet.has(streakDate)) {
    currentStreak += 1;
    streakDate = shiftDate(streakDate, -1);
  }

  const activeDays = new Set(
    eligibleSelectedYearTotals
      .filter((total) => total.wordsLearned > 0)
      .map((total) => total.studyDate),
  ).size;
  const elapsedDays = elapsedDaysInYear(selectedYear, todayKey);

  return {
    allTimeWords: totals.reduce((sum, total) => sum + total.wordsLearned, 0),
    totalWords: selectedYearTotals.reduce(
      (sum, total) => sum + total.wordsLearned,
      0,
    ),
    activeDays,
    currentStreak,
    longestStreak,
    calendarDayAverage:
      elapsedDays === 0 ? 0 : eligibleSelectedYearWords / elapsedDays,
    activeDayAverage:
      activeDays === 0 ? 0 : eligibleSelectedYearWords / activeDays,
    currentDayWords: sumWords(
      eligibleTotals.filter((total) => total.studyDate === todayKey),
    ),
    currentWeekWords: sumWords(
      eligibleTotals.filter((total) => total.studyDate >= currentWeekStart),
    ),
    currentMonthWords: sumWords(
      eligibleTotals.filter((total) =>
        total.studyDate.startsWith(currentMonthPrefix),
      ),
    ),
  };
}

export type VocabularyChartPoint = {
  key: string;
  label: string;
  words: number;
};

function sumWords(totals: VocabularyDailyTotal[]) {
  return totals.reduce((sum, total) => sum + total.wordsLearned, 0);
}

function startOfWeek(dateKey: string) {
  const date = fromDateKey(dateKey);
  const mondayOffset = (date.getDay() + 6) % 7;
  return shiftDate(dateKey, -mondayOffset);
}

export function getVocabularyDayDistribution(
  totals: VocabularyDailyTotal[],
  year: number,
  month: number,
): VocabularyChartPoint[] {
  const lastDay = new Date(year, month, 0).getDate();
  const totalsByDate = new Map(
    totals.map((total) => [total.studyDate, total.wordsLearned]),
  );

  return Array.from({ length: lastDay }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${day}`;
    return {
      key: dateKey,
      label: String(index + 1),
      words: totalsByDate.get(dateKey) ?? 0,
    };
  });
}

export function getVocabularyMonthDistribution(
  totals: VocabularyDailyTotal[],
  year: number,
): VocabularyChartPoint[] {
  const formatter = new Intl.DateTimeFormat("en", { month: "short" });

  return Array.from({ length: 12 }, (_, index) => {
    const prefix = `${year}-${String(index + 1).padStart(2, "0")}`;
    return {
      key: prefix,
      label: formatter.format(new Date(year, index, 1)),
      words: sumWords(
        totals.filter((total) => total.studyDate.startsWith(prefix)),
      ),
    };
  });
}

export function getVocabularyWeekDistribution(
  totals: VocabularyDailyTotal[],
  year: number,
): VocabularyChartPoint[] {
  let cursor = startOfWeek(`${year}-01-01`);
  const finalDate = `${year}-12-31`;
  const points: VocabularyChartPoint[] = [];
  let weekNumber = 1;

  while (cursor <= finalDate) {
    const weekEnd = shiftDate(cursor, 6);
    points.push({
      key: cursor,
      label: `W${weekNumber}`,
      words: sumWords(
        totals.filter(
          (total) =>
            total.studyDate >= cursor &&
            total.studyDate <= weekEnd &&
            total.studyDate.startsWith(`${year}-`),
        ),
      ),
    });
    cursor = shiftDate(cursor, 7);
    weekNumber += 1;
  }

  return points;
}

export function getVocabularyYearDistribution(
  totals: VocabularyDailyTotal[],
): VocabularyChartPoint[] {
  const years = [...new Set(totals.map((total) => total.studyDate.slice(0, 4)))]
    .map(Number)
    .sort((left, right) => left - right);

  return years.map((year) => ({
    key: String(year),
    label: String(year),
    words: sumWords(
      totals.filter((total) => total.studyDate.startsWith(`${year}-`)),
    ),
  }));
}
