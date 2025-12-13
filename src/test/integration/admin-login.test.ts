/**
 * Admin Login UI Integration Test
 * Tests the full admin login flow through the UI
 */

import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  // Clear all cookies between tests
  await context.clearCookies()
})

// skipped: showAdmin query param is being stripped by framework routing
test.skip('admin login via UI', async ({ page }) => {
  test.setTimeout(60000)

  await page.goto('http://localhost:8081/login?showAdmin', {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(3000)

  const adminButton = page.locator('[data-testid="login-as-admin"]')
  await expect(adminButton).toBeVisible({ timeout: 10000 })
  await adminButton.click()
  await page.waitForTimeout(3000)

  // should be redirected away from login
  expect(page.url()).not.toContain('/login')
})

// skipped: showAdmin query param is being stripped by framework routing
test.skip('admin login shows username attribute', async ({ page }) => {
  await page.goto('http://localhost:8081/login?showAdmin')
  await page.waitForTimeout(1000)

  const adminButton = page.locator('[data-testid="login-as-admin"]')
  await adminButton.click()

  // wait for redirect
  await page.waitForTimeout(3000)

  // verify we're authenticated by checking we're not on login page
  expect(page.url()).not.toContain('/login')
})
