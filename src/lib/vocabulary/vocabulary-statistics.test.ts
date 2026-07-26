import { describe, expect, it } from "vitest";

import { getCalendarCells } from "@/lib/dates/study-calendar";
import {
  calculateVocabularyStatistics,
  getVocabularyDayDistribution,
  getVocabularyMonthDistribution,
  getVocabularyWeekDistribution,
  getVocabularyYearDistribution,
  isFutureVocabularyDate,
  isVocabularyMissedDate,
  isVocabularyDateInYear,
  vocabularyHeatLevel,
} from "@/lib/vocabulary/vocabulary-statistics";

describe("vocabulary heatmap", () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [5, 2],
    [6, 3],
    [9, 3],
    [10, 4],
    [14, 4],
    [15, 5],
    [19, 5],
    [20, 6],
    [39, 6],
    [40, 7],
    [100, 7],
  ])("maps %i words to level %i", (words, level) => {
    expect(vocabularyHeatLevel(words)).toBe(level);
  });

  it("recognizes selected years and future dates by calendar key", () => {
    expect(isVocabularyDateInYear("2026-12-31", 2026)).toBe(true);
    expect(isVocabularyDateInYear("2027-01-01", 2026)).toBe(false);
    expect(isFutureVocabularyDate("2026-07-27", "2026-07-26")).toBe(true);
    expect(isFutureVocabularyDate("2026-07-26", "2026-07-26")).toBe(false);
  });

  it("marks zero-word dates from the first positive date through today", () => {
    expect(
      isVocabularyMissedDate(
        "2026-07-19",
        0,
        false,
        "2026-07-20",
        "2026-07-26",
      ),
    ).toBe(false);
    expect(
      isVocabularyMissedDate(
        "2026-07-20",
        0,
        false,
        "2026-07-20",
        "2026-07-26",
      ),
    ).toBe(true);
    expect(
      isVocabularyMissedDate(
        "2026-07-26",
        0,
        false,
        "2026-07-20",
        "2026-07-26",
      ),
    ).toBe(true);
    expect(
      isVocabularyMissedDate(
        "2026-07-27",
        0,
        false,
        "2026-07-20",
        "2026-07-26",
      ),
    ).toBe(false);
    expect(
      isVocabularyMissedDate("2026-07-21", 3, true, "2026-07-20", "2026-07-26"),
    ).toBe(false);
    expect(
      isVocabularyMissedDate("2026-07-21", 0, false, null, "2026-07-26"),
    ).toBe(false);
  });

  it("marks an explicitly saved zero red without a positive-date boundary", () => {
    expect(
      isVocabularyMissedDate("2026-01-01", 0, true, null, "2026-07-26"),
    ).toBe(true);
    expect(
      isVocabularyMissedDate("2026-07-27", 0, true, "2026-07-20", "2026-07-26"),
    ).toBe(true);
  });

  it("preserves common-year and leap-year calendar boundaries", () => {
    expect(getCalendarCells(2026).filter((cell) => cell.inYear)).toHaveLength(
      365,
    );
    const leapDates = getCalendarCells(2028).filter((cell) => cell.inYear);
    expect(leapDates).toHaveLength(366);
    expect(leapDates.some((cell) => cell.dateKey === "2028-02-29")).toBe(true);
  });
});

describe("vocabulary statistics", () => {
  const totals = [
    { studyDate: "2025-12-31", wordsLearned: 30 },
    { studyDate: "2026-01-01", wordsLearned: 2 },
    { studyDate: "2026-07-23", wordsLearned: 3 },
    { studyDate: "2026-07-24", wordsLearned: 5 },
    { studyDate: "2026-07-25", wordsLearned: 8 },
    { studyDate: "2026-07-27", wordsLearned: 40 },
  ];

  it("includes future totals but excludes future active days", () => {
    expect(
      calculateVocabularyStatistics(totals, 2026, "2026-07-26"),
    ).toMatchObject({
      totalWords: 58,
      activeDays: 4,
      activeDayAverage: 4.5,
    });
    expect(
      calculateVocabularyStatistics(totals, 2026, "2026-07-26")
        .calendarDayAverage,
    ).toBeCloseTo(18 / 207);
  });

  it("keeps a current streak alive when the latest day was yesterday", () => {
    const statistics = calculateVocabularyStatistics(
      totals,
      2026,
      "2026-07-26",
    );
    expect(statistics.currentStreak).toBe(3);
    expect(statistics.longestStreak).toBe(3);
  });

  it("calculates current week and month totals through today", () => {
    const statistics = calculateVocabularyStatistics(
      [
        { studyDate: "2026-06-30", wordsLearned: 100 },
        { studyDate: "2026-07-19", wordsLearned: 50 },
        { studyDate: "2026-07-20", wordsLearned: 2 },
        { studyDate: "2026-07-25", wordsLearned: 3 },
        { studyDate: "2026-07-26", wordsLearned: 5 },
        { studyDate: "2026-07-27", wordsLearned: 200 },
      ],
      2026,
      "2026-07-26",
    );

    expect(statistics.currentWeekWords).toBe(10);
    expect(statistics.currentMonthWords).toBe(60);
  });

  it("returns zero current streak after a gap and preserves the longest", () => {
    const statistics = calculateVocabularyStatistics(
      totals,
      2026,
      "2026-07-29",
    );
    expect(statistics.currentStreak).toBe(0);
    expect(statistics.longestStreak).toBe(3);
  });

  it("calculates streaks across month and leap-day boundaries", () => {
    const statistics = calculateVocabularyStatistics(
      [
        { studyDate: "2028-02-28", wordsLearned: 1 },
        { studyDate: "2028-02-29", wordsLearned: 1 },
        { studyDate: "2028-03-01", wordsLearned: 1 },
      ],
      2028,
      "2028-03-01",
    );
    expect(statistics.currentStreak).toBe(3);
    expect(statistics.longestStreak).toBe(3);
  });

  it("scopes selected-year totals without scoping live streaks", () => {
    const statistics = calculateVocabularyStatistics(
      [
        { studyDate: "2026-12-31", wordsLearned: 4 },
        { studyDate: "2027-01-01", wordsLearned: 6 },
      ],
      2026,
      "2027-01-01",
    );
    expect(statistics.totalWords).toBe(4);
    expect(statistics.allTimeWords).toBe(10);
    expect(statistics.activeDays).toBe(1);
    expect(statistics.currentStreak).toBe(2);
    expect(statistics.longestStreak).toBe(2);
  });

  it("uses the full calendar denominator for a completed leap year", () => {
    const statistics = calculateVocabularyStatistics(
      [
        { studyDate: "2028-02-29", wordsLearned: 366 },
        { studyDate: "2030-01-01", wordsLearned: 10 },
      ],
      2028,
      "2030-07-26",
    );
    expect(statistics.calendarDayAverage).toBe(1);
    expect(statistics.activeDayAverage).toBe(366);
  });

  it("returns zero averages for a future selected year", () => {
    const statistics = calculateVocabularyStatistics(
      [{ studyDate: "2030-01-01", wordsLearned: 10 }],
      2030,
      "2026-07-26",
    );
    expect(statistics.totalWords).toBe(10);
    expect(statistics.activeDays).toBe(0);
    expect(statistics.calendarDayAverage).toBe(0);
    expect(statistics.activeDayAverage).toBe(0);
  });
});

describe("vocabulary distributions", () => {
  const totals = [
    { studyDate: "2025-12-31", wordsLearned: 5 },
    { studyDate: "2026-01-01", wordsLearned: 2 },
    { studyDate: "2026-01-05", wordsLearned: 3 },
    { studyDate: "2026-02-01", wordsLearned: 7 },
  ];

  it("groups words by day and month", () => {
    expect(getVocabularyDayDistribution(totals, 2026, 1)[0]?.words).toBe(2);
    expect(getVocabularyMonthDistribution(totals, 2026)[0]?.words).toBe(5);
    expect(getVocabularyMonthDistribution(totals, 2026)[1]?.words).toBe(7);
  });

  it("groups Monday-to-Sunday weeks without leaking adjacent years", () => {
    const weeks = getVocabularyWeekDistribution(totals, 2026);
    expect(weeks[0]?.words).toBe(2);
    expect(weeks[1]?.words).toBe(3);
  });

  it("groups complete years", () => {
    expect(getVocabularyYearDistribution(totals)).toEqual([
      { key: "2025", label: "2025", words: 5 },
      { key: "2026", label: "2026", words: 12 },
    ]);
  });
});
