import { describe, expect, it } from "vitest";

import { calculatePeriodRecords } from "@/lib/statistics/period-records";

describe("period records", () => {
  it("aggregates calendar periods across years and keeps the newest tied maximum", () => {
    const records = calculatePeriodRecords(
      [
        { date: "2025-12-31", value: 30 },
        { date: "2026-01-01", value: 30 },
        { date: "2026-02-28", value: 20 },
        { date: "2026-03-01", value: 40 },
        { date: "2027-01-01", value: 1_000 },
      ],
      "2026-03-01",
    );

    expect(records.day).toEqual({
      total: 40,
      startDate: "2026-03-01",
      endDate: "2026-03-01",
    });
    expect(records.week).toEqual({
      total: 60,
      startDate: "2026-02-23",
      endDate: "2026-03-01",
    });
    expect(records.month).toEqual({
      total: 40,
      startDate: "2026-03-01",
      endDate: "2026-03-31",
    });
  });

  it("combines multiple values on one day and returns no records for empty totals", () => {
    expect(
      calculatePeriodRecords(
        [
          { date: "2028-02-29", value: 10 },
          { date: "2028-02-29", value: 15 },
        ],
        "2028-02-29",
      ).day,
    ).toEqual({
      total: 25,
      startDate: "2028-02-29",
      endDate: "2028-02-29",
    });

    expect(calculatePeriodRecords([], "2026-07-25")).toEqual({
      day: null,
      week: null,
      month: null,
    });
    expect(
      calculatePeriodRecords([{ date: "2026-07-25", value: 0 }], "2026-07-25"),
    ).toEqual({ day: null, week: null, month: null });
  });
});
