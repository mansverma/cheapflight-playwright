import { futureDate } from "../utils/dateHelper.js";

export class FlightSearchPage {
  constructor(page) {
    this.page = page;
  }

  get #isMobile() {
    return (this.page.viewportSize()?.width ?? 1024) < 768;
  }

  async #nativeClick(locator) {
    await locator.evaluate((el) => el.click());
  }

  // Dispatches the full pointer + mouse + click event sequence on the element.
  // The c-ulo-viewport blocks native browser pointer events, but JS-dispatched PointerEvents
  // bypass its capture-phase listener and reach the element's own React handlers.
  async #pointerClick(locator) {
    await locator.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy };
      ["pointerover", "pointerenter", "pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach(
        (type) => el.dispatchEvent(new PointerEvent(type, opts)),
      );
    });
  }

  async #click(locator) {
    if (this.#isMobile) {
      await this.#nativeClick(locator);
    } else {
      await locator.click();
    }
  }

  async goto() {
    await this.page.goto("https://www.cheapflights.com.au/");
    if (this.#isMobile) {
      // Dismiss the "Get more on the app" promo dialog if it appears
      const appDialog = this.page
        .getByRole("dialog")
        .filter({ hasText: "Get more on the app" });
      const closeBtn = appDialog.getByRole("button", { name: "Close" });
      const visible = await closeBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (visible) {
        await closeBtn.evaluate((el) => el.click());
      }
    }
  }

  async selectTripType(type) {
    if (this.#isMobile) {
      // The c-ulo-viewport intercepts native pointer events but not JS-dispatched PointerEvents
      await this.#pointerClick(this.page.getByRole("radio", { name: type }));
      await this.page.waitForTimeout(400);
    } else {
      await this.page.getByLabel("Trip type Return").getByText("Return").click();
      await this.page.getByText(type).click();
    }
  }

  // Types into a desktop autocomplete combobox and picks the first suggestion
  async #fillCombobox(locator, searchText) {
    await locator.selectText();
    await locator.pressSequentially(searchText, { delay: 100 });
    await this.page
      .getByRole("option", { name: searchText, exact: false })
      .first()
      .click();
  }

  // Mobile: origin/destination render as a labelled region with a <div role="button"> trigger.
  // Clicking the trigger (JS click to bypass backdrop) opens a fullscreen overlay that contains
  // a real <input aria-label="Origin/Destination location">. Options in the overlay must be
  // clicked via Playwright's native click (trusted event) to avoid triggering navigation.
  async #fillMobileField(ariaLabel, searchText, index = 0) {
    const container = this.page.locator(`[aria-label="${ariaLabel}"]`).nth(index);
    const trigger = container.locator('[role="button"]').first();
    await trigger.waitFor({ state: "visible" });
    const inputLabel = ariaLabel.includes("origin") ? "Origin location" : "Destination location";
    const searchInput = this.page.locator(`[aria-label="${inputLabel}"]`).last();
    // Retry up to 4 times — parallel tests hitting the same site can cause slow overlay opens
    for (let attempt = 1; attempt <= 4; attempt++) {
      await trigger.evaluate((el) => el.click());
      const appeared = await searchInput.isVisible({ timeout: 8000 }).catch(() => false);
      if (appeared) break;
      if (attempt === 4) throw new Error(`${inputLabel} overlay did not open after 4 attempts`);
      await this.page.waitForTimeout(300);
    }
    await searchInput.fill("");
    await searchInput.pressSequentially(searchText, { delay: 100 });
    // Options are inside the overlay (above the backdrop) — native click fires a trusted event
    await this.page
      .getByRole("option", { name: searchText, exact: false })
      .first()
      .click();
  }

  // clearFirst: clicks "Remove value" when the field is pre-filled on page load (desktop only)
  async setOrigin(searchText, index = 0, clearFirst = false) {
    if (this.#isMobile) {
      await this.#fillMobileField("Flight origin input", searchText, index);
    } else {
      const locator = this.page
        .getByRole("combobox", { name: "Origin location" })
        .nth(index);
      if (clearFirst) {
        await locator.click();
        await this.page.getByRole("button", { name: "Remove value" }).click();
      }
      await this.#fillCombobox(locator, searchText);
    }
  }

  async setDestination(searchText, index = 0) {
    if (this.#isMobile) {
      await this.#fillMobileField("Flight destination input", searchText, index);
    } else {
      const locator = this.page
        .getByRole("combobox", { name: "Destination location" })
        .nth(index);
      await this.#fillCombobox(locator, searchText);
    }
  }

  async openDepartureDatePicker(legIndex = 0) {
    if (this.#isMobile) {
      // evaluate click bypasses the c-ulo-viewport backdrop to open the date picker
      await this.#nativeClick(this.page.getByRole("button", { name: "Select dates" }));
      // Wait for the calendar to render at least one date button before continuing
      await this.page
        .locator('[role="dialog"] [role="button"][aria-label*="2026"]')
        .first()
        .waitFor({ state: "attached", timeout: 10000 });
    } else {
      await this.page
        .getByRole("button", { name: "Departure date" })
        .nth(legIndex)
        .click();
    }
  }

  async selectDate(daysFromNow) {
    if (this.#isMobile) {
      // CDP synthesizeTapGesture selects the date visually in the c-ulo-viewport calendar.
      // "Select this date" is the confirm button outside the viewport that commits the selection.
      await this.#cdpTap(
        this.page.locator(`[aria-label^="${futureDate(daysFromNow)}"]`).first(),
      );
      const confirmBtn = this.page.getByRole("button", { name: "Select this date" });
      await confirmBtn.waitFor({ state: "visible", timeout: 5000 });
      await confirmBtn.evaluate((el) => el.click());
      await this.page.waitForTimeout(400);
    } else {
      await this.page
        .getByRole("button", { name: futureDate(daysFromNow), exact: false })
        .first()
        .click();
    }
  }

  async closeDatePicker() {
    await this.page.keyboard.press("Escape");
  }

  // CDP synthesizeTapGesture: OS-level tap that bypasses c-ulo-viewport pointer interception
  async #cdpTap(locator) {
    await locator.waitFor({ state: "visible", timeout: 15000 });
    const box = await locator.boundingBox();
    if (!box) throw new Error("cdpTap: element has no bounding box");
    const client = await this.page.context().newCDPSession(this.page);
    try {
      await client.send("Input.synthesizeTapGesture", {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        duration: 120,
      });
    } finally {
      await client.detach();
    }
    await this.page.waitForTimeout(300);
  }

  // Opens the passengers panel and increments the adult count
  async incrementAdults(times = 1) {
    if (this.#isMobile) {
      // Mobile shows a "N traveller, Cabin" button — evaluate bypasses the backdrop
      await this.#nativeClick(this.page.getByRole("button", { name: /traveller/i }));
      for (let i = 0; i < times; i++) {
        // Increment is inside the panel modal; #pointerClick bypasses the c-ulo-viewport
        await this.#pointerClick(this.page.getByRole("button", { name: "Increment" }).first());
      }
    } else {
      await this.page.getByRole("spinbutton", { name: "Adults" }).click();
      for (let i = 0; i < times; i++) {
        await this.page.getByRole("button", { name: "Increment" }).first().click();
      }
    }
  }

  // Selects cabin class via the radio button inside the passengers panel
  async setCabinClassRadio(cabin) {
    if (this.#isMobile) {
      await this.#pointerClick(this.page.getByRole("radio", { name: cabin }));
    } else {
      await this.page.getByRole("radio", { name: cabin }).click();
    }
  }

  // Selects cabin class via the Economy dropdown (multi-city layout)
  async setCabinClassDropdown(cabin) {
    await this.#click(this.page.getByText("Economy").first());
    await this.#click(this.page.getByText(cabin));
  }

  async search() {
    await this.#click(
      this.page.getByRole("button", { name: "Search", exact: true }),
    );
  }
}
