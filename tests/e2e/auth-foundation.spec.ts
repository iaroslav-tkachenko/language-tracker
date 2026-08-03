import { expect, test } from "@playwright/test";

test.describe("authentication foundation", () => {
  test("exposes the sign-in and recovery navigation", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/forgot-password");
    await expect(
      page.getByRole("link", { name: "Create account" }),
    ).toHaveAttribute("href", "/sign-up");
  });

  test("shows accessible validation errors", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill("invalid-email");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Check the highlighted fields" }),
    ).toBeVisible();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(
      page.getByText("Password must contain at least 8 characters."),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  test("exposes sign-up and password-reset forms", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();

    await page.goto("/forgot-password");
    await expect(
      page.getByRole("heading", { name: "Reset your password" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send recovery link" }),
    ).toBeVisible();
  });

  test("shows recoverable authentication-link errors", async ({ page }) => {
    await page.goto("/sign-in?error=confirmation");

    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "This confirmation link is invalid or expired." }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});
