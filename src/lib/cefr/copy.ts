import type { CefrLevel } from "@/lib/cefr/reference";

export function progressForecastDescription(
  currentLevel: CefrLevel,
  nextLevel: CefrLevel,
) {
  return `Estimated progress from ${currentLevel} to ${nextLevel}.`;
}

export const PROGRESS_FORECAST_DESCRIPTION =
  "Progress is based on entries recorded since your current level; forecasts use your recent pace.";

export function highestLevelDescription(currentLevel: CefrLevel) {
  return `${currentLevel} is the highest level in this tracker. Keep using your totals to follow your learning over time.`;
}
