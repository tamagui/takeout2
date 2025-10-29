/**
 * Quick test script to debug admin login flow
 * Run with: bun run:dev playwright test test-admin-login.ts
 */

import { test, expect } from '@playwright/test'

test('admin login flow debug', async ({ page }) => {
  // Enable console logging
  page.on('console', (msg) => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text())
  })

  // Track network requests
  page.on('request', (request) => {
    if (request.url().includes('/api/auth')) {
      console.log(`[REQUEST]: ${request.method()} ${request.url()}`)
    }
  })

  page.on('response', async (response) => {
    if (response.url().includes('/api/auth')) {
      const status = response.status()
      console.log(`[RESPONSE]: ${status} ${response.url()}`)
      if (status >= 400) {
        try {
          const body = await response.text()
          console.log(`[ERROR BODY]:`, body)
        } catch (e) {
          // ignore
        }
      }
    }
  })

  console.log('\n=== Step 1: Navigate to login page ===')
  await page.goto('http://localhost:8081/login?showAdmin', {
    waitUntil: 'domcontentloaded',
  })

  console.log('\n=== Step 2: Wait for page to load ===')
  await page.waitForTimeout(2000)

  console.log('\n=== Step 3: Check for admin button ===')
  const adminButton = page.locator('[data-testid="login-as-admin"]')
  const isVisible = await adminButton.isVisible()
  console.log(`Admin button visible: ${isVisible}`)

  if (isVisible) {
    console.log('\n=== Step 4: Click admin button ===')
    await adminButton.click()

    console.log('\n=== Step 5: Wait for auth response ===')
    await page.waitForTimeout(3000)

    const currentUrl = page.url()
    console.log(`Current URL: ${currentUrl}`)

    // Check if we're still on login page
    if (currentUrl.includes('/login')) {
      console.log('\n❌ STILL ON LOGIN PAGE - Auth did not succeed')

      // Take a screenshot
      await page.screenshot({ path: 'admin-login-failed.png', fullPage: true })
      console.log('Screenshot saved: admin-login-failed.png')

      // Check for any error messages
      const bodyText = await page.textContent('body')
      if (bodyText?.includes('error') || bodyText?.includes('Error')) {
        console.log('\nPage contains error text')
      }
    } else {
      console.log('\n✅ REDIRECTED - Auth likely succeeded')
    }

    // Check for username attribute
    const usernameEl = page.locator('[data-username]')
    const usernameExists = await usernameEl.count()
    if (usernameExists > 0) {
      const username = await usernameEl.getAttribute('data-username')
      console.log(`✅ Found user with username: ${username}`)
    } else {
      console.log('❌ No [data-username] element found')
    }
  } else {
    console.log('❌ Admin button not found!')
    await page.screenshot({ path: 'admin-button-not-found.png', fullPage: true })
  }
})
