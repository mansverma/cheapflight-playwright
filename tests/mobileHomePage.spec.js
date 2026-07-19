import { test, expect, devices } from "@playwright/test";
import { HomePage } from "../pages/HomePage.js";

test.use({ ...devices["Pixel 5"] });

test.describe("Homepage - Mobile", () => {
  let homePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("Logo is visible on mobile viewport", async () => {
    await expect(homePage.logo).toBeVisible();
  });

  test("Sign in button is visible on mobile viewport", async () => {
    await expect(homePage.signInButton).toBeVisible();
  });

  test("Login modal opens on mobile via native click", async () => {
    await homePage.clickSignIn();
    await expect(homePage.loginModal).toHaveAttribute("aria-modal", "true", {
      timeout: 10000,
    });
  });

  test("Origin and destination inputs are visible on mobile", async ({
    page,
  }) => {
    // Mobile renders these as <div role="button"> inside named regions (not <button> tags)
    await expect(
      page.locator('[aria-label="Flight origin input"] [role="button"]').first(),
    ).toBeVisible();
    await expect(
      page.locator('[aria-label="Flight destination input"] [role="button"]').first(),
    ).toBeVisible();
  });

  test("Trip type selector is visible on mobile", async ({ page }) => {
    // Mobile uses a radiogroup labelled "Trip type" (not "Trip type Return")
    await expect(page.getByRole("radiogroup", { name: "Trip type" })).toBeVisible();
  });

  test("Search button is visible on mobile", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Search", exact: true }),
    ).toBeVisible();
  });
});
