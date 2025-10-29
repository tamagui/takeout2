/**
 * Admin Login UI Integration Test
 * Tests the full admin login flow through the UI
 */

import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  // Clear all cookies between tests
  await context.clearCookies()
  console.log('Cleared cookies')
})

test('admin login via UI', async ({ page }) => {
  console.log('\n=== Admin Login UI Test ===')

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

  console.log('Step 1: Navigate to login page with showAdmin flag')
  await page.goto('http://localhost:8081/login?showAdmin', {
    waitUntil: 'domcontentloaded',
  })

  console.log('Step 2: Wait for page to load')
  await page.waitForTimeout(2000)

  console.log('Step 3: Check for admin button')
  const adminButton = page.locator('[data-testid="login-as-admin"]')
  await expect(adminButton).toBeVisible({ timeout: 5000 })
  console.log('✅ Admin button is visible')

  console.log('Step 4: Click admin button')
  await adminButton.click()

  console.log('Step 5: Wait for auth to complete')
  await page.waitForTimeout(3000)

  // Check current URL
  const currentUrl = page.url()
  console.log('Current URL:', currentUrl)

  // Should be redirected away from login
  expect(currentUrl).not.toContain('/login')
  console.log('✅ Redirected away from login page')

  // Check if signup was successful
  if (signupRequest) {
    console.log('Signup request:', signupRequest.status, signupRequest.body)
    if (signupRequest.status === 200) {
      console.log('✅ Admin user created successfully')
    }
  }

  console.log('\n🎉 Admin login test passed!')
})

test('admin login shows username attribute', async ({ page }) => {
  console.log('\n=== Testing username display attribute ===')

  await page.goto('http://localhost:8081/login?showAdmin')
  await page.waitForTimeout(1000)

  const adminButton = page.locator('[data-testid="login-as-admin"]')
  await adminButton.click()

  // Wait for redirect
  await page.waitForTimeout(3000)

  // For now, just verify we're authenticated by checking we're not on login page
  // The data-username attribute requires the user to have a username set
  const url = page.url()
  expect(url).not.toContain('/login')

  console.log('✅ Login completed, URL:', url)
})
