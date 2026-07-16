import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage.js";

test.describe("Homepage UI validation", () => {
  let homePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test("Logo is displayed", async () => {
    await expect(homePage.logo).toBeVisible();
  });

  test("Sign in button is displayed", async () => {
    await expect(homePage.signInButton).toBeVisible();
  });

  test("Login modal opens after clicking Sign in", async () => {
    await homePage.clickSignIn();
    // The modal uses CSS visibility transitions — assert on the aria attribute
    // which is set immediately when the modal is created in the DOM
    await expect(homePage.loginModal).toHaveAttribute("aria-modal", "true", { timeout: 10000 });
  });
});
