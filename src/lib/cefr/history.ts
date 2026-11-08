import { CEFR_LEVELS, type CefrLevel } from "@/lib/cefr/reference";

export type CefrLevelEvent = {
  id: string;
  level: CefrLevel;
  effectiveDate: string;
  createdAt?: string;
};

function chronologicalKey(event: CefrLevelEvent) {
  return `${event.effectiveDate}|${event.createdAt ?? ""}|${event.id}`;
}

export function sortCefrHistoryNewestFirst(events: CefrLevelEvent[]) {
  return [...events].sort((left, right) =>
    chronologicalKey(right).localeCompare(chronologicalKey(left)),
  );
}

export function getCurrentCefrEvent(events: CefrLevelEvent[]) {
  return sortCefrHistoryNewestFirst(events)[0] ?? null;
}

export function hasAdjacentDuplicateCefrLevels(events: CefrLevelEvent[]) {
  const oldestFirst = sortCefrHistoryNewestFirst(events).reverse();

  return oldestFirst.some((event, index) => {
    const previous = oldestFirst[index - 1];
    return previous?.level === event.level;
  });
}

const DAY_MS = 86_400_000;

function utcDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addMonthsClamped(start: Date, months: number) {
  const target = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return target;
}

export function formatLevelDuration(startKey: string, endKey: string) {
  const start = utcDate(startKey);
  const end = utcDate(endKey);
  if (end <= start) return "Started today";
  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    end.getUTCMonth() -
    start.getUTCMonth();
  if (addMonthsClamped(start, months) > end) months--;
  const days = Math.round(
    (end.getTime() - addMonthsClamped(start, months).getTime()) / DAY_MS,
  );
  const years = Math.floor(months / 12);
  const parts = [
    [years, "year"],
    [months % 12, "month"],
    [days, "day"],
  ] as const;
  return parts
    .filter(([value]) => value > 0)
    .map(([value, unit]) => `${value} ${unit}${value === 1 ? "" : "s"}`)
    .join(" ");
}

export function getLevelPeriods(events: CefrLevelEvent[], todayKey: string) {
  const history = sortCefrHistoryNewestFirst(
    events.filter((event) => event.effectiveDate <= todayKey),
  );
  return history.map((event, index) => {
    const previous = history[index + 1];
    const endExclusive =
      index === 0 ? todayKey : history[index - 1].effectiveDate;
    const days = Math.round(
      (utcDate(endExclusive).getTime() -
        utcDate(event.effectiveDate).getTime()) /
        DAY_MS,
    );
    const direction = !previous
      ? "first"
      : CEFR_LEVELS.indexOf(event.level) > CEFR_LEVELS.indexOf(previous.level)
        ? "up"
        : "down";
    return {
      event,
      previous,
      current: index === 0,
      endExclusive,
      days,
      direction,
      duration: formatLevelDuration(event.effectiveDate, endExclusive),
    } as const;
  });
}
