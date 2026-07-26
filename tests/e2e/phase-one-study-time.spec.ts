import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("Phase 1 Study Time", () => {
  test.skip(
    !email || !password,
    "Local Supabase E2E credentials are not configured.",
  );

  test("completes the private Study Time lifecycle", async ({
    page,
  }, testInfo) => {
    const suffix = testInfo.project.name;
    const boardName = `E2E ${suffix}`;
    const activityName = `Review ${suffix}`;
    const mobile = testInfo.project.name.includes("mobile");

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
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /^\d{4}$/ })).toBeVisible();

    const primaryNavigation = page.getByRole("navigation", {
      name: mobile ? "Mobile primary" : "Primary",
    });
    await expect(primaryNavigation.getByText("Vocabulary")).toBeVisible();
    await expect(
      primaryNavigation.getByRole("link", { name: "Vocabulary" }),
    ).toHaveAttribute("href", /tracker=vocabulary/);
    const statisticsLink = mobile
      ? primaryNavigation.getByRole("link", { name: "Statistics" })
      : page.getByRole("link", { name: "Statistics" });
    await expect(statisticsLink).toBeVisible();

    if (mobile) {
      await expect(
        page.getByRole("heading", { name: "Jan–Jun" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Jul–Dec" }),
      ).toBeVisible();
    }

    await page.getByRole("button", { name: "Add study session" }).click();
    await page.getByRole("button", { name: "30 min", exact: true }).click();
    await page.getByRole("button", { name: "Reading", exact: true }).click();
    await page.getByRole("button", { name: "Save" }).click();
    const readingCard = page.locator("article").filter({ hasText: "Reading" });
    await expect(readingCard).toContainText("30m");

    await readingCard.getByRole("button", { name: "Edit Reading" }).click();
    await expect(
      page.getByRole("button", { name: "30 min", exact: true }),
    ).toHaveClass(/border-blue-600/);
    await expect(
      page.getByRole("button", { name: "Reading", exact: true }),
    ).toHaveClass(/border-blue-600/);
    await page.getByRole("button", { name: "45 min", exact: true }).click();
    await page.getByRole("button", { name: "Podcast", exact: true }).click();
    await page.getByRole("button", { name: "Update" }).click();

    const podcastCard = page.locator("article").filter({ hasText: "Podcast" });
    await expect(podcastCard).toContainText("45m");
    page.once("dialog", (dialog) => dialog.accept());
    await podcastCard.getByRole("button", { name: "Delete Podcast" }).click();
    await expect(podcastCard).toHaveCount(0);

    await page.getByRole("button", { name: "Add study session" }).click();
    await page.getByRole("button", { name: "15 min", exact: true }).click();
    await page.getByRole("button", { name: "Other", exact: true }).click();
    await page.getByPlaceholder("Custom activity name").fill(activityName);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("button", { name: activityName, exact: true }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.locator("article").filter({ hasText: activityName }),
    ).toContainText("15m");
    await expect(page.getByText("Average / calendar day")).toBeVisible();
    await expect(page.getByText("Average / active day")).toBeVisible();

    await statisticsLink.click();
    await expect(
      page.getByRole("heading", { name: "Study Time statistics" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Selected year" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Current progress" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Activity totals latest 7 days",
      }),
    ).toBeVisible();
    const recentActivitySection = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: "Activity totals latest 7 days",
      }),
    });
    await expect(
      recentActivitySection.getByText("100%", { exact: true }),
    ).toBeVisible();

    await page.getByLabel("Settings").click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Remove ${activityName}` }).click();
    await expect(
      page.getByRole("button", { name: `Remove ${activityName}` }),
    ).toHaveCount(0);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Remove ${boardName}` }).click();
    await expect(
      page.getByRole("button", { name: `Remove ${boardName}` }),
    ).toHaveCount(0);

    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/settings/);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
