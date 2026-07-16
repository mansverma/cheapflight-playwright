export class HomePage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("https://www.cheapflights.com.au/");
  }

  get logo() {
    return this.page.getByRole("link", { name: "Go to the cheapflights homepage" });
  }

  get signInButton() {
    return this.page.getByRole("button", { name: "Sign in" });
  }

  async clickSignIn() {
    const isMobile = (this.page.viewportSize()?.width ?? 1024) < 768;
    if (isMobile) {
      // c-ulo-viewport backdrop permanently intercepts pointer/touch events on mobile.
      // Dispatch a native DOM click directly on the element to bypass it.
      await this.signInButton.evaluate((el) => el.click());
    } else {
      await this.signInButton.click();
    }
  }

  get loginModal() {
    return this.page.getByRole("dialog", { name: "Sign in or create an account" });
  }
}
