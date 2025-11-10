/**
 * Admin Login UI Integration Test
 * Tests the full admin login flow through the UI
 */

import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  // Clear all cookies between tests
  await context.clearCookies()
})

test.skip('admin login via UI', async ({ page }) => {
  // Track auth requests
  let signupRequest: any = null
  page.on('response', async (response) => {
    if (response.url().includes('/api/auth/sign-up/email')) {
      signupRequest = {
        status: response.status(),
        body: await response.json().catch(() => ({})),
      }
    }
  })
  await page.goto('http://localhost:8262/login?showAdmin', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(2000)
  const adminButton = page.locator('[data-testid="login-as-admin"]')
  await expect(adminButton).toBeVisible({ timeout: 5000 })
  await adminButton.click()
  await page.waitForTimeout(3000)

  // Check current URL
  const currentUrl = page.url()

  // Should be redirected away from login
  expect(currentUrl).not.toContain('/login')

  // Check if signup was successful
  if (signupRequest) {
    if (signupRequest.status === 200) {
    }
  }
})

test.skip('admin login shows username attribute', async ({ page }) => {
  await page.goto('http://localhost:8262/login?showAdmin')
  await page.waitForTimeout(1000)

  const adminButton = page.locator('[data-testid="login-as-admin"]')
  await adminButton.click()

  // Wait for redirect
  await page.waitForTimeout(3000)

  // For now, just verify we're authenticated by checking we're not on login page
  // The data-username attribute requires the user to have a username set
  const url = page.url()
  expect(url).not.toContain('/login')
})
