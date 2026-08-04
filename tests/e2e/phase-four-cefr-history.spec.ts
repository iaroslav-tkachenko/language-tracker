import { expect, test } from "@playwright/test";

import { createLanguageBoardFromSettings } from "./helpers";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("Phase 4C CEFR history", () => {
  test.skip(
    !email || !password,
    "Local Supabase E2E credentials are not configured.",
  );

  test("creates, edits, rejects conflicts, deletes, and navigates CEFR history", async ({
    page,
  }, testInfo) => {
    const boardName = `CEFR ${testInfo.project.name}`;
    const today = "2026-08-03";
    const chooseLevel = async (level: string) => {
      const dialog = page.getByRole("dialog");
      await dialog
        .locator("label")
        .filter({
          has: dialog.locator(`input[name="level"][value="${level}"]`),
        })
        .click();
    };

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

    await page.goto(`/cefr?board=${boardId}&today=${today}`);
    await expect(
      page.getByRole("heading", { name: "Your language level" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Set your current level" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Set current level" }).click();
    await chooseLevel("A0");
    await page.getByLabel("Date this level started").fill("2026-01-01");
    await page.getByRole("button", { name: "Add level update" }).click();
    await expect(
      page.getByRole("heading", { name: "Level A0 - Absolute zero" }),
    ).toBeVisible();
    await expect(page.getByText("Since January 1, 2026")).toBeVisible();

    await page.getByRole("button", { name: "Add update" }).click();
    await chooseLevel("B1");
    await page.getByLabel("Date this level started").fill("2026-07-12");
    await page.getByRole("button", { name: "Add level update" }).click();
    await expect(page.getByRole("heading", { name: "Level B1" })).toBeVisible();
    await expect(page.getByText("Since July 12, 2026")).toBeVisible();
    await expect(page.getByText("From January 1, 2026")).toBeVisible();

    await page.getByRole("button", { name: "Edit" }).first().click();
    await chooseLevel("B2");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("heading", { name: "Level B2" })).toBeVisible();
    await expect(page.getByText("Since July 12, 2026")).toBeVisible();

    await page.getByRole("button", { name: "Add update" }).click();
    await chooseLevel("A2");
    await page.getByLabel("Date this level started").fill("2026-07-12");
    await page.getByRole("button", { name: "Add level update" }).click();
    await expect(
      page
        .getByRole("alert")
        .getByText("A level update already exists for this date."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).first().click();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).first().click();
    await expect(
      page.getByRole("heading", { name: "Level A0 - Absolute zero" }),
    ).toBeVisible();
    await expect(page.getByText("Since January 1, 2026")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(
      page.getByRole("heading", { name: "Set your current level" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Study Time" }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.getByRole("link", { name: "Level" }).first().click();
    await expect(page).toHaveURL(/\/cefr/);

    await page.goto("/settings");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Remove ${boardName}` }).click();
    await expect(
      page.getByRole("button", { name: `Remove ${boardName}` }),
    ).toHaveCount(0);
  });
});
