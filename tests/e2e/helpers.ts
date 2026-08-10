import { expect, type Page } from "@playwright/test";

const testBoardNamePattern =
  /^(?:CEFR|E2E|Vocabulary|Batch) (?:desktop|mobile)-chromium(?: retry \d+)?$/;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function removeSettingsResourceIfPresent(
  page: Page,
  resourceName: string,
) {
  const removeButton = page.getByRole("button", {
    name: `Remove ${resourceName}`,
  });

  if ((await removeButton.count()) === 0) return;

  page.once("dialog", (dialog) => dialog.accept());
  await removeButton.first().click();
  await expect(removeButton).toHaveCount(0, { timeout: 10_000 });
}

export async function createLanguageBoardFromSettings(
  page: Page,
  boardName: string,
) {
  const boardFamily = boardName.replace(/ retry \d+$/, "");
  const cleanupPattern = process.env.CI
    ? testBoardNamePattern
    : new RegExp(`^${escapeRegExp(boardFamily)}(?: retry \\d+)?$`);

  while (true) {
    const staleBoard = page.getByRole("link", { name: cleanupPattern }).first();
    if ((await staleBoard.count()) === 0) break;

    const staleBoardName = (await staleBoard.textContent())?.trim();
    if (!staleBoardName) break;
    await removeSettingsResourceIfPresent(page, staleBoardName);
  }

  await page.getByLabel("Add language").fill(boardName);
  const creationRequest = page
    .waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().includes("/settings"),
      { timeout: 15_000 },
    )
    .catch(() => null);
  await page.getByRole("button", { name: "Add language" }).click();
  await creationRequest;
  await page.reload();

  const boardLink = page.getByRole("link", { name: boardName });
  const errorMessage = await page
    .getByRole("alert")
    .textContent()
    .catch(() => null);
  await expect(
    boardLink,
    `Language board creation failed${errorMessage ? `: ${errorMessage}` : "."}`,
  ).toBeVisible({ timeout: 10_000 });
  return boardLink;
}
