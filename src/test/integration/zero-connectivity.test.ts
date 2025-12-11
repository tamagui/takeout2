import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8081'
const ZERO_URL = 'http://localhost:4848'

test.describe('Zero Sync Connectivity Tests', () => {
  test('zero server should be reachable', async ({ request }) => {
    const response = await request.get(ZERO_URL)
    // zero server returns 200 for root
    expect(response.status()).toBe(200)
  })

  test('web app should connect to zero', async ({ page }) => {
    // go to a page that uses zero (admin page)
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForTimeout(3000)

    // check that zero status shows connected or complete
    const zeroStatus = page.locator('text=Zero Instance')
    await expect(zeroStatus).toBeVisible({ timeout: 10000 })

    // the page should show "Connected" for zero instance
    await expect(page.locator('text=Connected')).toBeVisible({ timeout: 10000 })
  })

  test('posts query should complete', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForTimeout(5000)

    // check that posts query status is shown
    await expect(page.locator('text=Posts Query Status')).toBeVisible({ timeout: 10000 })

    // should eventually show complete (not unknown/loading)
    await expect(page.locator('text=complete')).toBeVisible({ timeout: 15000 })
  })
})
