import { futureDate } from "../utils/dateHelper.js";

export class FlightSearchPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("https://www.cheapflights.com.au/");
  }

  async selectTripType(type) {
    await this.page.getByLabel("Trip type Return").getByText("Return").click();
    await this.page.getByText(type).click();
  }

  // Types into an autocomplete combobox and picks the first matching suggestion
  async #fillCombobox(locator, searchText) {
    await locator.selectText();
    await locator.pressSequentially(searchText, { delay: 100 });
    await this.page
      .getByRole("option", { name: searchText, exact: false })
      .first()
      .click();
  }

  // clearFirst: clicks "Remove value" when the field is pre-filled on page load
  async setOrigin(searchText, index = 0, clearFirst = false) {
    const locator = this.page
      .getByRole("combobox", { name: "Origin location" })
      .nth(index);
    if (clearFirst) {
      await locator.click();
      await this.page.getByRole("button", { name: "Remove value" }).click();
    }
    await this.#fillCombobox(locator, searchText);
  }

  async setDestination(searchText, index = 0) {
    const locator = this.page
      .getByRole("combobox", { name: "Destination location" })
      .nth(index);
    await this.#fillCombobox(locator, searchText);
  }

  async openDepartureDatePicker(legIndex = 0) {
    await this.page
      .getByRole("button", { name: "Departure date" })
      .nth(legIndex)
      .click();
  }

  async selectDate(daysFromNow) {
    await this.page
      .getByRole("button", { name: futureDate(daysFromNow), exact: false })
      .click();
  }

  async closeDatePicker() {
    await this.page.keyboard.press("Escape");
  }

  // Opens the passengers panel and increments the adult count
  async incrementAdults(times = 1) {
    await this.page.getByRole("spinbutton", { name: "Adults" }).click();
    for (let i = 0; i < times; i++) {
      await this.page.getByRole("button", { name: "Increment" }).first().click();
    }
  }

  // Selects cabin class via the radio button inside the passengers panel
  async setCabinClassRadio(cabin) {
    await this.page.getByRole("radio", { name: cabin }).click();
  }

  // Selects cabin class via the Economy dropdown (multi-city layout)
  async setCabinClassDropdown(cabin) {
    await this.page.getByText("Economy").first().click();
    await this.page.getByText(cabin).click();
  }

  async search() {
    await this.page.getByRole("button", { name: "Search", exact: true }).click();
  }
}
