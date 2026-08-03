import { describe, expect, it } from "vitest";

import {
  calculateVocabularyForecast,
  getVocabularyBaselineWords,
  VOCABULARY_LEVELS,
  VOCABULARY_MODEL_VERSION,
} from "@/lib/cefr/vocabulary";

describe("VOCABULARY_LEVELS", () => {
  it("stores the approved calculation midpoints", () => {
    expect(
      VOCABULARY_LEVELS.map((reference) => [
        reference.level,
        reference.midpointWords,
      ]),
    ).toEqual([
      ["A0", 0],
      ["A1", 900],
      ["A2", 1600],
      ["B1", 2500],
      ["B2", 3700],
      ["C1", 5000],
      ["C2", 7000],
    ]);
  });
});

describe("getVocabularyBaselineWords", () => {
  it("uses the current level midpoint as the vocabulary baseline", () => {
    expect(getVocabularyBaselineWords("A0")).toBe(0);
    expect(getVocabularyBaselineWords("A1")).toBe(900);
    expect(getVocabularyBaselineWords("B1")).toBe(2500);
    expect(getVocabularyBaselineWords("B2")).toBe(3700);
    expect(getVocabularyBaselineWords("C2")).toBe(7000);
  });
});

describe("calculateVocabularyForecast", () => {
  it("returns no-level state without a current declaration", () => {
    expect(
      calculateVocabularyForecast({
        currentLevel: null,
        entries: [],
        todayKey: "2026-08-03",
      }),
    ).toEqual({
      status: "no-level",
      modelVersion: VOCABULARY_MODEL_VERSION,
    });
  });

  it("calculates B1 to B2 progress from the current declaration date", () => {
    const forecast = calculateVocabularyForecast({
      currentLevel: { level: "B1", effectiveDate: "2026-07-12" },
      todayKey: "2026-08-03",
      entries: [
        { studyDate: "2026-07-11", wordsLearned: 999 },
        { studyDate: "2026-07-12", wordsLearned: 100 },
        { studyDate: "2026-07-20", wordsLearned: 120 },
        { studyDate: "2026-08-01", wordsLearned: 20 },
        { studyDate: "2026-08-02", wordsLearned: 30 },
        { studyDate: "2026-08-03", wordsLearned: 40 },
        { studyDate: "2026-08-04", wordsLearned: 999 },
      ],
    });

    expect(forecast.status).toBe("forecast");
    if (forecast.status !== "forecast") return;
    expect(forecast.currentLevel).toBe("B1");
    expect(forecast.nextLevel).toBe("B2");
    expect(forecast.baselineWords).toBe(2500);
    expect(forecast.requiredWords).toBe(1200);
    expect(forecast.eligibleWords).toBe(310);
    expect(forecast.estimatedVocabularySize).toBe(2810);
    expect(forecast.remainingWords).toBe(890);
    expect(forecast.progressRatio).toBeCloseTo(310 / 1200);
    expect(forecast.sevenDayTotalWords).toBe(90);
    expect(forecast.sevenDayAverageWords).toBeCloseTo(90 / 7);
    expect(forecast.sevenDayEstimate?.daysRemaining).toBe(70);
    expect(forecast.sevenDayEstimate?.estimatedDate).toBe("2026-10-12");
  });

  it("uses a zero floor when the next-level reference is reached", () => {
    const forecast = calculateVocabularyForecast({
      currentLevel: { level: "A1", effectiveDate: "2026-01-01" },
      todayKey: "2026-08-03",
      entries: [{ studyDate: "2026-01-01", wordsLearned: 900 }],
    });

    expect(forecast.status).toBe("forecast");
    if (forecast.status !== "forecast") return;
    expect(forecast.remainingWords).toBe(0);
    expect(forecast.progressRatio).toBe(1);
    expect(forecast.sevenDayEstimate).toBeNull();
  });

  it("returns no seven-day estimate when pace is zero", () => {
    const forecast = calculateVocabularyForecast({
      currentLevel: { level: "A2", effectiveDate: "2026-01-01" },
      todayKey: "2026-08-03",
      entries: [{ studyDate: "2026-01-01", wordsLearned: 100 }],
    });

    expect(forecast.status).toBe("forecast");
    if (forecast.status !== "forecast") return;
    expect(forecast.sevenDayAverageWords).toBe(0);
    expect(forecast.sevenDayEstimate).toBeNull();
  });

  it("returns highest-level state for C2", () => {
    const forecast = calculateVocabularyForecast({
      currentLevel: { level: "C2", effectiveDate: "2026-01-01" },
      todayKey: "2026-08-03",
      entries: [{ studyDate: "2026-01-02", wordsLearned: 400 }],
    });

    expect(forecast.status).toBe("highest-level");
    if (forecast.status !== "highest-level") return;
    expect(forecast.baselineWords).toBe(7000);
    expect(forecast.estimatedVocabularySize).toBe(7400);
  });
});
