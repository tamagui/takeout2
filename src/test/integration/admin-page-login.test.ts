import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8081'

test.describe('Admin Page Login Tests', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('admin page shows login form when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForTimeout(2000)

    // should show logged-out state
    await expect(page.locator('text=logged-out')).toBeVisible()

    // should show admin login form
    await expect(page.locator('text=Admin Login')).toBeVisible()
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible()
    await expect(page.locator('text=Login as Admin')).toBeVisible()
  })

  test('admin page password input accepts text', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForTimeout(2000)

    const passwordInput = page.locator('input[placeholder="Password"]')
    await expect(passwordInput).toBeVisible()

    // type a password
    await passwordInput.fill('test-password')

    // verify it was typed
    await expect(passwordInput).toHaveValue('test-password')
  })

  test('admin page login button is clickable', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForTimeout(2000)

    const loginButton = page.locator('text=Login as Admin')
    await expect(loginButton).toBeVisible()
    await expect(loginButton).toBeEnabled()
  })

  test('admin page shows Zero sync status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    await page.waitForTimeout(3000)

    // check zero sync status
    await expect(page.locator('text=Zero Sync Status')).toBeVisible()
    await expect(page.locator('text=Zero Instance')).toBeVisible()
    await expect(page.locator('text=Connected')).toBeVisible()
    await expect(page.locator('text=Posts Query Status')).toBeVisible()
  })

  test('admin page shows posts count after sync completes', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`, {
      waitUntil: 'domcontentloaded',
    })

    // wait for sync to complete
    await page.waitForTimeout(5000)

    // check posts section exists
    await expect(page.locator('text=Posts (')).toBeVisible()

    // verify query completed (should show 'complete' somewhere)
    await expect(page.locator('text=complete')).toBeVisible({ timeout: 10000 })
  })
})
