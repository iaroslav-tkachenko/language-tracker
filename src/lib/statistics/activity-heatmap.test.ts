import { describe, expect, it } from "vitest";

import {
  getActivityHeatmapActivities,
  getActivityHeatmapCoverage,
  getActivityHeatmapDateKeys,
  getActivityHeatmapDayCounts,
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

describe("getActivityHeatmapDayCounts", () => {
  it("counts unique dates per activity while the combined heatmap counts shared dates once", () => {
    const overlappingEntries = [
      ...entries,
      { studyDate: "2026-01-01", activityTypeId: "reading" },
      { studyDate: "2026-01-01", activityTypeId: "podcast" },
      { studyDate: "2026-02-28", activityTypeId: "podcast" },
    ];
    const counts = getActivityHeatmapDayCounts(overlappingEntries, 2026);
    expect(counts.get("reading")).toBe(1);
    expect(counts.get("podcast")).toBe(3);
    expect(
      getActivityHeatmapDateKeys(
        overlappingEntries,
        ["reading", "podcast"],
        2026,
      ).size,
    ).toBe(3);
  });

  it("uses only the open year and includes future saved dates", () => {
    expect(getActivityHeatmapDayCounts(entries, 2026).get("podcast")).toBe(2);
    expect(getActivityHeatmapDayCounts(entries, 2025).get("reading")).toBe(1);
    expect(getActivityHeatmapDayCounts(entries, 2027).get("reading")).toBe(1);
    expect(getActivityHeatmapDayCounts(entries, 2024).size).toBe(0);
  });

  it("counts leap day and year boundaries without counting duplicate sessions", () => {
    expect(
      getActivityHeatmapDayCounts(
        [
          { studyDate: "2024-01-01", activityTypeId: "reading" },
          { studyDate: "2024-02-29", activityTypeId: "reading" },
          { studyDate: "2024-02-29", activityTypeId: "reading" },
          { studyDate: "2024-12-31", activityTypeId: "reading" },
          { studyDate: "2025-01-01", activityTypeId: "reading" },
        ],
        2024,
      ).get("reading"),
    ).toBe(3);
  });

  it("returns no counts for an empty board", () => {
    expect(getActivityHeatmapDayCounts([], 2026).size).toBe(0);
  });
});

describe("getActivityHeatmapCoverage", () => {
  it("uses elapsed calendar days through today, including today", () => {
    const coverage = getActivityHeatmapCoverage(
      Array.from(
        { length: 28 },
        (_, index) => `2026-01-${String(index + 1).padStart(2, "0")}`,
      ),
      2026,
      "2026-10-31",
    );
    expect(coverage.matchingDays).toBe(28);
    expect(coverage.elapsedDays).toBe(304);
    expect(coverage.percentage).toBeCloseTo(9.210526);
  });

  it("deduplicates overlapping activities and excludes future and other-year dates", () => {
    const dates = getActivityHeatmapDateKeys(
      [
        { studyDate: "2026-01-01", activityTypeId: "reading" },
        { studyDate: "2026-01-01", activityTypeId: "podcast" },
        { studyDate: "2026-10-31", activityTypeId: "reading" },
        { studyDate: "2026-12-31", activityTypeId: "podcast" },
      ],
      ["reading", "podcast"],
      2026,
    );
    expect(dates.size).toBe(3);
    expect(
      getActivityHeatmapCoverage(
        [...dates, "2025-12-31", "2027-01-01", "2026-01-01"],
        2026,
        "2026-10-31",
      ),
    ).toEqual({
      matchingDays: 2,
      elapsedDays: 304,
      percentage: (2 / 304) * 100,
    });
  });

  it("uses the full year for past years, including leap years", () => {
    expect(
      getActivityHeatmapCoverage(["2024-02-29"], 2024, "2026-10-31"),
    ).toEqual({ matchingDays: 1, elapsedDays: 366, percentage: 100 / 366 });
    expect(getActivityHeatmapCoverage([], 2025, "2026-10-31").elapsedDays).toBe(
      365,
    );
  });

  it("shows no percentage before the selected year has started", () => {
    expect(
      getActivityHeatmapCoverage(["2027-01-01"], 2027, "2026-10-31"),
    ).toEqual({ matchingDays: 0, elapsedDays: 0, percentage: null });
  });

  it("handles the first day, empty selections, and full coverage", () => {
    expect(
      getActivityHeatmapCoverage(["2026-01-01"], 2026, "2026-01-01"),
    ).toEqual({ matchingDays: 1, elapsedDays: 1, percentage: 100 });
    expect(getActivityHeatmapCoverage([], 2026, "2026-01-01")).toEqual({
      matchingDays: 0,
      elapsedDays: 1,
      percentage: 0,
    });
  });

  it("counts leap day and daylight-saving boundaries as calendar days", () => {
    expect(getActivityHeatmapCoverage([], 2024, "2024-02-29").elapsedDays).toBe(
      60,
    );
    expect(getActivityHeatmapCoverage([], 2026, "2026-03-29").elapsedDays).toBe(
      88,
    );
    expect(getActivityHeatmapCoverage([], 2026, "2026-10-25").elapsedDays).toBe(
      298,
    );
    expect(getActivityHeatmapCoverage([], 9999, "9999-12-31").elapsedDays).toBe(
      365,
    );
  });
});
