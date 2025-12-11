import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8081'

test.describe('Basic Integration Tests', () => {
  test('server should be running on port 8081', async ({ page }) => {
    // use /login since root is SSG and may not work in dev mode
    const response = await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBe(200)
  })
})
