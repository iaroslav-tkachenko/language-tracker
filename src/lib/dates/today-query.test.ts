import { describe, expect, it } from "vitest";

import { syncTodaySearchParams } from "@/lib/dates/today-query";

describe("syncTodaySearchParams", () => {
  it("does nothing when the URL already contains browser-local today", () => {
    expect(
      syncTodaySearchParams({
        search: "board=abc&date=2026-08-12&today=2026-08-12",
        browserDate: new Date(2026, 7, 12),
        dateParam: "date",
      }),
    ).toBeNull();
  });

  it("updates today and moves the selected date when it represented stale today", () => {
    expect(
      syncTodaySearchParams({
        search: "board=abc&date=2026-08-11&today=2026-08-11",
        browserDate: new Date(2026, 7, 12),
        dateParam: "date",
      }),
    ).toBe("board=abc&date=2026-08-12&today=2026-08-12");
  });

  it("preserves an intentionally selected non-today date", () => {
    expect(
      syncTodaySearchParams({
        search: "board=abc&date=2026-08-10&today=2026-08-11",
        browserDate: new Date(2026, 7, 12),
        dateParam: "date",
      }),
    ).toBe("board=abc&date=2026-08-10&today=2026-08-12");
  });

  it("rolls a current statistics year when today crosses into a new year", () => {
    expect(
      syncTodaySearchParams({
        search: "board=abc&year=2026&today=2026-12-31",
        browserDate: new Date(2027, 0, 1),
        yearParam: "year",
      }),
    ).toBe("board=abc&year=2027&today=2027-01-01");
  });
});
