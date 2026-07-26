import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("Phase 2 date-range sessions", () => {
  test.skip(
    !email || !password,
    "Local Supabase E2E credentials are not configured.",
  );

  test("reviews and creates independent sessions without replacing matches", async ({
    page,
  }, testInfo) => {
    const suffix = testInfo.project.name;
    const boardName = `Batch ${suffix}`;
    const startDate = "2026-07-20";
    const endDate = "2026-07-22";

    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email ?? "");
    await page.getByLabel("Password").fill(password ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto("/settings");
    await page.getByLabel("Add language").fill(boardName);
    await page.getByRole("button", { name: "Add language" }).click();
    await expect(page.getByRole("status")).toContainText(
      `${boardName} is ready.`,
    );
    await page.reload();
    await page.getByRole("link", { name: boardName }).click();

    async function createRange() {
      await page.getByRole("button", { name: "Add study session" }).click();
      await page.getByRole("button", { name: "Date range" }).click();
      await page.getByRole("button", { name: "30 min", exact: true }).click();
      await page.getByLabel("Start date").fill(startDate);
      await page.getByLabel("End date").fill(endDate);
      await page.getByRole("button", { name: "Reading", exact: true }).click();
      await expect(page.getByText("3 dates selected")).toBeVisible();
      await page.getByRole("button", { name: "Review range" }).click();
      await expect(
        page.getByRole("heading", { name: "Add 3 study sessions?" }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Existing sessions, including matching ones, will be kept.",
        ),
      ).toBeVisible();
      await page.getByRole("button", { name: "Confirm and add" }).click();
      await expect(
        page.getByRole("button", { name: "Add study session" }),
      ).toBeVisible();
    }

    await createRange();
    await page
      .getByRole("button", {
        name: /Monday, July 20, 2026: 30 minutes/,
      })
      .click();
    await expect(
      page.locator("article").filter({ hasText: "Reading" }),
    ).toHaveCount(1);

    await createRange();
    await page
      .getByRole("button", {
        name: /Monday, July 20, 2026: 60 minutes/,
      })
      .click();
    const matchingCards = page
      .locator("article")
      .filter({ hasText: "Reading" });
    await expect(matchingCards).toHaveCount(2);
    await expect(matchingCards.nth(0)).toContainText("30m");
    await expect(matchingCards.nth(1)).toContainText("30m");

    await page.getByLabel("Settings").click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Remove ${boardName}` }).click();
    await expect(
      page.getByRole("button", { name: `Remove ${boardName}` }),
    ).toHaveCount(0);
  });
});
