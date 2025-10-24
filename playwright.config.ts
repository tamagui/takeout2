import { defineConfig, devices } from '@playwright/test'

// lets just run this in ci ourselves for better logging
// webServer: {
//   command: 'bun web:serve:integration',
//   port: 8081,
//   timeout: 120 * 1000,
//   reuseExistingServer: !process.env.CI,
// },

export default defineConfig({
  testDir: './src/integration',
  outputDir: './src/integration/.output/test-results',
  timeout: 20 * 1000,
  expect: {
    timeout: 5000,
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
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
})
