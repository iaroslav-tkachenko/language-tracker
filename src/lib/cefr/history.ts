import type { CefrLevel } from "@/lib/cefr/reference";

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
