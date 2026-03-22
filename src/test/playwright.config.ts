import { cpus } from 'node:os'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './integration',
  outputDir: './integration/.output/test-results',
  timeout: process.env.CI ? 60 * 1000 : 20 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  workers: process.env.CI ? 1 : Math.min(4, Math.floor(cpus().length * 0.5)),
  retries: 1,
  maxFailures: 3,
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
