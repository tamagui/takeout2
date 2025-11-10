/**
 * Quick test script to debug admin login flow
 * Run with: bun run:dev playwright test test-admin-login.ts
 */

import { test, expect } from '@playwright/test'

test('admin login flow debug', async ({ page }) => {
  // Enable console logging
  page.on('console', (msg) => {})

  // Track network requests
  page.on('request', (request) => {
    if (request.url().includes('/api/auth')) {
    }
  })

  page.on('response', async (response) => {
    if (response.url().includes('/api/auth')) {
      const status = response.status()
      if (status >= 400) {
        try {
          const body = await response.text()
        } catch (e) {
          // ignore
        }
      }
    }
  })
  await page.goto('http://localhost:8262/login?showAdmin', {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(2000)
  const adminButton = page.locator('[data-testid="login-as-admin"]')
  const isVisible = await adminButton.isVisible()

  if (isVisible) {
    await adminButton.click()
    await page.waitForTimeout(3000)

    const currentUrl = page.url()

    // Check if we're still on login page
    if (currentUrl.includes('/login')) {
      // Check for any error messages
      const bodyText = await page.textContent('body')
      if (bodyText?.includes('error') || bodyText?.includes('Error')) {
      }
    } else {
    }

    // Check for username attribute
    const usernameEl = page.locator('[data-username]')
    const usernameExists = await usernameEl.count()
    if (usernameExists > 0) {
      const username = await usernameEl.getAttribute('data-username')
    } else {
    }
  }
})
