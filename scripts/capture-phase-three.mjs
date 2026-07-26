import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDirectory = join(projectRoot, "docs", "design", "phase-3");
const previewUrl = "http://localhost:3000/vocabulary-preview";

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();

const desktop = await browser.newPage({
  viewport: { width: 1366, height: 768 },
  deviceScaleFactor: 1,
});
await desktop.goto(previewUrl, { waitUntil: "domcontentloaded" });
await desktop.getByRole("heading", { name: "2026" }).waitFor();
await desktop.screenshot({
  path: join(outputDirectory, "vocabulary-desktop-full.png"),
  fullPage: true,
});

const mobile = await browser.newPage({
  viewport: { width: 412, height: 915 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
await mobile.goto(previewUrl, { waitUntil: "domcontentloaded" });
await mobile.getByRole("heading", { name: "2026" }).waitFor();
await mobile.screenshot({
  path: join(outputDirectory, "vocabulary-mobile-full.png"),
  fullPage: true,
});
await mobile.waitForTimeout(1_000);
await mobile.locator("summary").click();
await mobile.getByRole("button", { name: "Italian" }).click();
await mobile.getByText("No new words learned on this day yet.").waitFor();
await mobile.screenshot({
  path: join(outputDirectory, "vocabulary-mobile-empty.png"),
  fullPage: true,
});
await mobile.getByRole("button", { name: "Add word total" }).click();
await mobile.locator('input[name="wordsLearned"]').fill("0");
await mobile.getByRole("button", { name: "Save", exact: true }).click();
await mobile.locator("article strong").waitFor();
await mobile.screenshot({
  path: join(outputDirectory, "vocabulary-mobile-first-zero.png"),
  fullPage: true,
});
await mobile.locator("summary").click();
await mobile.getByRole("button", { name: "German" }).click();
await mobile.getByRole("button", { name: "Edit vocabulary total" }).click();
await mobile.locator('input[name="wordsLearned"]').scrollIntoViewIfNeeded();
await mobile.screenshot({
  path: join(outputDirectory, "vocabulary-mobile-edit.png"),
  fullPage: true,
});
await mobile.locator('input[name="wordsLearned"]').fill("0");
await mobile.getByRole("button", { name: "Update" }).click();
await mobile.locator("article strong").waitFor();
if ((await mobile.locator("article strong").textContent())?.trim() !== "0") {
  throw new Error("Editing a vocabulary total to zero did not persist.");
}
await mobile.screenshot({
  path: join(outputDirectory, "vocabulary-mobile-zero.png"),
  fullPage: true,
});

await mobile.getByRole("button", { name: "Next day" }).click();
await mobile.getByRole("button", { name: "Add word total" }).click();
await mobile.locator('input[name="wordsLearned"]').fill("6");
await mobile.getByRole("button", { name: "Save", exact: true }).click();
await mobile.getByText("6", { exact: true }).waitFor();

mobile.once("dialog", (dialog) => dialog.accept());
await mobile.getByRole("button", { name: "Delete vocabulary total" }).click();
await mobile.getByText("No new words learned on this day yet.").waitFor();

await mobile.getByRole("button", { name: "Add date range" }).click();
await mobile.getByLabel("Words learned per empty date").fill("4");
await mobile.getByLabel("Start date").fill("2026-07-24");
await mobile.getByLabel("End date").fill("2026-07-28");
await mobile.getByRole("button", { name: "Review range" }).click();
await mobile.getByText("3 existing totals will be kept unchanged.").waitFor();
await mobile.screenshot({
  path: join(outputDirectory, "vocabulary-mobile-range-review.png"),
  fullPage: true,
});
await mobile.getByRole("button", { name: "Confirm and add" }).click();
await mobile.locator("article strong").waitFor();
if ((await mobile.locator("article strong").textContent())?.trim() !== "4") {
  throw new Error("Vocabulary range did not fill the selected empty date.");
}

await browser.close();
