import { describe, expect, it } from "vitest";

import {
  calculateStudyTimeForecast,
  formatCalendarDuration,
  getStudyTimeBaselineMinutes,
  STUDY_TIME_MODEL_VERSION,
  STUDY_TIME_TRANSITIONS,
} from "@/lib/cefr/study-time";

describe("STUDY_TIME_TRANSITIONS", () => {
  it("stores the approved calculation differences", () => {
    expect(
      STUDY_TIME_TRANSITIONS.map((transition) => [
        transition.from,
        transition.to,
        transition.calculationHours,
      ]),
    ).toEqual([
      ["A0", "A1", 100],
      ["A1", "A2", 110],
      ["A2", "B1", 170],
      ["B1", "B2", 200],
      ["B2", "C1", 250],
      ["C1", "C2", 350],
    ]);
  });
});

describe("getStudyTimeBaselineMinutes", () => {
  it("derives cumulative baselines from A0", () => {
    expect(getStudyTimeBaselineMinutes("A0")).toBe(0);
    expect(getStudyTimeBaselineMinutes("A1")).toBe(100 * 60);
    expect(getStudyTimeBaselineMinutes("B1")).toBe(380 * 60);
    expect(getStudyTimeBaselineMinutes("B2")).toBe(580 * 60);
    expect(getStudyTimeBaselineMinutes("C2")).toBe(1180 * 60);
  });
});

describe("calculateStudyTimeForecast", () => {
  it("returns no-level state without a current declaration", () => {
    expect(
      calculateStudyTimeForecast({
        currentLevel: null,
        entries: [],
        todayKey: "2026-08-03",
      }),
    ).toEqual({
      status: "no-level",
      modelVersion: STUDY_TIME_MODEL_VERSION,
    });
  });

  it("calculates B1 to B2 progress from the current declaration date", () => {
    const forecast = calculateStudyTimeForecast({
      currentLevel: { level: "B1", effectiveDate: "2026-07-12" },
      todayKey: "2026-08-03",
      entries: [
        { studyDate: "2026-07-11", durationMinutes: 999 },
        { studyDate: "2026-07-12", durationMinutes: 120 },
        { studyDate: "2026-07-20", durationMinutes: 180 },
        { studyDate: "2026-08-01", durationMinutes: 60 },
        { studyDate: "2026-08-02", durationMinutes: 60 },
        { studyDate: "2026-08-03", durationMinutes: 60 },
        { studyDate: "2026-08-04", durationMinutes: 999 },
      ],
    });

    expect(forecast.status).toBe("forecast");
    if (forecast.status !== "forecast") return;
    expect(forecast.currentLevel).toBe("B1");
    expect(forecast.nextLevel).toBe("B2");
    expect(forecast.baselineMinutes).toBe(380 * 60);
    expect(forecast.requiredMinutes).toBe(200 * 60);
    expect(forecast.eligibleMinutes).toBe(480);
    expect(forecast.estimatedTotalLearningMinutes).toBe(380 * 60 + 480);
    expect(forecast.remainingMinutes).toBe(200 * 60 - 480);
    expect(forecast.progressRatio).toBeCloseTo(0.04);
    expect(forecast.sevenDayPace.totalMinutes).toBe(180);
    expect(forecast.sevenDayPace.entryDays).toBe(3);
    expect(forecast.sevenDayPace.averageMinutes).toBeCloseTo(180 / 7);
    expect(forecast.sevenDayPace.estimate?.daysRemaining).toBe(448);
    expect(forecast.sevenDayPace.estimate?.estimatedDate).toBe("2027-10-25");
    expect(forecast.thirtyDayPace.totalMinutes).toBe(1479);
    expect(forecast.thirtyDayPace.entryDays).toBe(6);
    expect(forecast.thirtyDayPace.averageMinutes).toBeCloseTo(1479 / 30);
    expect(forecast.thirtyDayPace.estimate?.daysRemaining).toBe(234);
    expect(forecast.thirtyDayPace.estimate?.estimatedDate).toBe("2027-03-25");
  });

  it("uses a zero floor when the transition reference is reached", () => {
    const forecast = calculateStudyTimeForecast({
      currentLevel: { level: "A0", effectiveDate: "2026-01-01" },
      todayKey: "2026-08-03",
      entries: [{ studyDate: "2026-01-01", durationMinutes: 7000 }],
    });

    expect(forecast.status).toBe("forecast");
    if (forecast.status !== "forecast") return;
    expect(forecast.remainingMinutes).toBe(0);
    expect(forecast.progressRatio).toBe(1);
    expect(forecast.sevenDayPace.estimate).toBeNull();
    expect(forecast.thirtyDayPace.estimate).toBeNull();
  });

  it("returns no seven-day estimate when pace is zero", () => {
    const forecast = calculateStudyTimeForecast({
      currentLevel: { level: "A1", effectiveDate: "2026-01-01" },
      todayKey: "2026-08-03",
      entries: [{ studyDate: "2026-01-01", durationMinutes: 60 }],
    });

    expect(forecast.status).toBe("forecast");
    if (forecast.status !== "forecast") return;
    expect(forecast.sevenDayPace.averageMinutes).toBe(0);
    expect(forecast.sevenDayPace.estimate).toBeNull();
    expect(forecast.thirtyDayPace.estimate).toBeNull();
  });

  it("returns highest-level state for C2", () => {
    const forecast = calculateStudyTimeForecast({
      currentLevel: { level: "C2", effectiveDate: "2026-01-01" },
      todayKey: "2026-08-03",
      entries: [{ studyDate: "2026-01-02", durationMinutes: 120 }],
    });

    expect(forecast.status).toBe("highest-level");
    if (forecast.status !== "highest-level") return;
    expect(forecast.baselineMinutes).toBe(1180 * 60);
    expect(forecast.estimatedTotalLearningMinutes).toBe(1180 * 60 + 120);
  });
});

describe("formatCalendarDuration", () => {
  it("formats years, months, and days", () => {
    expect(formatCalendarDuration({ years: 1, months: 2, days: 3 })).toBe(
      "1 year, 2 months, 3 days",
    );
    expect(formatCalendarDuration({ years: 0, months: 4, days: 17 })).toBe(
      "4 months, 17 days",
    );
    expect(formatCalendarDuration({ years: 0, months: 0, days: 0 })).toBe(
      "0 days",
    );
  });
});
