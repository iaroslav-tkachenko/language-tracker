import { describe, expect, it } from "vitest";

import {
  resourceNameSchema,
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
