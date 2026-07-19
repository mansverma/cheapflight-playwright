# Cheapflight Playwright Test Suite

Automated UI and API tests for [cheapflights.com.au](https://www.cheapflights.com.au/) and the [Restful Booker API](https://restful-booker.herokuapp.com/apidoc/index.html).

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

## Installation

```bash
npm install
npx playwright install chromium
```

## Project Structure

```
├── pages/
│   ├── FlightSearchPage.js      # Search form interactions (desktop + mobile)
│   └── HomePage.js              # Homepage interactions
├── tests/
│   ├── searchFlight.spec.js     # UI tests — desktop flight search flows
│   ├── homePage.spec.js         # UI tests — desktop homepage validation
│   ├── mobileSearchFlight.spec.js  # UI tests — mobile flight search flows
│   ├── mobileHomePage.spec.js   # UI tests — mobile homepage validation
│   └── apiTests.spec.js         # API tests — Booking endpoints
├── utils/
│   └── dateHelper.js            # Date formatting helpers
└── playwright.config.js         # Playwright configuration
```

## Running Tests

### Run all tests (UI + API)
```bash
npm test
```

### Run UI tests only
```bash
npm run test:ui
```

### Run API tests only
```bash
npm run test:api
```

### Run a specific test file
```bash
npm run test:search       # Desktop flight search tests
npm run test:home         # Desktop homepage tests
npm run test:booking      # Booking API tests
```

### Run mobile tests only
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Run UI tests with browser visible
```bash
npm run test:headed
```

### Open the HTML report after a run
```bash
npm run report
```

## Test Coverage

### UI Tests — `searchFlight.spec.js` (Desktop)

| Test | Description |
|---|---|
| Test for Return trip | Melbourne → Perth, Business class, 2 adults. Asserts origin/destination inputs, departure date, URL, and cabin class label per result row. |
| Test for single trip | Sydney → Brisbane one-way. Asserts URL contains correct route. |
| Test for multi trip | Sydney → Melbourne → Darwin → Bali. Asserts URL contains all three legs. |
| Negative: no destination | Submitting the form without a destination should not navigate to results. |
| Negative: special characters | Typing `##$%123` in the destination field should show "No matching locations found." |

### UI Tests — `homePage.spec.js` (Desktop)

| Test | Description |
|---|---|
| Logo is displayed | Cheapflights homepage logo is visible. |
| Sign in button is displayed | Sign in button is visible in the header. |
| Login modal opens | Clicking Sign in opens the login/register dialog. |

### UI Tests — `mobileSearchFlight.spec.js` (Mobile — Pixel 5)

Tests run serially to avoid rate-limiting from parallel browser instances.

| Test | Description |
|---|---|
| Return trip search on mobile | Melbourne → Perth, Business class, 2 adults. Asserts the search navigates to a URL containing MEL and PER. |
| One-way trip search on mobile | Sydney → Brisbane one-way. Asserts the search navigates to a URL containing SYD and BNE. |
| Negative: no destination | Submitting the form without a destination shows a validation alert. |
| Negative: special characters | Typing `##$%123` in the destination field shows only the generic "Anywhere" option (no city suggestions). |

### UI Tests — `mobileHomePage.spec.js` (Mobile — Pixel 5)

| Test | Description |
|---|---|
| Logo is visible | Cheapflights logo is visible on mobile. |
| Sign in button is visible | Sign in button is visible on mobile. |
| Login modal opens | Tapping Sign in opens the login/register dialog on mobile. |
| Origin and destination inputs are visible | Both flight input regions are rendered on mobile. |
| Trip type selector is visible | The trip type radio group is visible on mobile. |
| Search button is visible | The Search button is visible on mobile. |

### API Tests — `apiTests.spec.js`

Base URL: `https://restful-booker.herokuapp.com`

| Endpoint | Test | Expected |
|---|---|---|
| POST /booking | Creates a booking with all fields | 200 — returns `bookingid` and full booking object |
| POST /booking | Two calls return distinct IDs | 200 — unique `bookingid` each time |
| GET /booking/{id} | Retrieves a booking by ID | 200 — all fields match the created booking |
| GET /booking/{id} | Non-existent ID | 404 |
| PUT /booking/{id} | Updates all booking fields with auth | 200 — response reflects updated values |
| PUT /booking/{id} | Update without auth token | 403 |
| DELETE /booking/{id} | Deletes a booking with auth | 201 — subsequent GET returns 404 |
| DELETE /booking/{id} | Delete without auth token | 403 |

## Playwright Projects

| Project | Runs | Device |
|---|---|---|
| `chromium` | Desktop UI tests (homePage, searchFlight) | Desktop Chrome |
| `Mobile Chrome` | Mobile UI tests (mobileHomePage, mobileSearchFlight, homePage) | Pixel 5 |
| `Mobile Safari` | Mobile UI tests (mobileHomePage, mobileSearchFlight, homePage) | iPhone 12 |
| `api` | API tests (apiTests) | — (no browser) |

The `api` project uses only `APIRequestContext` — no browser is launched.

## Mobile Test Notes

The cheapflights.com.au mobile site uses a custom `c-ulo-viewport` virtual-scroll component that intercepts native pointer events at the capture phase. Standard Playwright `locator.click()` calls are blocked inside this component. The `FlightSearchPage` works around this with three techniques:

- **`evaluate(el.click())`** — bypasses the backdrop for top-level buttons (origin trigger, "Select dates", Search)
- **JS-dispatched PointerEvents** — full `pointerdown → mousedown → click` sequence dispatched via `evaluate`, bypasses the capture-phase interceptor for radio buttons and panel buttons
- **CDP `Input.synthesizeTapGesture`** — OS-level tap via Chrome DevTools Protocol, used for date buttons inside the nested date-picker viewport

On mobile, search results redirect through `clickthrough.jsp` to `mob.expedia.com.au`. One-way searches may pass through a bot-detection page (`/security/check`) that stalls the `load` event; tests use `waitForNavigation({ waitUntil: "domcontentloaded" })` to handle this.

## Reporters

Two reporters are configured:

- **HTML** — generated in `playwright-report/`, open with `npm run report`
- **Allure** — results written to `allure-results/`, generate the report with:

```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```
