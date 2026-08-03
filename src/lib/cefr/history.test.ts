import { describe, expect, it } from "vitest";

import {
  getCurrentCefrEvent,
  hasAdjacentDuplicateCefrLevels,
  sortCefrHistoryNewestFirst,
  type CefrLevelEvent,
} from "@/lib/cefr/history";

const history: CefrLevelEvent[] = [
  { id: "a1", level: "A1", effectiveDate: "2024-02-12" },
  { id: "b1", level: "B1", effectiveDate: "2026-07-12" },
  { id: "a2", level: "A2", effectiveDate: "2025-01-10" },
];

describe("sortCefrHistoryNewestFirst", () => {
  it("sorts newest effective declarations first", () => {
    expect(
      sortCefrHistoryNewestFirst(history).map((event) => event.id),
    ).toEqual(["b1", "a2", "a1"]);
  });

  it("uses created timestamp and id as deterministic tie-breakers", () => {
    expect(
      sortCefrHistoryNewestFirst([
        {
          id: "older-created",
          level: "A1",
          effectiveDate: "2026-01-01",
          createdAt: "2026-01-01T10:00:00.000Z",
        },
        {
          id: "newer-created",
          level: "A2",
          effectiveDate: "2026-01-01",
          createdAt: "2026-01-01T11:00:00.000Z",
        },
      ])[0]?.id,
    ).toBe("newer-created");
  });
});

describe("getCurrentCefrEvent", () => {
  it("returns the newest declaration", () => {
    expect(getCurrentCefrEvent(history)?.level).toBe("B1");
  });

  it("returns null without history", () => {
    expect(getCurrentCefrEvent([])).toBeNull();
  });
});

describe("hasAdjacentDuplicateCefrLevels", () => {
  it("rejects chronologically adjacent duplicate levels", () => {
    expect(
      hasAdjacentDuplicateCefrLevels([
        { id: "a1-start", level: "A1", effectiveDate: "2024-01-01" },
        { id: "a1-duplicate", level: "A1", effectiveDate: "2024-02-01" },
      ]),
    ).toBe(true);
  });

  it("allows returning to a previous level after an intervening level", () => {
    expect(
      hasAdjacentDuplicateCefrLevels([
        { id: "b1-start", level: "B1", effectiveDate: "2024-01-01" },
        { id: "b2", level: "B2", effectiveDate: "2024-02-01" },
        { id: "b1-return", level: "B1", effectiveDate: "2024-03-01" },
      ]),
    ).toBe(false);
  });
});
