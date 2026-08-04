import { expect, type Page } from "@playwright/test";

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
  await removeSettingsResourceIfPresent(page, boardName);

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
  await expect(boardLink).toBeVisible({ timeout: 10_000 });
  return boardLink;
}
