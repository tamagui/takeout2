import type { Page } from '@playwright/test'

export async function loginAsAdmin(page: Page, pathname = '/') {
  console.info('Navigating to login page...')
  await page.goto('http://localhost:8081/login?showAdmin', {
    waitUntil: 'domcontentloaded',
  })

  console.info('Logging in as admin...')

  // click the login as admin button
  await page.locator('[data-testid="login-as-admin"]').click()
  await page.waitForTimeout(1000)
  await page.waitForLoadState('networkidle')

  // Verify login by checking if we're redirected away from login page
  const currentUrl = page.url()
  if (currentUrl.includes('/login')) {
    console.error(`❌ Still on login page after admin login`)
    throw new Error(`Admin login failed - still on login page`)
  }

  console.info(`✅ Logged in as admin, redirected to: ${currentUrl}`)

  // Navigate to desired pathname if different from current
  if (pathname !== '/' || !currentUrl.endsWith(pathname)) {
    await page.goto(`http://localhost:8081${pathname}?showAdmin`, {
      waitUntil: 'networkidle',
    })
  }
}
