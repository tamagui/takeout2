import type { Page } from '@playwright/test'

const BASE_URL = 'http://localhost:8081'

export async function loginAsDemo(page: Page, pathname = '/') {
  console.info('Navigating to login page...')
  await page.goto(`${BASE_URL}/login`, {
    waitUntil: 'domcontentloaded',
  })

  console.info('Logging in as demo user...')

  // click the demo login button
  const demoButton = page.locator('[data-testid="login-as-demo"]')
  await demoButton.waitFor({ state: 'visible', timeout: 10000 })
  await demoButton.click()
  await page.waitForTimeout(1000)
  await page.waitForLoadState('networkidle')

  // verify login by checking if we're redirected away from login page
  const currentUrl = page.url()
  if (currentUrl.includes('/login')) {
    console.error(`❌ Still on login page after demo login`)
    throw new Error(`Demo login failed - still on login page`)
  }

  console.info(`✅ Logged in as demo user, redirected to: ${currentUrl}`)

  // for demo users, force navigate to /home (skip any onboarding redirects)
  await page.goto(`${BASE_URL}/home`, {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(500)

  // navigate to desired pathname if different from home
  if (pathname !== '/' && pathname !== '/home') {
    await page.goto(`${BASE_URL}${pathname}`, {
      waitUntil: 'networkidle',
    })
  }
}

export async function loginAsAdmin(page: Page, pathname = '/') {
  console.info('Navigating to login page...')
  await page.goto(`${BASE_URL}/login?showAdmin`, {
    waitUntil: 'domcontentloaded',
  })

  console.info('Logging in as admin...')

  // click the login as admin button
  await page.locator('[data-testid="login-as-admin"]').click()
  await page.waitForTimeout(1000)
  await page.waitForLoadState('networkidle')

  // verify login by checking if we're redirected away from login page
  const currentUrl = page.url()
  if (currentUrl.includes('/login')) {
    console.error(`❌ Still on login page after admin login`)
    throw new Error(`Admin login failed - still on login page`)
  }

  console.info(`✅ Logged in as admin, redirected to: ${currentUrl}`)

  // navigate to desired pathname if different from current
  if (pathname !== '/' || !currentUrl.endsWith(pathname)) {
    await page.goto(`${BASE_URL}${pathname}?showAdmin`, {
      waitUntil: 'networkidle',
    })
  }
}

export async function waitForZeroSync(page: Page, timeout = 5000) {
  // wait for zero to be connected and synced
  await page
    .waitForFunction(
      () => {
        const statusEl = document.querySelector('[data-zero-status]')
        return statusEl?.getAttribute('data-zero-status') === 'connected'
      },
      { timeout }
    )
    .catch(() => {
      console.info('Zero status element not found, continuing anyway')
    })
}
