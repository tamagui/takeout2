import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './integration',
  outputDir: './integration/.output/test-results',
  timeout: 30 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
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
