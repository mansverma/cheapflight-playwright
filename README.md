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
│   ├── FlightSearchPage.js   # Search form interactions
│   └── HomePage.js           # Homepage interactions
├── tests/
│   ├── searchFlight.spec.js  # UI tests — flight search flows
│   ├── homePage.spec.js      # UI tests — homepage validation
│   └── apiTests.spec.js      # API tests — Booking endpoints
├── utils/
│   └── dateHelper.js         # Date formatting helpers
└── playwright.config.js      # Playwright configuration
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
npm run test:search     # Flight search tests
npm run test:home       # Homepage tests
npm run test:booking    # Booking API tests
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

### UI Tests — `searchFlight.spec.js`

| Test | Description |
|---|---|
| Test for Return trip | Melbourne → Perth, Business class, 2 adults. Asserts origin/destination inputs, departure date, URL, and cabin class label per result row. |
| Test for single trip | Sydney → Brisbane one-way. Asserts URL contains correct route. |
| Test for multi trip | Sydney → Melbourne → Darwin → Bali. Asserts URL contains all three legs. |
| Negative: no destination | Submitting the form without a destination should not navigate to results. |
| Negative: special characters | Typing `##$%123` in the destination field should show "No matching locations found." |

### UI Tests — `homePage.spec.js`

| Test | Description |
|---|---|
| Logo is displayed | Cheapflights homepage logo is visible. |
| Sign in button is displayed | Sign in button is visible in the header. |
| Login modal opens | Clicking Sign in opens the login/register dialog. |

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

| Project | Runs | Base URL |
|---|---|---|
| `chromium` | UI tests (homePage, searchFlight) | https://www.cheapflights.com.au |
| `api` | API tests (apiTests) | https://restful-booker.herokuapp.com |

The `api` project uses only `APIRequestContext` — no browser is launched.

## Reporters

Two reporters are configured:

- **HTML** — generated in `playwright-report/`, open with `npm run report`
- **Allure** — results written to `allure-results/`, generate the report with:

```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```
