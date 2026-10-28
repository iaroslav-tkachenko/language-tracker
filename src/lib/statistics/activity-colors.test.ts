import { describe, expect, it } from "vitest";

import {
  getActivityColor,
  OTHER_ACTIVITY_COLOR,
} from "@/lib/statistics/activity-colors";
import { groupActivityDonutRows } from "@/lib/statistics/activity-donut";
import {
  getActivityAverageComparisonRows,
  getActivityTotals,
  getRecentActivityTotals,
} from "@/lib/statistics/study-statistics";

describe("activity colors", () => {
  it("keeps standard identities fixed across users and distinct from each other and Other", () => {
    const systemKeys = [
      "anki",
      "tv_show_film",
      "reading",
      "podcast",
      "speaking",
      "writing",
      "grammar",
      "youtube",
      "shadowing",
      "lesson",
    ];
    const colors = systemKeys.map((systemKey) => {
      const color = getActivityColor({ id: "user-one-activity", systemKey });
      expect(getActivityColor({ id: "user-two-activity", systemKey })).toBe(
        color,
      );
      expect(color).not.toBe(OTHER_ACTIVITY_COLOR);
      return color;
    });
    expect(new Set(colors).size).toBe(systemKeys.length);
  });

  it("preserves a custom activity's color after renaming, archiving, and restoring", () => {
    const original = {
      id: "7f58b451-d392-4e37-b65e-6d6f029c785f",
      systemKey: null,
      name: "Audiobook",
      archivedAt: null as string | null,
    };
    const color = getActivityColor(original);
    const renamed = { ...original, name: "Audio books" };
    const archived = { ...renamed, archivedAt: "2026-10-28T12:00:00Z" };
    const restored = { ...archived, archivedAt: null };

    expect(color).toMatch(/^hsl\(\d+(\.\d)?, 65%, 44%\)$/);
    for (const activity of [renamed, archived, restored]) {
      expect(getActivityColor(activity)).toBe(color);
    }
  });

  it("uses the immutable ID for unknown system keys as well", () => {
    const activity = { id: "custom-id", systemKey: null };
    for (const systemKey of ["unknown", "__proto__", "constructor"]) {
      expect(getActivityColor({ ...activity, systemKey })).toBe(
        getActivityColor(activity),
      );
    }
  });

  it("retains colors when the same activities trade ranks across periods and the table", () => {
    const activities = [
      { id: "anki-id", name: "Anki", systemKey: "anki" },
      { id: "tv-id", name: "TV Show / Film", systemKey: "tv_show_film" },
      { id: "audio-id", name: "Audiobook", systemKey: null },
    ];
    const entries = [
      {
        studyDate: "2026-01-01",
        durationMinutes: 900,
        activityTypeId: "anki-id",
      },
      {
        studyDate: "2026-10-10",
        durationMinutes: 500,
        activityTypeId: "audio-id",
      },
      {
        studyDate: "2026-10-28",
        durationMinutes: 300,
        activityTypeId: "tv-id",
      },
      {
        studyDate: "2026-10-28",
        durationMinutes: 60,
        activityTypeId: "anki-id",
      },
    ];
    const totals = [
      getActivityTotals(entries, 2026),
      getRecentActivityTotals(entries, "2026-10-28", 7),
      getRecentActivityTotals(entries, "2026-10-28", 30),
    ];
    const charts = totals.map((period) =>
      groupActivityDonutRows(
        activities.map((activity) => ({
          ...activity,
          minutes: period.get(activity.id) ?? 0,
        })),
      ),
    );
    expect(charts.map((rows) => rows[0].id)).toEqual([
      "anki-id",
      "tv-id",
      "audio-id",
    ]);
    const tableRows = getActivityAverageComparisonRows(
      entries,
      2026,
      "2026-10-28",
    );
    for (const activity of activities) {
      expect(tableRows.some((row) => row.id === activity.id)).toBe(true);
      const expected = getActivityColor(activity);
      for (const rows of charts) {
        const row = rows.find((row) => row.id === activity.id);
        if (row) expect(getActivityColor(row)).toBe(expected);
      }
    }
  });

  it("preserves individual colors when an activity moves into or out of Other", () => {
    const activities = Array.from({ length: 7 }, (_, index) => ({
      id: `custom-${index}`,
      name: `Custom ${index}`,
      systemKey: null,
      minutes: 70 - index * 10,
    }));
    const grouped = groupActivityDonutRows(activities);
    const hidden = grouped.at(-1)!.items!;
    const ungrouped = groupActivityDonutRows(activities.slice(1));
    expect(OTHER_ACTIVITY_COLOR).toBe("#64748b");
    for (const activity of hidden) {
      const visible = ungrouped.find((row) => row.id === activity.id)!;
      expect(getActivityColor(visible)).toBe(getActivityColor(activity));
    }
  });
});
