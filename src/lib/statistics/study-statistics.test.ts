import { describe, expect, it } from "vitest";

import {
  calculateStudyStatistics,
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
});
