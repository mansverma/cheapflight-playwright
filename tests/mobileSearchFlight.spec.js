import { test, expect, devices } from "@playwright/test";
import { FlightSearchPage } from "../pages/FlightSearchPage.js";

test.use({ ...devices["Pixel 5"] });

// Run serially to avoid rate-limiting when multiple mobile browsers hit the site in parallel
test.describe.configure({ mode: "serial" });

test.describe("Search Flight - Mobile", () => {
  test("Return trip search on mobile", async ({ page }) => {
    const searchPage = new FlightSearchPage(page);

    await searchPage.goto();
    await searchPage.setOrigin("Melbourne", 0, true);
    await searchPage.setDestination("Perth");
    await searchPage.openDepartureDatePicker();
    await searchPage.selectDate(30);
    await searchPage.selectDate(33);
    await searchPage.closeDatePicker();
    await searchPage.incrementAdults(1);
    await searchPage.setCabinClassRadio("Business");

    // Start listening for navigation before clicking so we don't miss it
    const navPromise = page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 });
    await searchPage.search();
    await navPromise;

    expect(page.url()).toMatch(/MEL|flight-search/);
    expect(page.url()).toMatch(/PER/);
  });

  test("One-way trip search on mobile", async ({ page }) => {
    const searchPage = new FlightSearchPage(page);

    await searchPage.goto();
    await searchPage.selectTripType("One-way");
    await searchPage.setOrigin("Sydney", 0, true);
    await searchPage.setDestination("Brisbane");
    await searchPage.openDepartureDatePicker();
    await searchPage.selectDate(30);

    // Start listening for navigation before clicking so we don't miss it.
    // Mobile may pass through a bot-detection page (security/check) that stalls the load event;
    // domcontentloaded fires before the stalling JS runs.
    const navPromise = page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 });
    await searchPage.search();
    await navPromise;

    expect(page.url()).toMatch(/SYD/);
    expect(page.url()).toMatch(/BNE/);
  });

  test("Negative: search without destination on mobile", async ({ page }) => {
    const searchPage = new FlightSearchPage(page);

    await searchPage.goto();
    await searchPage.setOrigin("Melbourne", 0, true);
    await searchPage.search();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Please enter a 'To' airport");
  });

  test("Negative: special characters in destination field on mobile", async ({
    page,
  }) => {
    const searchPage = new FlightSearchPage(page);

    await searchPage.goto();
    await searchPage.setOrigin("Melbourne", 0, true);
    // Open destination overlay via JS click to bypass the c-ulo-viewport backdrop
    await page
      .locator('[aria-label="Flight destination input"] [role="button"]')
      .first()
      .evaluate((el) => el.click());
    const destInput = page
      .locator('[aria-label="Destination location"]')
      .last();
    await destInput.waitFor({ state: "visible", timeout: 8000 });
    await destInput.pressSequentially("##$%123", { delay: 80 });

    // Mobile doesn't show "No matching locations found." — the overlay drops all city
    // suggestions and shows only the generic "Anywhere" option when nothing matches.
    const destOverlay = page.getByRole("dialog").filter({ hasText: "To where?" });
    await expect(destOverlay.getByRole("option")).toHaveCount(1, { timeout: 8000 });
    await expect(destOverlay.getByRole("option").first()).toHaveText("Anywhere");
  });
});
