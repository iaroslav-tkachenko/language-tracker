import { describe, expect, it } from "vitest";

import {
  getWeeklyHours,
  getWeeklyRecommendation,
  WEEKLY_PLAN_HOURS,
  WEEKLY_RECOMMENDATIONS,
} from "@/lib/cefr/recommendations";

describe("WEEKLY_RECOMMENDATIONS", () => {
  it("stores one fixed ten-hour plan for every level below C2", () => {
    expect(WEEKLY_RECOMMENDATIONS.map((plan) => plan.currentLevel)).toEqual([
      "A0",
      "A1",
      "A2",
      "B1",
      "B2",
      "C1",
    ]);
    expect(WEEKLY_PLAN_HOURS).toBe(10);
  });

  it("keeps each activity mix at exactly 100 percent", () => {
    for (const plan of WEEKLY_RECOMMENDATIONS) {
      expect(
        plan.segments.reduce((total, segment) => total + segment.percent, 0),
      ).toBe(100);
    }
  });

  it("does not create a next-level recommendation after C2", () => {
    expect(getWeeklyRecommendation("C2")).toBeNull();
    expect(getWeeklyRecommendation("B2")?.targetLevel).toBe("C1");
  });

  it("derives weekly hours from the ten-hour reference week", () => {
    expect(getWeeklyHours(40)).toBe(4);
    expect(getWeeklyHours(15)).toBe(1.5);
  });
});
