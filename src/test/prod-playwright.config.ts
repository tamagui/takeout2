import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: '.', testMatch: 'search-debug.ts', timeout: 60000,
  reporter: 'list',
  use: { baseURL: 'https://takeout.tamagui.dev', trace: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
