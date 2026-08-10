import { expect, test } from "@playwright/test";

const storageKey = "language-tracker-theme";

test.describe("theme preference", () => {
  test("uses and follows the system theme by default", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/sign-in");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "system");

    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("restores an explicit light or dark choice", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/sign-in");
    await page.evaluate(
      ({ key }) => window.localStorage.setItem(key, "light"),
      { key: storageKey },
    );
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.evaluate(({ key }) => window.localStorage.setItem(key, "dark"), {
      key: storageKey,
    });
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("uses the dark heatmap palette and subdued table borders", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key }) => window.localStorage.setItem(key, "dark"),
      { key: storageKey },
    );
    await page.goto("/sign-in");

    const colors = await page.evaluate(() => {
      const rootStyles = getComputedStyle(document.documentElement);
      const heatmapCell = document.createElement("span");
      heatmapCell.className = "heatmap-cell border border-white";
      document.body.append(heatmapCell);

      const table = document.createElement("div");
      table.className = "border border-white/70";
      document.body.append(table);

      return {
        studyStart: rootStyles.getPropertyValue("--study-heat-1").trim(),
        studyEnd: rootStyles.getPropertyValue("--study-heat-6").trim(),
        vocabularyStart: rootStyles
          .getPropertyValue("--vocabulary-heat-1")
          .trim(),
        vocabularyEnd: rootStyles
          .getPropertyValue("--vocabulary-heat-7")
          .trim(),
        heatmapBorder: getComputedStyle(heatmapCell).borderTopColor,
        tableBorder: getComputedStyle(table).borderTopColor,
      };
    });

    expect(colors).toEqual({
      studyStart: "#172554",
      studyEnd: "#60a5fa",
      vocabularyStart: "#123b38",
      vocabularyEnd: "#34d399",
      heatmapBorder: "rgba(0, 0, 0, 0)",
      tableBorder: "rgb(52, 66, 85)",
    });
  });
});
