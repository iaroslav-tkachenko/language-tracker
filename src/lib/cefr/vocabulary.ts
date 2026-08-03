import { fromDateKey, shiftDate } from "@/lib/dates/study-calendar";
import type { CefrLevel } from "@/lib/cefr/reference";

export const VOCABULARY_MODEL_VERSION = "vocabulary-cefr-v1";

export const VOCABULARY_LEVELS = [
  {
    level: "A0",
    midpointWords: 0,
    indicativeRangeWords: null,
  },
  {
    level: "A1",
    midpointWords: 900,
    indicativeRangeWords: [700, 1200],
  },
  {
    level: "A2",
    midpointWords: 1600,
    indicativeRangeWords: [1200, 2000],
  },
  {
    level: "B1",
    midpointWords: 2500,
    indicativeRangeWords: [2000, 3000],
  },
  {
    level: "B2",
    midpointWords: 3700,
    indicativeRangeWords: [3000, 4500],
  },
  {
    level: "C1",
    midpointWords: 5000,
    indicativeRangeWords: [4000, 6000],
  },
  {
    level: "C2",
    midpointWords: 7000,
    indicativeRangeWords: [5000, null],
  },
] as const satisfies ReadonlyArray<{
  level: CefrLevel;
  midpointWords: number;
  indicativeRangeWords: readonly [number, number | null] | null;
}>;

export const VOCABULARY_DISCLOSURE_INTRO =
  "The reference ranges use approximate vocabulary-size research values:";

export const VOCABULARY_DISCLOSURE_ITEMS = [
  "A1: 700-1,200 words (calculation value 900)",
  "A2: 1,200-2,000 words (1,600)",
  "B1: 2,000-3,000 words (2,500)",
  "B2: 3,000-4,500 words (3,700)",
  "C1: 4,000-6,000 words (5,000)",
  "C2: 5,000-8,000+ words (7,000)",
] as const;

export const VOCABULARY_DISCLOSURE_NOTE =
  "These ranges are based on vocabulary-size research by Milton and by Finlayson, Marsden, and Hawkes. They are not official CEFR standards.";

export type VocabularyForecastEntry = {
  studyDate: string;
  wordsLearned: number;
};

export type VocabularyCurrentLevel = {
  level: CefrLevel;
  effectiveDate: string;
};

export type CalendarDuration = {
  years: number;
  months: number;
  days: number;
};

export type VocabularyPaceEstimate = {
  periodDays: 7 | 30;
  totalWords: number;
  entryDays: number;
  averageWords: number;
  estimate: {
    daysRemaining: number;
    estimatedDate: string;
    duration: CalendarDuration;
  } | null;
};

export type VocabularyForecast =
  | {
      status: "no-level";
      modelVersion: typeof VOCABULARY_MODEL_VERSION;
    }
  | {
      status: "highest-level";
      modelVersion: typeof VOCABULARY_MODEL_VERSION;
      currentLevel: CefrLevel;
      effectiveDate: string;
      baselineWords: number;
      eligibleWords: number;
      estimatedVocabularySize: number;
      sevenDayPace: VocabularyPaceEstimate;
      thirtyDayPace: VocabularyPaceEstimate;
    }
  | {
      status: "forecast";
      modelVersion: typeof VOCABULARY_MODEL_VERSION;
      currentLevel: CefrLevel;
      nextLevel: CefrLevel;
      effectiveDate: string;
      baselineWords: number;
      nextLevelBaselineWords: number;
      requiredWords: number;
      eligibleWords: number;
      estimatedVocabularySize: number;
      remainingWords: number;
      progressRatio: number;
      sevenDayPace: VocabularyPaceEstimate;
      thirtyDayPace: VocabularyPaceEstimate;
    };

function levelIndex(level: CefrLevel) {
  return VOCABULARY_LEVELS.findIndex((reference) => reference.level === level);
}

function referenceFor(level: CefrLevel) {
  return VOCABULARY_LEVELS.find((reference) => reference.level === level);
}

function nextReferenceFor(level: CefrLevel) {
  const index = levelIndex(level);
  return index === -1 ? undefined : VOCABULARY_LEVELS[index + 1];
}

export function getVocabularyBaselineWords(level: CefrLevel) {
  return referenceFor(level)?.midpointWords ?? 0;
}

function sumWordsBetween(
  entries: VocabularyForecastEntry[],
  startDate: string,
  endDate: string,
) {
  return entries.reduce((total, entry) => {
    if (entry.studyDate < startDate || entry.studyDate > endDate) return total;
    return total + entry.wordsLearned;
  }, 0);
}

function calendarDurationBetween(startDateKey: string, endDateKey: string) {
  const startDate = fromDateKey(startDateKey);
  const endDate = fromDateKey(endDateKey);
  let cursor = new Date(startDate);
  let years = 0;
  let months = 0;

  while (true) {
    const next = new Date(cursor);
    next.setFullYear(next.getFullYear() + 1);
    if (next > endDate) break;
    cursor = next;
    years += 1;
  }

  while (true) {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + 1);
    if (next > endDate) break;
    cursor = next;
    months += 1;
  }

  const days = Math.max(
    0,
    Math.round((endDate.getTime() - cursor.getTime()) / 86_400_000),
  );

  return { years, months, days };
}

function calculatePaceEstimate({
  entries,
  periodDays,
  remainingWords,
  todayKey,
}: {
  entries: VocabularyForecastEntry[];
  periodDays: 7 | 30;
  remainingWords: number;
  todayKey: string;
}): VocabularyPaceEstimate {
  const periodStart = shiftDate(todayKey, -(periodDays - 1));
  const totalWords = sumWordsBetween(entries, periodStart, todayKey);
  const entryDays = new Set(
    entries
      .filter(
        (entry) =>
          entry.studyDate >= periodStart && entry.studyDate <= todayKey,
      )
      .map((entry) => entry.studyDate),
  ).size;
  const averageWords = totalWords / periodDays;
  const daysRemaining =
    remainingWords > 0 && averageWords > 0
      ? Math.ceil(remainingWords / averageWords)
      : null;
  const estimatedDate =
    daysRemaining === null ? null : shiftDate(todayKey, daysRemaining);

  return {
    periodDays,
    totalWords,
    entryDays,
    averageWords,
    estimate:
      daysRemaining === null || estimatedDate === null
        ? null
        : {
            daysRemaining,
            estimatedDate,
            duration: calendarDurationBetween(todayKey, estimatedDate),
          },
  };
}

export function calculateVocabularyForecast({
  currentLevel,
  entries,
  todayKey,
}: {
  currentLevel: VocabularyCurrentLevel | null;
  entries: VocabularyForecastEntry[];
  todayKey: string;
}): VocabularyForecast {
  if (!currentLevel) {
    return { status: "no-level", modelVersion: VOCABULARY_MODEL_VERSION };
  }

  const eligibleWords = sumWordsBetween(
    entries,
    currentLevel.effectiveDate,
    todayKey,
  );
  const baselineWords = getVocabularyBaselineWords(currentLevel.level);
  const estimatedVocabularySize = baselineWords + eligibleWords;
  const nextReference = nextReferenceFor(currentLevel.level);

  if (!nextReference) {
    const sevenDayPace = calculatePaceEstimate({
      entries,
      periodDays: 7,
      remainingWords: 0,
      todayKey,
    });
    const thirtyDayPace = calculatePaceEstimate({
      entries,
      periodDays: 30,
      remainingWords: 0,
      todayKey,
    });

    return {
      status: "highest-level",
      modelVersion: VOCABULARY_MODEL_VERSION,
      currentLevel: currentLevel.level,
      effectiveDate: currentLevel.effectiveDate,
      baselineWords,
      eligibleWords,
      estimatedVocabularySize,
      sevenDayPace,
      thirtyDayPace,
    };
  }

  const requiredWords = nextReference.midpointWords - baselineWords;
  const remainingWords = Math.max(0, requiredWords - eligibleWords);
  const sevenDayPace = calculatePaceEstimate({
    entries,
    periodDays: 7,
    remainingWords,
    todayKey,
  });
  const thirtyDayPace = calculatePaceEstimate({
    entries,
    periodDays: 30,
    remainingWords,
    todayKey,
  });

  return {
    status: "forecast",
    modelVersion: VOCABULARY_MODEL_VERSION,
    currentLevel: currentLevel.level,
    nextLevel: nextReference.level,
    effectiveDate: currentLevel.effectiveDate,
    baselineWords,
    nextLevelBaselineWords: nextReference.midpointWords,
    requiredWords,
    eligibleWords,
    estimatedVocabularySize,
    remainingWords,
    progressRatio:
      requiredWords === 0 ? 1 : Math.min(1, eligibleWords / requiredWords),
    sevenDayPace,
    thirtyDayPace,
  };
}

export function formatVocabularyWords(words: number) {
  const roundedWords = Math.round(words);
  return `${roundedWords.toLocaleString("en")} ${
    roundedWords === 1 ? "word" : "words"
  }`;
}

export function formatVocabularyPace(words: number) {
  if (words <= 0) return "No data";
  const roundedWords = Math.round(words);
  return `${roundedWords.toLocaleString("en")} ${
    roundedWords === 1 ? "word" : "words"
  }/day`;
}
