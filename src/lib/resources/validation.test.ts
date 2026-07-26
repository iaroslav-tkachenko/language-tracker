import { describe, expect, it } from "vitest";

import {
  getInclusiveDateCount,
  resourceNameSchema,
  studyEntryBatchSchema,
  studyEntrySchema,
  studyEntryUpdateSchema,
} from "@/lib/resources/validation";

describe("resourceNameSchema", () => {
  it("trims valid names", () => {
    expect(resourceNameSchema.parse("  German  ")).toBe("German");
  });

  it("rejects empty names", () => {
    expect(resourceNameSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects names longer than 50 characters", () => {
    expect(resourceNameSchema.safeParse("a".repeat(51)).success).toBe(false);
  });
});

describe("studyEntryUpdateSchema", () => {
  it("rejects an invalid entry identity", () => {
    expect(
      studyEntryUpdateSchema.safeParse({
        entryId: "not-a-uuid",
        activityTypeId: "20000000-0000-4000-8000-000000000001",
        durationMinutes: 30,
      }).success,
    ).toBe(false);
  });
});

describe("studyEntrySchema", () => {
  const validEntry = {
    boardId: "10000000-0000-4000-8000-000000000001",
    activityTypeId: "20000000-0000-4000-8000-000000000001",
    studyDate: "2026-07-25",
    durationMinutes: "30",
  };

  it("parses a valid form payload", () => {
    expect(studyEntrySchema.parse(validEntry).durationMinutes).toBe(30);
  });

  it.each([0, 1441, 1.5])("rejects invalid duration %s", (duration) => {
    expect(
      studyEntrySchema.safeParse({
        ...validEntry,
        durationMinutes: duration,
      }).success,
    ).toBe(false);
  });
});

describe("studyEntryBatchSchema", () => {
  const validBatch = {
    operationId: "30000000-0000-4000-8000-000000000001",
    boardId: "10000000-0000-4000-8000-000000000001",
    activityTypeId: "20000000-0000-4000-8000-000000000001",
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    durationMinutes: "30",
  };

  it("accepts an inclusive range within one year", () => {
    expect(studyEntryBatchSchema.parse(validBatch).durationMinutes).toBe(30);
    expect(getInclusiveDateCount("2026-07-01", "2026-07-31")).toBe(31);
  });

  it("accepts all 366 dates in a leap year", () => {
    expect(
      studyEntryBatchSchema.safeParse({
        ...validBatch,
        startDate: "2028-01-01",
        endDate: "2028-12-31",
      }).success,
    ).toBe(true);
  });

  it.each([
    ["2026-07-31", "2026-07-01"],
    ["2026-12-31", "2027-01-01"],
    ["2026-02-30", "2026-03-01"],
  ])("rejects invalid range %s through %s", (startDate, endDate) => {
    expect(
      studyEntryBatchSchema.safeParse({
        ...validBatch,
        startDate,
        endDate,
      }).success,
    ).toBe(false);
  });
});
