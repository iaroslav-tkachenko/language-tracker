import { describe, expect, it } from "vitest";

import {
  groupActivityDonutRows,
  type ActivityDonutSource,
} from "@/lib/statistics/activity-donut";

function row(id: string, minutes: number, name = id): ActivityDonutSource {
  return { id, minutes, name, systemKey: null };
}

describe("groupActivityDonutRows", () => {
  it("shows every activity when there are fewer than six", () => {
    const result = groupActivityDonutRows([row("Reading", 96), row("Anki", 4)]);

    expect(result.map((item) => item.name)).toEqual(["Reading", "Anki"]);
  });

  it("shows all six activities without Other", () => {
    const result = groupActivityDonutRows(
      Array.from({ length: 6 }, (_, index) =>
        row(`Activity ${index + 1}`, 60 - index),
      ),
    );

    expect(result).toHaveLength(6);
    expect(result.some((item) => item.name === "Other")).toBe(false);
  });

  it("shows the top five and groups the sixth and later activities", () => {
    const result = groupActivityDonutRows(
      Array.from({ length: 9 }, (_, index) =>
        row(`Activity ${index + 1}`, 90 - index),
      ),
    );

    expect(result).toHaveLength(6);
    expect(result.slice(0, 5).map((item) => item.name)).toEqual([
      "Activity 1",
      "Activity 2",
      "Activity 3",
      "Activity 4",
      "Activity 5",
    ]);
    expect(result.at(-1)?.name).toBe("Other");
    expect(result.at(-1)?.items?.map((item) => item.name)).toEqual([
      "Activity 6",
      "Activity 7",
      "Activity 8",
      "Activity 9",
    ]);
  });
});
