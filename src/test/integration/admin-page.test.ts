import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8081'

test.describe('Admin Page Integration Tests', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('admin page should load and show auth status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    // wait for react to render
    await page.waitForTimeout(2000)

    // check page title appears
    await expect(page.locator('text=Admin Test Page')).toBeVisible({ timeout: 10000 })

    // check auth status section exists
    await expect(page.locator('text=Auth Status')).toBeVisible()

    // check that it shows logged-out state initially
    await expect(page.locator('text=logged-out')).toBeVisible()
  })

  test('admin page should show Zero sync status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForTimeout(2000)

    // check zero sync section exists
    await expect(page.locator('text=Zero Sync Status')).toBeVisible({ timeout: 10000 })

    // check zero instance status
    await expect(page.locator('text=Zero Instance')).toBeVisible()
  })

  test('admin page should show admin login form when logged out', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForTimeout(2000)

    // check admin login section exists
    await expect(page.locator('text=Admin Login')).toBeVisible({ timeout: 10000 })

    // check password input exists
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible()

    // check login button exists
    await expect(page.locator('text=Login as Admin')).toBeVisible()
  })

  test('admin page should show posts section', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForTimeout(2000)

    // check posts section exists
    await expect(page.locator('text=Posts (')).toBeVisible({ timeout: 10000 })
  })

  test('admin page should show test log section', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForTimeout(2000)

    // check test log section exists
    await expect(page.locator('text=Test Log')).toBeVisible({ timeout: 10000 })

    // check clear button exists
    await expect(page.locator('text=Clear')).toBeVisible()
  })
})
