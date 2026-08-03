import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("Phase 3 Vocabulary", () => {
  test.skip(
    !email || !password,
    "Local Supabase E2E credentials are not configured.",
  );

  test("completes vocabulary, batch, navigation, and statistics journeys", async ({
    page,
  }, testInfo) => {
    const suffix = testInfo.project.name;
    const boardName = `Vocabulary ${suffix}`;
    const today = "2026-07-26";
    const firstDate = "2026-07-20";
    const secondDate = "2026-07-21";
    const thirdDate = "2026-07-22";

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email ?? "");
    await page.getByLabel("Password").fill(password ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/settings");
    await page.getByLabel("Add language").fill(boardName);
    await page.getByRole("button", { name: "Add language" }).click();
    const boardLink = page.getByRole("link", { name: boardName });
    await expect(boardLink).toBeVisible();
    const boardHref = await boardLink.getAttribute("href");
    const boardId = boardHref
      ? new URL(boardHref, "http://127.0.0.1:3000").searchParams.get("board")
      : null;
    expect(boardId).toBeTruthy();
    await boardLink.click();

    const vocabularyUrl = (studyDate: string) =>
      `/dashboard?board=${boardId}&date=${studyDate}&today=${today}&tracker=vocabulary`;
    await page.goto(vocabularyUrl(firstDate));
    await expect(page.getByText("New words", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Add word total" }).click();
    await page.getByLabel("Words learned", { exact: true }).fill("7");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const selectedTotalCard = page
      .locator("article")
      .filter({ hasText: "new words learned" });
    await expect(selectedTotalCard).toContainText("7");

    await page.getByRole("button", { name: "Edit vocabulary total" }).click();
    await page.getByLabel("Edit words learned").fill("0");
    await page.getByRole("button", { name: "Update" }).click();
    await expect(selectedTotalCard).toContainText("0");
    await expect(
      page.getByRole("button", {
        name: /Monday, July 20, 2026: 0 words, no new words recorded/,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Add date range" }).click();
    await page.getByLabel("Words learned per empty date").fill("4");
    await page.getByLabel("Start date").fill(firstDate);
    await page.getByLabel("End date").fill(thirdDate);
    await expect(
      page.getByText("3 dates: 2 empty, 1 already saved"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Review range" }).click();
    await expect(
      page.getByRole("heading", { name: "Add totals to 2 empty dates?" }),
    ).toBeVisible();
    await expect(
      page.getByText("1 existing total will be kept unchanged."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Confirm and add" }).click();
    await expect(
      page.getByRole("button", { name: "Add date range" }),
    ).toBeVisible();

    await page.goto(vocabularyUrl(secondDate));
    const totalCard = page
      .locator("article")
      .filter({ hasText: "new words learned" });
    await expect(totalCard).toContainText("4");
    await page.getByRole("button", { name: "Edit vocabulary total" }).click();
    await page.getByLabel("Edit words learned").fill("8");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(totalCard).toContainText("4");

    const statisticsLink = testInfo.project.name.includes("mobile")
      ? page
          .getByRole("navigation", { name: "Mobile primary" })
          .getByRole("link", { name: "Statistics" })
      : page.getByRole("link", { name: "Statistics" });
    await statisticsLink.click();
    await expect(
      page.getByRole("heading", { name: "Learning statistics" }),
    ).toBeVisible();

    const selectedYearSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Selected year" }),
    });
    await expect(
      selectedYearSection
        .locator("article")
        .filter({ hasText: "Total in 2026" })
        .filter({ hasText: "8 words" }),
    ).toContainText("8 words");
    await expect(
      selectedYearSection.getByText("Active days in 2026"),
    ).toBeVisible();

    const currentProgressSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Current progress" }),
    });
    await expect(
      currentProgressSection
        .locator("article")
        .filter({ hasText: "All-time total" }),
    ).toContainText("8 words");
    await expect(
      currentProgressSection
        .locator("article")
        .filter({ hasText: "Current week" })
        .filter({ hasText: "8 words" }),
    ).toBeVisible();
    await expect(
      currentProgressSection
        .locator("article")
        .filter({ hasText: "Current month" })
        .filter({ hasText: "8 words" }),
    ).toBeVisible();

    const wordsChart = page.locator("section").filter({
      has: page.getByRole("heading", { name: "New words distribution" }),
    });
    await wordsChart.getByRole("button", { name: "Day" }).click();
    await expect(wordsChart.getByLabel("Month")).toBeVisible();
    await wordsChart.getByRole("button", { name: "Year" }).click();
    await expect(wordsChart.getByLabel("Month")).toHaveCount(0);

    const vocabularyLink = testInfo.project.name.includes("mobile")
      ? page
          .getByRole("navigation", { name: "Mobile primary" })
          .getByRole("link", { name: "Vocabulary" })
      : page
          .getByRole("navigation", { name: "Primary" })
          .getByRole("link", { name: "Vocabulary" });
    await vocabularyLink.click();
    await expect(page).toHaveURL(/tracker=vocabulary/);
    await expect(page).toHaveURL(new RegExp(`board=${boardId}`));

    await page.goto(vocabularyUrl(secondDate));
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete vocabulary total" }).click();
    await expect(
      page.getByText("No new words learned on this day yet."),
    ).toBeVisible();

    await page.getByLabel("Settings").click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Remove ${boardName}` }).click();
    await expect(
      page.getByRole("button", { name: `Remove ${boardName}` }),
    ).toHaveCount(0);
  });
});
