import { test, expect } from "@playwright/test";
import { FlightSearchPage } from "../pages/FlightSearchPage.js";
import { slashDate } from "../utils/dateHelper.js";

test("Test for Return trip", async ({ page }) => {
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

  // Assert search form values before submitting
  await expect(
    page.getByRole("combobox", { name: "Origin location" }).first(),
  ).toHaveAttribute("data-test-origin", "MEL");
  await expect(
    page.getByRole("combobox", { name: "Destination location" }).first(),
  ).toHaveAttribute("data-test-destination", "PER");

  await searchPage.search();

  await expect(page).toHaveURL(/flight-search\/MEL-PER\//);

  // Wait for result items — return trips don't use .hYzH-price
  const resultItems = page.getByRole("group", { name: /Result item/i });
  await resultItems.first().waitFor({ state: "visible", timeout: 60000 });

  // Origin and destination shown in the results page search bar
  await expect(
    page.getByRole("button", { name: /Flight origin input Melbourne/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Flight destination input Perth/i }),
  ).toBeVisible();

  // Departure date shown in the results page search bar (format: "D/M")
  await expect(
    page.getByRole("button", { name: /Departure date/i }),
  ).toContainText(slashDate(30));

  // Cabin class label per result row — .Hy6H is the cabin span inside each result
  const count = await resultItems.count();
  for (let i = 0; i < count; i++) {
    await expect(resultItems.nth(i).locator(".Hy6H")).toContainText("Business");
  }
});

test("Test for single trip", async ({ page }) => {
  const searchPage = new FlightSearchPage(page);

  await searchPage.goto();
  await searchPage.selectTripType("One-way");
  await searchPage.setOrigin("Sydney", 0, true);
  await searchPage.setDestination("Brisbane");
  await searchPage.selectDate(30);
  await searchPage.search();

  await expect(page).toHaveURL(/flight-search\/SYD-BNE\//);
});

test("Test for multi trip", async ({ page }) => {
  const searchPage = new FlightSearchPage(page);

  await searchPage.goto();
  await searchPage.selectTripType("Multi-city");

  // Leg 1: Sydney → Melbourne
  await searchPage.setOrigin("Sydney");
  await searchPage.setDestination("Melbourne");
  await searchPage.openDepartureDatePicker(0);
  await searchPage.selectDate(30);
  await searchPage.closeDatePicker();
  await searchPage.setCabinClassDropdown("Premium Economy");

  // Leg 2: Melbourne → Darwin
  await searchPage.setOrigin("Melbourne", 1);
  await searchPage.setDestination("Darwin", 1);
  await searchPage.openDepartureDatePicker(1);
  await searchPage.selectDate(37);
  await searchPage.closeDatePicker();

  // Leg 3: Darwin → Bali
  await searchPage.setOrigin("Darwin", 2);
  await searchPage.setDestination("Bali", 2);
  await searchPage.openDepartureDatePicker(2);
  await searchPage.selectDate(44);
  await searchPage.closeDatePicker();

  await searchPage.search();
  await expect(page).toHaveURL(
    /flight-search\/SYD-MEL\/.*\/MEL-DRW\/.*\/DRW-DPS\//,
  );
});
test("Negative: search without destination does not navigate to results", async ({
  page,
}) => {
  const searchPage = new FlightSearchPage(page);

  await searchPage.goto();
  await searchPage.setOrigin("Melbourne", 0, true);
  // No destination set — search should be blocked by validation
  await searchPage.search();

  await expect(
    page.getByText("An error occurred while trying to perform your search", {
      exact: true,
    }),
  ).toBeVisible();
});

test("Negative: Enter special characters in destination field", async ({
  page,
}) => {
  const searchPage = new FlightSearchPage(page);

  await searchPage.goto();
  const destinationInput = page
    .getByRole("combobox", { name: "Destination location" })
    .first();
  await destinationInput.pressSequentially("##$%123", { delay: 80 });

  await expect(page.getByText("No matching locations found.")).toBeVisible({
    timeout: 10000,
  });
});
