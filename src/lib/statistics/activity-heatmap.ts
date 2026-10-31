export type ActivityHeatmapActivity = {
  id: string;
  name: string;
  archivedAt: string | null;
};

export type ActivityHeatmapEntry = {
  studyDate: string;
  activityTypeId: string;
};

export function getActivityHeatmapActivities(
  activities: ActivityHeatmapActivity[],
  entries: ActivityHeatmapEntry[],
) {
  const usedActivityIds = new Set(entries.map((entry) => entry.activityTypeId));

  return activities.filter(
    (activity) =>
      activity.archivedAt === null && usedActivityIds.has(activity.id),
  );
}

export function getActivityHeatmapDateKeys(
  entries: ActivityHeatmapEntry[],
  selectedActivityIds: Iterable<string>,
  year: number,
) {
  const selectedIds = new Set(selectedActivityIds);
  if (selectedIds.size === 0) return new Set<string>();

  const yearPrefix = `${year}-`;
  return new Set(
    entries
      .filter(
        (entry) =>
          entry.studyDate.startsWith(yearPrefix) &&
          selectedIds.has(entry.activityTypeId),
      )
      .map((entry) => entry.studyDate),
  );
}

export function getActivityHeatmapDayCounts(
  entries: ActivityHeatmapEntry[],
  year: number,
) {
  const datesByActivity = new Map<string, Set<string>>();
  const yearPrefix = `${year}-`;

  for (const entry of entries) {
    if (!entry.studyDate.startsWith(yearPrefix)) continue;
    let dates = datesByActivity.get(entry.activityTypeId);
    if (!dates) {
      dates = new Set<string>();
      datesByActivity.set(entry.activityTypeId, dates);
    }
    dates.add(entry.studyDate);
  }

  return new Map(
    [...datesByActivity].map(([activityId, dates]) => [activityId, dates.size]),
  );
}
