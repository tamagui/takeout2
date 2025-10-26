import type { Page } from '@playwright/test'

export async function loginAsAdmin(page: Page, pathname = '/') {
  // TODO

  console.info('Navigating to login page...')
  await page.goto('http://localhost:8081/login?showAdmin', {
    waitUntil: 'domcontentloaded',
  })

  console.info('Logging in as admin...')

  // click the login as admin button
  await page.locator('[data-testid="login-as-admin"]').click()
  await page.waitForTimeout(500)
  await page.waitForLoadState('networkidle')

  // add admin so devtools show
  await page.goto(`http://localhost:8081${pathname}?showAdmin`, {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(500)

  const isAdmin = await page.locator('[data-username="admin"]').isVisible()

  if (isAdmin) {
    console.info(`✅ Logged in as admin`)
  } else {
    console.error(`❌ Not admin!`)
    throw new Error(`Not admin`)
  }
}
