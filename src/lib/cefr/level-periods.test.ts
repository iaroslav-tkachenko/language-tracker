import { describe, expect, it } from "vitest";

import { formatLevelDuration, getLevelPeriods } from "@/lib/cefr/history";
import type { CefrLevelEvent } from "@/lib/cefr/history";

describe("level periods", () => {
  it("keeps separate periods and identifies both increases and decreases", () => {
    const events: CefrLevelEvent[] = [
      { id: "3", level: "B1", effectiveDate: "2026-05-08" },
      { id: "1", level: "A2", effectiveDate: "2024-05-08" },
      { id: "2", level: "B2", effectiveDate: "2025-05-08" },
    ];
    const periods = getLevelPeriods(events, "2026-11-08");
    expect(
      periods.map(({ event, direction, duration }) => [
        event.level,
        direction,
        duration,
      ]),
    ).toEqual([
      ["B1", "down", "6 months"],
      ["B2", "up", "1 year"],
      ["A2", "first", "1 year"],
    ]);
    expect(periods[1].endExclusive).toBe("2026-05-08");
  });

  it("handles an empty history, same-day start and a future event", () => {
    expect(getLevelPeriods([], "2026-11-08")).toEqual([]);
    expect(
      getLevelPeriods(
        [
          { id: "1", level: "B1", effectiveDate: "2026-11-08" },
          { id: "2", level: "B2", effectiveDate: "2026-11-09" },
        ],
        "2026-11-08",
      ).map((period) => [period.duration, period.days]),
    ).toEqual([["Started today", 0]]);
  });

  it("uses clamped calendar months and handles leap days", () => {
    expect(formatLevelDuration("2025-01-31", "2025-02-28")).toBe("1 month");
    expect(formatLevelDuration("2024-02-29", "2025-02-28")).toBe("1 year");
    expect(formatLevelDuration("2025-01-31", "2025-03-01")).toBe(
      "1 month 1 day",
    );
  });
});
