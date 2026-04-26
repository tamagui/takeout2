import { cpus } from 'node:os'
import { defineConfig, devices } from '@playwright/test'

const PORT_WEB = Number(process.env.VITE_PORT_WEB || 8081)

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
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : 'list',
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
