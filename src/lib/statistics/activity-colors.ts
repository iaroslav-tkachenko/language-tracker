type ActivityColorIdentity = {
  id: string;
  systemKey: string | null;
};

// Keep these assignments stable: an activity's color is part of its identity,
// regardless of its rank, period, board, or archive state.
const standardActivityColors: Readonly<Record<string, string>> = {
  anki: "#2563eb",
  tv_show_film: "#7c3aed",
  reading: "#0d9488",
  podcast: "#ea580c",
  speaking: "#65a30d",
  writing: "#db2777",
  grammar: "#0891b2",
  youtube: "#dc2626",
  shadowing: "#ca8a04",
  lesson: "#4f46e5",
};

export const OTHER_ACTIVITY_COLOR = "#64748b";

export function getActivityColor({ id, systemKey }: ActivityColorIdentity) {
  if (systemKey && Object.hasOwn(standardActivityColors, systemKey)) {
    return standardActivityColors[systemKey];
  }

  // FNV-1a over the immutable ID keeps custom colors stable across renames,
  // restores, reloads, and catalog changes, without storing presentation data.
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  }
  const hue = ((hash >>> 0) % 3600) / 10;
  return `hsl(${hue}, 65%, 44%)`;
}
