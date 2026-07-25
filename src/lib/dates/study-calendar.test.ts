import { describe, expect, it } from "vitest";

import {
  getCalendarCells,
  getCalendarRangeCells,
  shiftDate,
  studyHeatLevel,
} from "@/lib/dates/study-calendar";

describe("study calendar", () => {
  it("covers every date in a common year", () => {
    const dates = getCalendarCells(2026).filter((cell) => cell.inYear);
    expect(dates).toHaveLength(365);
    expect(dates[0]?.dateKey).toBe("2026-01-01");
    expect(dates.at(-1)?.dateKey).toBe("2026-12-31");
  });

  it("covers leap day", () => {
    const dates = getCalendarCells(2028).filter((cell) => cell.inYear);
    expect(dates).toHaveLength(366);
    expect(dates.some((cell) => cell.dateKey === "2028-02-29")).toBe(true);
  });

  it("moves across month and year boundaries", () => {
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDate("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("creates Monday-to-Sunday half-year grids for mobile", () => {
    const firstHalf = getCalendarRangeCells("2026-01-01", "2026-06-30");
    const secondHalf = getCalendarRangeCells("2026-07-01", "2026-12-31");

    expect(firstHalf).toHaveLength(27 * 7);
    expect(firstHalf.filter((cell) => cell.inRange)).toHaveLength(181);
    expect(firstHalf[0]?.dateKey).toBe("2025-12-29");
    expect(firstHalf.at(-1)?.dateKey).toBe("2026-07-05");

    expect(secondHalf).toHaveLength(27 * 7);
    expect(secondHalf.filter((cell) => cell.inRange)).toHaveLength(184);
    expect(secondHalf[0]?.dateKey).toBe("2026-06-29");
    expect(secondHalf.at(-1)?.dateKey).toBe("2027-01-03");
  });

  it.each([
    [0, 0],
    [1, 1],
    [14, 1],
    [15, 2],
    [29, 2],
    [30, 3],
    [59, 3],
    [60, 4],
    [119, 4],
    [120, 5],
    [180, 5],
    [181, 6],
  ])("maps %i minutes to level %i", (minutes, level) => {
    expect(studyHeatLevel(minutes)).toBe(level);
  });
});
