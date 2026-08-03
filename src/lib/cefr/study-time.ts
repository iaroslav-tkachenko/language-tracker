import { fromDateKey, shiftDate } from "@/lib/dates/study-calendar";
import type { CefrLevel } from "@/lib/cefr/reference";

export const STUDY_TIME_MODEL_VERSION = "study-time-cefr-v1";

export const STUDY_TIME_TRANSITIONS = [
  {
    from: "A0",
    to: "A1",
    indicativeRangeHours: [80, 120],
    calculationHours: 100,
  },
  {
    from: "A1",
    to: "A2",
    indicativeRangeHours: [90, 140],
    calculationHours: 110,
  },
  {
    from: "A2",
    to: "B1",
    indicativeRangeHours: [140, 200],
    calculationHours: 170,
  },
  {
    from: "B1",
    to: "B2",
    indicativeRangeHours: [160, 240],
    calculationHours: 200,
  },
  {
    from: "B2",
    to: "C1",
    indicativeRangeHours: [200, 300],
    calculationHours: 250,
  },
  {
    from: "C1",
    to: "C2",
    indicativeRangeHours: [280, 450],
    calculationHours: 350,
  },
] as const satisfies ReadonlyArray<{
  from: CefrLevel;
  to: CefrLevel;
  indicativeRangeHours: readonly [number, number];
  calculationHours: number;
}>;

type StudyTimeTransition = (typeof STUDY_TIME_TRANSITIONS)[number];

export const STUDY_TIME_DISCLOSURE_INTRO =
  "The calculations are based on averaged guidance from Cambridge English, the Goethe-Institut, and European language institutes:";

export const STUDY_TIME_DISCLOSURE_ITEMS = [
  "A0 -> A1: 80-120 hours (calculation value 100)",
  "A1 -> A2: 90-140 hours (110)",
  "A2 -> B1: 140-200 hours (170)",
  "B1 -> B2: 160-240 hours (200)",
  "B2 -> C1: 200-300 hours (250)",
  "C1 -> C2: 280-450 hours (350)",
] as const;

export const STUDY_TIME_DISCLOSURE_NOTE =
  "These are approximate reference points, not guaranteed timeframes.";

export type StudyTimeForecastEntry = {
  studyDate: string;
  durationMinutes: number;
};

export type StudyTimeCurrentLevel = {
  level: CefrLevel;
  effectiveDate: string;
};

export type CalendarDuration = {
  years: number;
  months: number;
  days: number;
};

export type StudyTimeForecast =
  | {
      status: "no-level";
      modelVersion: typeof STUDY_TIME_MODEL_VERSION;
    }
  | {
      status: "highest-level";
      modelVersion: typeof STUDY_TIME_MODEL_VERSION;
      currentLevel: CefrLevel;
      effectiveDate: string;
      baselineMinutes: number;
      eligibleMinutes: number;
      estimatedTotalLearningMinutes: number;
      sevenDayTotalMinutes: number;
      sevenDayAverageMinutes: number;
    }
  | {
      status: "forecast";
      modelVersion: typeof STUDY_TIME_MODEL_VERSION;
      currentLevel: CefrLevel;
      nextLevel: CefrLevel;
      effectiveDate: string;
      baselineMinutes: number;
      nextLevelBaselineMinutes: number;
      requiredMinutes: number;
      eligibleMinutes: number;
      estimatedTotalLearningMinutes: number;
      remainingMinutes: number;
      progressRatio: number;
      sevenDayTotalMinutes: number;
      sevenDayAverageMinutes: number;
      sevenDayEstimate: {
        daysRemaining: number;
        estimatedDate: string;
        duration: CalendarDuration;
      } | null;
    };

function transitionFor(level: CefrLevel) {
  return STUDY_TIME_TRANSITIONS.find((transition) => transition.from === level);
}

export function getStudyTimeBaselineMinutes(level: CefrLevel) {
  const transitionIndex = STUDY_TIME_TRANSITIONS.findIndex(
    (transition) => transition.from === level,
  );
  const includedTransitions: readonly StudyTimeTransition[] =
    transitionIndex === -1
      ? STUDY_TIME_TRANSITIONS
      : STUDY_TIME_TRANSITIONS.slice(0, transitionIndex);

  return (
    includedTransitions.reduce(
      (total, transition) => total + transition.calculationHours,
      0,
    ) * 60
  );
}

function sumMinutesBetween(
  entries: StudyTimeForecastEntry[],
  startDate: string,
  endDate: string,
) {
  return entries.reduce((total, entry) => {
    if (entry.studyDate < startDate || entry.studyDate > endDate) return total;
    return total + entry.durationMinutes;
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

export function calculateStudyTimeForecast({
  currentLevel,
  entries,
  todayKey,
}: {
  currentLevel: StudyTimeCurrentLevel | null;
  entries: StudyTimeForecastEntry[];
  todayKey: string;
}): StudyTimeForecast {
  if (!currentLevel) {
    return { status: "no-level", modelVersion: STUDY_TIME_MODEL_VERSION };
  }

  const eligibleMinutes = sumMinutesBetween(
    entries,
    currentLevel.effectiveDate,
    todayKey,
  );
  const sevenDayStart = shiftDate(todayKey, -6);
  const sevenDayTotalMinutes = sumMinutesBetween(
    entries,
    sevenDayStart,
    todayKey,
  );
  const sevenDayAverageMinutes = sevenDayTotalMinutes / 7;
  const baselineMinutes = getStudyTimeBaselineMinutes(currentLevel.level);
  const estimatedTotalLearningMinutes = baselineMinutes + eligibleMinutes;
  const transition = transitionFor(currentLevel.level);

  if (!transition) {
    return {
      status: "highest-level",
      modelVersion: STUDY_TIME_MODEL_VERSION,
      currentLevel: currentLevel.level,
      effectiveDate: currentLevel.effectiveDate,
      baselineMinutes,
      eligibleMinutes,
      estimatedTotalLearningMinutes,
      sevenDayTotalMinutes,
      sevenDayAverageMinutes,
    };
  }

  const requiredMinutes = transition.calculationHours * 60;
  const remainingMinutes = Math.max(0, requiredMinutes - eligibleMinutes);
  const nextLevelBaselineMinutes = baselineMinutes + requiredMinutes;
  const daysRemaining =
    remainingMinutes > 0 && sevenDayAverageMinutes > 0
      ? Math.ceil(remainingMinutes / sevenDayAverageMinutes)
      : null;
  const estimatedDate =
    daysRemaining === null ? null : shiftDate(todayKey, daysRemaining);

  return {
    status: "forecast",
    modelVersion: STUDY_TIME_MODEL_VERSION,
    currentLevel: currentLevel.level,
    nextLevel: transition.to,
    effectiveDate: currentLevel.effectiveDate,
    baselineMinutes,
    nextLevelBaselineMinutes,
    requiredMinutes,
    eligibleMinutes,
    estimatedTotalLearningMinutes,
    remainingMinutes,
    progressRatio:
      requiredMinutes === 0
        ? 1
        : Math.min(1, eligibleMinutes / requiredMinutes),
    sevenDayTotalMinutes,
    sevenDayAverageMinutes,
    sevenDayEstimate:
      daysRemaining === null || estimatedDate === null
        ? null
        : {
            daysRemaining,
            estimatedDate,
            duration: calendarDurationBetween(todayKey, estimatedDate),
          },
  };
}

export function formatCalendarDuration(duration: CalendarDuration) {
  const parts = [
    duration.years > 0
      ? `${duration.years} ${duration.years === 1 ? "year" : "years"}`
      : null,
    duration.months > 0
      ? `${duration.months} ${duration.months === 1 ? "month" : "months"}`
      : null,
    duration.days > 0
      ? `${duration.days} ${duration.days === 1 ? "day" : "days"}`
      : null,
  ].filter((part) => part !== null);

  return parts.length > 0 ? parts.join(", ") : "0 days";
}

export function formatEstimatedMonth(dateKey: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(fromDateKey(dateKey));
}

export function formatForecastHours(minutes: number) {
  const hours = Math.round(minutes / 60);
  return `${hours.toLocaleString("en")} ${hours === 1 ? "hour" : "hours"}`;
}

export function formatPaceMinutes(minutes: number) {
  if (minutes <= 0) return "No data";
  if (minutes < 60) return `${Math.round(minutes)} min/day`;
  const hours = minutes / 60;
  return `${hours.toLocaleString("en", {
    maximumFractionDigits: hours < 10 && !Number.isInteger(hours) ? 1 : 0,
  })} h/day`;
}
