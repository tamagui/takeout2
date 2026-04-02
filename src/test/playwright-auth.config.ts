import { defineConfig, devices } from '@playwright/test'

const PORT_WEB = Number(process.env.VITE_PORT_WEB || 8081)

/**
 * Playwright config for auth integration tests
 * No global setup - tests are independent
 */
export default defineConfig({
  testDir: './integration/auth',
  outputDir: './integration/.output/test-results',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT_WEB}`,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
