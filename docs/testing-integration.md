---
name: takeout-testing-integration
description: Integration tests with Playwright — bun test integration, loginAsDemo, fixtures, debugging failures.
---

# Integration Testing Guide

This guide covers integration testing setup, best practices, and troubleshooting
for the chat application. Integration tests verify that different parts of the
system work together correctly, from the UI through the API to the database.

## Quick Start

### Running Integration Tests (Recommended)

`bun lite:demo` brings up postgres, zero-cache, an S3-compatible store, your
migrations, the seed data, and the web dev server in one process tree. No docker.

```bash
# terminal 1: whole stack on port 8081, with seed data
bun lite:demo

# terminal 2: run the tests
bun test:integration

# or a specific test file
cd src/test && bunx playwright test integration/basic.test.ts
```

Use `lite:demo`, not `lite`. Several tests look for seeded rows such as
`seed-post-1` and fail against an empty database. If a plain `bun lite` stack is
already running, seed it in place with
`bun run:dev scripts/db/seed-demo.ts`.

To run a second checkout at the same time, set `PORT_OFFSET=<n>`; every port
(web, postgres, zero, S3, orez admin) shifts by it, and the tests read the
shifted web port automatically.

### Reproducing CI

The CI pipeline is the only local test workflow that still needs docker - it
uses the same compose services CI does:

```bash
# full pipeline: backend, unit tests, build, integration tests
bun ops release --dry-run

# faster: uses dev server instead of production build
bun ops release --dry-run --dev
```

This handles everything automatically - no manual setup needed. Afterwards run
`bun backend:clean` before your next `bun backend`, since CI may have changed
auth keys. It does not affect `bun lite`.

### Production Mode Testing

To test against a production build:

```bash
# build first
bun web build

# then serve and test
bun web serve &
bun test:integration
```

### Important: Database State Management

For a clean database state between test runs, stop `bun lite` and delete its
data directory:

```bash
rm -rf .orez && bun lite:demo
```

On the docker backend the equivalent is `bun backend:clean && bun backend`.

This is important because:

- Tests may create data that persists between runs
- Search tests can fail if old test messages remain
- The database accumulates test data with each run

## Architecture Overview

### Test Stack

- Framework: Playwright Test
- Database: PostgreSQL with pgvector extension
- Real-time: Zero sync system
- Auth: Better Auth with test admin user
- Search: pgvector for semantic search
- Browser: Chromium (automatically installed)

### Directory Structure

```
src/test/
├── unit/                 # vitest unit tests
├── integration/          # playwright integration tests
│   ├── .output/          # test results and traces
│   ├── helpers.ts        # shared helper functions (loginAsDemo, etc.)
│   ├── api.test.ts       # api integration tests
│   ├── basic.test.ts     # basic app functionality
│   └── *.test.ts         # other integration tests
├── vitest.config.ts      # unit test config
└── playwright.config.ts  # integration test config
```

## Test Infrastructure

### Playwright Configuration

The test configuration is defined in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './integration',
  outputDir: './integration/.output/test-results',
  globalSetup: './integration/global-setup.ts',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'dot' : 'line',
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

### Global Setup

The global setup (`global-setup.ts`) runs once before all tests:

1. Launches a browser instance
2. Logs in as admin user
3. Creates a Tamagui test server
4. Sets up initial test environment

This ensures a consistent starting state for all tests.

## Writing Integration Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeAll(async ({ browser }) => {
    // setup that runs once before all tests in this suite
  })

  test.beforeEach(async ({ page }) => {
    // setup that runs before each test
    await page.goto('/tamagui')
  })

  test('should do something', async ({ page }) => {
    await expect(page.locator('[data-testid="element"]')).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    // cleanup after each test
  })
})
```

### Using Data Test IDs

Always use `data-testid` attributes for reliable element selection:

```typescript
// good - uses test ID
const button = page.locator('[data-testid="submit-button"]')

// avoid - fragile selector
const button = page.locator('button.submit')
```

### Waiting for Elements

Use proper wait strategies for async operations:

```typescript
// wait for element to be visible
await page.waitForSelector('[data-testid="message-list"]', {
  state: 'visible',
  timeout: 5000,
})

// wait for network idle
await page.goto(url, { waitUntil: 'networkidle' })

// wait for specific time (use sparingly)
await page.waitForTimeout(800)
```

## Database State Management

### Clean Database Requirements

Integration tests require a clean database state. This is managed through:

1. A fresh PostgreSQL, from orez (`bun lite`) or docker compose (`bun backend`)
2. Migrations: Automatically applied on startup
3. Seed data: Created by `scripts/db/seed-demo.ts`
4. Test Data: Created by individual tests as needed

### Database Reset Strategy

```bash
# lite: drop the data directory and start over
rm -rf .orez
bun lite:demo

# docker: drop the volumes and start over
bun backend:clean
bun backend
```

### Test Data Isolation

Use unique identifiers to prevent data collision:

```typescript
test('create and search for message', async ({ page }) => {
  const uniqueMessage = `Test message ${Date.now()}`
  await writeMessageInChannel(page, uniqueMessage)
})
```

## Common Test Patterns

### Search Tests

```typescript
test('search for messages', async ({ page }) => {
  const testMessage = `Search test ${Date.now()}`
  await writeMessageInChannel(page, testMessage)

  await page.waitForTimeout(800) // wait for indexing

  await page.keyboard.press('Meta+f')
  await page.keyboard.type('search test')

  const results = page.locator('.message-item-minimal')
  await expect(results).toHaveCount(1)
})
```

### Real-time Updates

```typescript
test('real-time message sync', async ({ page, context }) => {
  const page2 = await context.newPage()
  await page2.goto('/tamagui')

  await writeMessageInChannel(page, 'Real-time test')

  await expect(page2.locator('text="Real-time test"')).toBeVisible({
    timeout: 2000,
  })
})
```

### API Integration Tests

```typescript
test('API endpoint', async ({ request }) => {
  const response = await request.post('/api/messages', {
    data: {
      content: 'API test message',
      channelId: 'test-channel',
    },
  })

  expect(response.ok()).toBeTruthy()
  const json = await response.json()
  expect(json.success).toBe(true)
})
```

## Helper Functions

The `helpers.ts` file provides reusable functions:

### Core Helpers

```typescript
await finishOnboarding(page)
await setupTamaguiServer(page)
await writeMessageInChannel(page, 'Hello world')
await expectMessageInChannel(page, 'Hello world')
await openHUD(page)
await focusChannelInput(page)
```

### Visibility Helpers

```typescript
await expectToBeVisible(locator, { timeout: 2000 })
await expectToBeHidden(locator, { timeout: 2000 })
```

## CI/CD Integration

### GitHub Actions Workflow

Integration tests run automatically in CI:

```yaml
- name: Install Playwright
  run: bunx playwright install --with-deps chromium

- name: Start backend services
  run: bun ops run-backend &

- name: Start frontend (production)
  run: bun ops run-frontend &

- name: Wait for server
  run: bun wait-for-server

- name: Run integration tests
  run: bun test:integration
```

### CI-Specific Configuration

The CI environment has specific settings:

- Retries: 1 retry on failure
- Workers: Single worker for consistency
- Reporter: Dot reporter for compact output
- Timeout: Extended timeouts for slower CI machines

### Testing Everything in Production Mode

This is not often needed when developing but may be useful to test things fully
end-to-end:

```bash
# run the full CI setup except for deploying at the end
bun ops release --dry-run

# or equivalently
bun ops release --skip-deploy
```

### Running Tests with Different Configurations

```bash
# skip tests, only run checks and build
bun ops release --skip-tests --dry-run

# faster: use dev server instead of production build
bun ops release --dry-run --dev

# just run integration tests in CI mode (requires backend + frontend already running)
CI=true bun test:integration
```

## Troubleshooting

### Common Issues and Solutions

#### ERR_JWKS_NO_MATCHING_KEY

Problem: Authentication keys mismatch

Solution:

```bash
# restart services to regenerate keys
bun ops start-all-dev

# clear browser storage if the issue persists
```

#### Tests Finding Unexpected Data

Problem: Old test data affecting new runs

Solution:

```bash
Ctrl+C  # stop ops start-all-dev
bun ops start-all-dev  # fresh start
bun test:integration
```

#### Search Tests Failing

Problem: Search results not as expected

Solution:

```typescript
// ensure sufficient wait time for indexing
await page.waitForTimeout(800)

// add debug logging
const count = await results.count()
if (count !== expected) {
  for (let i = 0; i < count; i++) {
    const text = await results.nth(i).textContent()
    console.info(`Result ${i}: ${text}`)
  }
}
```

#### Port 8081 Already in Use

Problem: Previous test run didn't clean up

Solution:

```bash
lsof -i :8081
kill -9 <PID>

# on the docker backend
docker compose down

# or run this checkout on its own ports instead
PORT_OFFSET=10 bun lite:demo
```

#### Playwright Installation Issues

Problem: Browser binaries not installed

Solution:

```bash
bunx playwright install --with-deps chromium
# or install all browsers
bunx playwright install
```

### Debug Techniques

#### Enable Playwright Inspector

```bash
PWDEBUG=1 bun test:integration --headed
```

#### Add Console Logging

```typescript
test('debug test', async ({ page }) => {
  page.on('console', (msg) => {
    console.info('Browser console:', msg.text())
  })

  page.on('pageerror', (error) => {
    console.error('Page error:', error)
  })
})
```

#### Save Test Traces

```typescript
test.use({
  trace: 'on',
  video: 'on',
  screenshot: 'on',
})
```

View traces:

```bash
cd src/test && bunx playwright show-trace integration/.output/test-results/*/trace.zip
```

## Best Practices

1. Use Unique Test Data: Always include unique identifiers to avoid conflicts
2. Clean State Assumption: Never assume data from previous tests
3. Proper Waits: Use appropriate wait strategies
4. Descriptive Test Names: Write clear, descriptive test names
5. Isolate Test Logic: Keep tests independent and focused
6. Error Messages: Provide helpful error context
7. Parallel Test Considerations: Tests run sequentially for database consistency
8. Performance Considerations: Minimize wait times, reuse page contexts, batch
   assertions
9. Accessibility Testing: Include accessibility checks
10. Mobile Testing: Test responsive behavior

## Running Specific Tests

To run a single test file:

```bash
cd src/test && bunx playwright test integration/search.test.ts
```

To run tests with debugging output:

```bash
cd src/test && PWDEBUG=1 bunx playwright test integration/search.test.ts --headed
```

## Advanced Topics

### Custom Test Fixtures

Create reusable test contexts:

```typescript
import { test as base } from '@playwright/test'

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await loginAsAdmin(page, '/tamagui')
    await use(page)
  },
})

test('admin feature', async ({ authenticatedPage }) => {
  // already logged in as admin
})
```

### Testing WebSockets

Test real-time features:

```typescript
test('websocket connection', async ({ page }) => {
  await page.evaluate(() => {
    return new Promise((resolve) => {
      const ws = new WebSocket('ws://localhost:8081/ws')
      ws.onopen = () => resolve(true)
    })
  })
})
```

### Performance Testing

Measure and assert performance:

```typescript
test('performance metrics', async ({ page }) => {
  const metrics = await page.evaluate(() =>
    JSON.stringify(performance.getEntriesByType('navigation')),
  )

  const [navigation] = JSON.parse(metrics)
  expect(navigation.loadEventEnd).toBeLessThan(3000)
})
```

### Visual Regression Testing

Compare screenshots:

```typescript
test('visual regression', async ({ page }) => {
  await page.goto('/tamagui')
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixels: 100,
  })
})
```

## Conclusion

Integration testing is crucial for maintaining application quality. By following
these guidelines and best practices, you can write reliable, maintainable
integration tests that catch issues before they reach production.

Remember:

- Always start with a clean database state
- Use unique test data to avoid conflicts
- Leverage helper functions for common operations
- Debug with traces and console logs when needed
- Keep tests focused and independent

For more information, refer to:

- [Playwright Documentation](https://playwright.dev)
- [Project README](../README.md)
- [CI/CD Documentation](./ci-cd-guide.md)
