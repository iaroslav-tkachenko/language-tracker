export const CEFR_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];

export function isCefrLevel(value: unknown): value is CefrLevel {
  return (
    typeof value === "string" &&
    CEFR_LEVELS.includes(value as (typeof CEFR_LEVELS)[number])
  );
}
