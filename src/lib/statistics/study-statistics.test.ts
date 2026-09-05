import { describe, expect, it } from "vitest";

import {
  calculateStudyRecords,
  calculateStudyStatistics,
  getActivityAverageComparisonRows,
  getDayDistribution,
  getMonthDistribution,
  getRecentActivityTotals,
  getWeekDistribution,
  getYearDistribution,
  type StudyStatisticsEntry,
} from "@/lib/statistics/study-statistics";

const entry = (
  studyDate: string,
  durationMinutes: number,
  activityTypeId = "reading",
): StudyStatisticsEntry => ({
  studyDate,
  durationMinutes,
  activityTypeId,
});

describe("study statistics", () => {
  it("finds all-time records through today", () => {
    const records = calculateStudyRecords(
      [
        entry("2025-12-31", 75),
        entry("2026-07-20", 30),
        entry("2026-07-20", 45),
        entry("2026-07-25", 75),
        entry("2026-07-27", 500),
      ],
      "2026-07-25",
    );

    expect(records.day?.startDate).toBe("2026-07-25");
    expect(records.day?.total).toBe(75);
    expect(records.week).toMatchObject({
      total: 150,
      startDate: "2026-07-20",
      endDate: "2026-07-26",
    });
    expect(records.month?.total).toBe(150);
  });

  it("includes future entries in the year total but excludes them from averages and active days", () => {
    const result = calculateStudyStatistics(
      [
        entry("2026-01-01", 60),
        entry("2026-07-25", 30),
        entry("2026-12-01", 120),
      ],
      2026,
      "2026-07-25",
    );

    expect(result.selectedYearTotal).toBe(210);
    expect(result.selectedYearActiveDays).toBe(2);
    expect(result.activeDayAverage).toBe(45);
    expect(result.calendarDayAverage).toBeCloseTo(90 / 206);
  });

  it("uses all calendar days for a completed-year average", () => {
    const result = calculateStudyStatistics(
      [entry("2024-02-29", 366)],
      2024,
      "2026-07-25",
    );

    expect(result.calendarDayAverage).toBe(1);
  });

  it("starts the current week on Monday and excludes future dates", () => {
    const result = calculateStudyStatistics(
      [
        entry("2026-07-19", 10),
        entry("2026-07-20", 20),
        entry("2026-07-25", 30),
        entry("2026-07-26", 40),
      ],
      2026,
      "2026-07-25",
    );

    expect(result.currentWeekTotal).toBe(50);
    expect(result.currentDayTotal).toBe(30);
    expect(result.currentMonthTotal).toBe(60);
  });

  it("keeps a current streak alive through an empty today and finds the longest streak", () => {
    const result = calculateStudyStatistics(
      [
        entry("2026-07-01", 10),
        entry("2026-07-02", 10),
        entry("2026-07-03", 10),
        entry("2026-07-22", 10),
        entry("2026-07-23", 10),
        entry("2026-07-24", 10),
      ],
      2026,
      "2026-07-25",
    );

    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it("returns zero current streak when neither today nor yesterday is active", () => {
    const result = calculateStudyStatistics(
      [entry("2026-07-23", 30)],
      2026,
      "2026-07-25",
    );

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
  });

  it("scopes selected-year totals without scoping live streaks", () => {
    const result = calculateStudyStatistics(
      [
        entry("2025-12-30", 10),
        entry("2025-12-31", 10),
        entry("2026-01-01", 10),
        entry("2026-01-02", 10),
      ],
      2026,
      "2026-01-02",
    );

    expect(result.selectedYearTotal).toBe(20);
    expect(result.selectedYearActiveDays).toBe(2);
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(4);
  });
});

describe("study distributions", () => {
  const entries = [
    entry("2025-12-31", 15),
    entry("2026-01-01", 10),
    entry("2026-01-01", 20),
    entry("2026-01-05", 30),
    entry("2026-02-01", 40, "podcast"),
  ];

  it("groups day and month totals", () => {
    expect(getDayDistribution(entries, 2026, 1)[0]?.minutes).toBe(30);
    expect(getMonthDistribution(entries, 2026)[0]?.minutes).toBe(60);
    expect(getMonthDistribution(entries, 2026)[1]?.minutes).toBe(40);
  });

  it("groups Monday-to-Sunday weeks without leaking adjacent years", () => {
    const weeks = getWeekDistribution(entries, 2026);
    expect(weeks[0]?.minutes).toBe(30);
    expect(weeks[1]?.minutes).toBe(30);
  });

  it("groups complete years", () => {
    expect(getYearDistribution(entries)).toEqual([
      { key: "2025", label: "2025", minutes: 15 },
      { key: "2026", label: "2026", minutes: 100 },
    ]);
  });

  it("groups the seven calendar dates ending today by activity", () => {
    const totals = getRecentActivityTotals(
      [
        entry("2026-07-18", 100),
        entry("2026-07-19", 20),
        entry("2026-07-25", 30),
        entry("2026-07-26", 100),
      ],
      "2026-07-25",
    );

    expect(totals.get("reading")).toBe(50);
  });

  it("groups a configurable recent calendar window by activity", () => {
    const totals = getRecentActivityTotals(
      [
        entry("2026-06-25", 100),
        entry("2026-06-26", 10),
        entry("2026-07-01", 20, "podcast"),
        entry("2026-07-25", 30),
        entry("2026-07-26", 100),
      ],
      "2026-07-25",
      30,
    );

    expect(totals.get("reading")).toBe(40);
    expect(totals.get("podcast")).toBe(20);
  });
});

describe("activity average comparisons", () => {
  it("uses the selected year, last 30 days, and last 7 days top activity union", () => {
    const rows = getActivityAverageComparisonRows(
      [
        entry("2026-01-01", 500, "anki"),
        entry("2026-01-01", 400, "tv"),
        entry("2026-01-01", 300, "reading"),
        entry("2026-01-01", 200, "podcast"),
        entry("2026-01-01", 100, "speaking"),
        entry("2026-01-08", 90, "game"),
        entry("2026-01-01", 50, "youtube"),
        entry("2026-01-01", 40, "shadowing"),
        entry("2025-12-20", 600, "grammar"),
        entry("2026-01-11", 1_000, "future"),
      ],
      2026,
      "2026-01-10",
    );

    expect(rows.map((row) => row.id)).toEqual([
      "__total__",
      "anki",
      "tv",
      "reading",
      "podcast",
      "speaking",
      "grammar",
      "game",
      "__other__",
    ]);

    const total = rows[0];
    expect(total?.selectedYearAverageMinutes).toBe(168);
    expect(total?.thirtyDayAverageMinutes).toBe(76);
    expect(total?.sevenDayAverageMinutes).toBeCloseTo(90 / 7);

    const grammar = rows.find((row) => row.id === "grammar");
    expect(grammar?.selectedYearAverageMinutes).toBe(0);
    expect(grammar?.thirtyDayAverageMinutes).toBe(20);
    expect(grammar?.thirtyDayVsYearPercent).toBe(100);
    expect(grammar?.sevenDayVsThirtyDayPercent).toBe(-100);

    const other = rows.find((row) => row.id === "__other__");
    expect(other?.selectedYearAverageMinutes).toBe(9);
    expect(other?.thirtyDayAverageMinutes).toBe(3);
    expect(other?.sevenDayAverageMinutes).toBe(0);
    expect(other?.thirtyDayVsYearPercent).toBeCloseTo(-66.666);
  });

  it("uses every day in a completed selected year", () => {
    const rows = getActivityAverageComparisonRows(
      [entry("2024-02-29", 366)],
      2024,
      "2026-07-25",
    );

    expect(rows[0]?.selectedYearAverageMinutes).toBe(1);
  });

  it("returns zero selected-year averages for a future selected year", () => {
    const rows = getActivityAverageComparisonRows(
      [entry("2027-01-01", 60)],
      2027,
      "2026-07-25",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.selectedYearAverageMinutes).toBe(0);
  });
});
