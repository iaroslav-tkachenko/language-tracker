import { expect, test } from "@playwright/test";

import { createLanguageBoardFromSettings } from "./helpers";

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
    const suffix = `${testInfo.project.name} retry ${testInfo.retry}`;
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
    const boardLink = await createLanguageBoardFromSettings(page, boardName);
    const boardHref = await boardLink.getAttribute("href");
    const boardId = boardHref
      ? new URL(boardHref, "http://127.0.0.1:3000").searchParams.get("board")
      : null;
    expect(boardId).toBeTruthy();
    await boardLink.click();

    const vocabularyUrl = (studyDate: string) =>
      `/dashboard?board=${boardId}&date=${studyDate}&today=${today}&tracker=vocabulary`;
    await page.goto(vocabularyUrl(firstDate));
    await expect(
      page.getByText("Words learned", { exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Add words" }).click();
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

    await page.getByRole("button", { name: "Add words" }).click();
    await page.getByRole("button", { name: "Date range" }).click();
    await page.getByLabel("Words learned per date").fill("4");
    await page.getByLabel("Start date").fill(firstDate);
    await page.getByLabel("End date").fill(thirdDate);
    await expect(
      page.getByText("3 dates: 2 empty, 1 already saved"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Review range" }).click();
    await expect(
      page.getByRole("heading", { name: "Save totals for 3 dates?" }),
    ).toBeVisible();
    await expect(
      page.getByText("1 already saved date will be overwritten"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Confirm and add" }).click();
    await expect(page.getByRole("button", { name: "Add words" })).toBeVisible();

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
    await page.goto(`/statistics?board=${boardId}&year=2026&today=${today}`);
    await expect(
      page.getByRole("heading", { name: "Your learning overview" }),
    ).toBeVisible();

    const recordsSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Personal Records", exact: true }),
    });
    await expect(
      recordsSection.getByRole("row", { name: /Best Day/ }),
    ).toContainText(/4\s*words[\s\S]*July 22, 2026/);
    await expect(
      recordsSection.getByRole("row", { name: /Best Week/ }),
    ).toContainText(/12\s*words[\s\S]*Jul 20–26, 2026/);
    await expect(
      recordsSection.getByRole("row", { name: /Best Month/ }),
    ).toContainText(/12\s*words[\s\S]*July 2026/);

    const selectedYearSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Selected year" }),
    });
    const selectedYearVocabulary = selectedYearSection
      .locator("div")
      .filter({
        has: page.getByRole("heading", { name: "Vocabulary" }),
      })
      .first();
    await expect(
      selectedYearVocabulary
        .locator("article")
        .filter({ hasText: "Total in 2026" })
        .first(),
    ).toContainText(/12\s*words/);
    await expect(
      selectedYearSection.getByText("Active days in 2026"),
    ).toBeVisible();

    const currentProgressSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Current progress" }),
    });
    expect(
      await recordsSection.evaluate(
        (records, currentProgress) =>
          Boolean(
            currentProgress &&
            records.compareDocumentPosition(currentProgress) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        await currentProgressSection.elementHandle(),
      ),
    ).toBe(true);
    const currentVocabulary = currentProgressSection
      .getByRole("heading", { name: "Vocabulary", exact: true })
      .locator("xpath=parent::div");
    await expect(
      currentVocabulary.locator("article").filter({
        hasText: "Current streak",
      }),
    ).toContainText(/0\s*days/);
    await expect(
      currentVocabulary.locator("article").filter({
        hasText: "Longest streak",
      }),
    ).toContainText(/3\s*days/);
    await expect(
      currentVocabulary.locator("article").filter({ hasText: "Today" }),
    ).toContainText(/0\s*words/);
    await expect(
      currentVocabulary
        .locator("article")
        .filter({ hasText: "Current week" })
        .filter({ hasText: /12\s*words/ }),
    ).toBeVisible();
    await expect(
      currentVocabulary
        .locator("article")
        .filter({ hasText: "Current month" })
        .filter({ hasText: /12\s*words/ }),
    ).toBeVisible();

    const wordsChart = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Vocabulary distribution" }),
    });
    await wordsChart.getByRole("button", { name: "Day" }).click();
    await expect(wordsChart.getByLabel("Month")).toBeVisible();
    await wordsChart.getByRole("button", { name: "Year" }).click();
    await expect(wordsChart.getByLabel("Month")).toHaveCount(0);
    const activityTotals = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: "Activity totals in 2026",
      }),
    });
    await expect(
      await wordsChart.evaluate(
        (chart, summary) =>
          Boolean(
            summary &&
            chart.compareDocumentPosition(summary) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        await selectedYearSection.elementHandle(),
      ),
    ).toBe(true);
    await expect(
      await selectedYearSection.evaluate(
        (summary, totals) =>
          Boolean(
            totals &&
            summary.compareDocumentPosition(totals) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        await activityTotals.elementHandle(),
      ),
    ).toBe(true);

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
    await expect(page.getByText("No new words yet")).toBeVisible();

    await page.getByLabel("Settings").click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Remove ${boardName}` }).click();
    await expect(
      page.getByRole("button", { name: `Remove ${boardName}` }),
    ).toHaveCount(0);
  });
});
