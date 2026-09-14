import { describe, expect, it } from "vitest";

import {
  getActivityHeatmapActivities,
  getActivityHeatmapDateKeys,
  type ActivityHeatmapActivity,
  type ActivityHeatmapEntry,
} from "./activity-heatmap";

const activities: ActivityHeatmapActivity[] = [
  { id: "reading", name: "Reading", archivedAt: null },
  { id: "podcast", name: "Podcast", archivedAt: null },
  { id: "unused", name: "Writing", archivedAt: null },
  { id: "archived", name: "Old custom", archivedAt: "2026-02-01T00:00:00Z" },
  { id: "restored", name: "Restored custom", archivedAt: null },
];

const entries: ActivityHeatmapEntry[] = [
  { studyDate: "2025-05-03", activityTypeId: "reading" },
  { studyDate: "2026-01-01", activityTypeId: "reading" },
  { studyDate: "2026-02-28", activityTypeId: "podcast" },
  { studyDate: "2026-12-31", activityTypeId: "podcast" },
  { studyDate: "2027-02-01", activityTypeId: "reading" },
  { studyDate: "2026-04-10", activityTypeId: "archived" },
  { studyDate: "2026-06-15", activityTypeId: "restored" },
];

describe("getActivityHeatmapActivities", () => {
  it("keeps catalog order and includes only active activities used on this board", () => {
    expect(getActivityHeatmapActivities(activities, entries)).toEqual([
      activities[0],
      activities[1],
      activities[4],
    ]);
  });

  it("does not include an activity used only on another board", () => {
    const otherBoardEntry = {
      studyDate: "2026-01-01",
      activityTypeId: "unused",
    };
    expect(getActivityHeatmapActivities(activities, entries)).not.toContain(
      activities[2],
    );
    expect(getActivityHeatmapActivities(activities, [otherBoardEntry])).toEqual(
      [activities[2]],
    );
  });
});

describe("getActivityHeatmapDateKeys", () => {
  it("returns no matches when no activity is selected", () => {
    expect(getActivityHeatmapDateKeys(entries, [], 2026).size).toBe(0);
  });

  it("matches one activity without depending on duration", () => {
    expect([...getActivityHeatmapDateKeys(entries, ["reading"], 2026)]).toEqual(
      ["2026-01-01"],
    );
  });

  it("uses OR semantics and collapses repeated matches on one day", () => {
    const repeated = [
      ...entries,
      { studyDate: "2026-01-01", activityTypeId: "podcast" },
      { studyDate: "2026-01-01", activityTypeId: "reading" },
    ];
    expect([
      ...getActivityHeatmapDateKeys(repeated, ["reading", "podcast"], 2026),
    ]).toEqual(["2026-01-01", "2026-02-28", "2026-12-31"]);
  });

  it("keeps all-time activities selectable while matching only the open year", () => {
    expect(getActivityHeatmapDateKeys(entries, ["reading"], 2024).size).toBe(0);
    expect([...getActivityHeatmapDateKeys(entries, ["reading"], 2027)]).toEqual(
      ["2027-02-01"],
    );
  });

  it("includes future saved entries and leap-year boundaries", () => {
    const boundaryEntries = [
      { studyDate: "2024-01-01", activityTypeId: "reading" },
      { studyDate: "2024-02-29", activityTypeId: "reading" },
      { studyDate: "2024-12-31", activityTypeId: "reading" },
    ];
    expect([
      ...getActivityHeatmapDateKeys(boundaryEntries, ["reading"], 2024),
    ]).toEqual(boundaryEntries.map((entry) => entry.studyDate));
  });
});
