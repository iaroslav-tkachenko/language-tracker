import { expect, test } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL;
const password = process.env.E2E_USER_PASSWORD;

test.describe("PWA installation", () => {
  test("publishes a complete manifest and approved icon assets", async ({
    request,
  }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain(
      "application/manifest+json",
    );
    const manifest = await response.json();
    expect(manifest).toMatchObject({
      name: "Language Tracker",
      start_url: "/",
      display: "standalone",
    });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ]),
    );

    for (const path of manifest.icons.map(
      (icon: { src: string }) => icon.src,
    )) {
      const iconResponse = await request.get(path);
      expect(iconResponse.ok()).toBeTruthy();
      expect(iconResponse.headers()["content-type"]).toContain("image/png");
    }
  });

  test("keeps the installation page public, responsive, and useful without a prompt", async ({
    page,
  }) => {
    await page.goto("/install");
    await expect(page).toHaveURL(/\/install$/);
    await expect(
      page.getByRole("heading", {
        name: "Install Language Tracker",
      }),
    ).toBeVisible();
    await expect(page.getByText("Internet connection required")).toBeVisible();
    await expect(
      page.getByText(/browser menu|not available in this browser/),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test("handles the browser install event deterministically", async ({
    page,
  }) => {
    await page.goto("/install");
    await expect(
      page.getByText(/browser menu|not available in this browser/),
    ).toBeVisible();
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt") as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: "accepted" }>;
      };
      event.prompt = async () => undefined;
      event.userChoice = Promise.resolve({ outcome: "accepted" });
      window.dispatchEvent(event);
    });
    await page.getByRole("button", { name: "Install app" }).click();
    await expect(page.getByText("Language Tracker is installed")).toBeVisible();
  });

  test("keeps private application routes protected", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/(sign-in|demo)/);
  });

  test("shows the shared installation card in Settings", async ({ page }) => {
    test.skip(
      !email || !password,
      "Local Supabase E2E credentials are not configured.",
    );
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email ?? "");
    await page.getByLabel("Password").fill(password ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", {
        name: /Install Language Tracker|Language Tracker is installed/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Installation help" }),
    ).toHaveAttribute("href", "/install");
  });
});
