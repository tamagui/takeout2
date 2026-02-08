import type { Page } from '@playwright/test'

const BASE_URL = 'http://localhost:8081'

export async function loginAsDemo(page: Page, pathname = '/') {
  console.info('Navigating to login page...')
  await page.goto(`${BASE_URL}/auth/login`, {
    waitUntil: 'networkidle',
  })

  // wait for page to hydrate
  await page.waitForTimeout(3000)

  console.info('Logging in as demo user...')

  // click the demo login button
  const demoButton = page.locator('[data-testid="login-as-demo"]')
  await demoButton.waitFor({ state: 'visible', timeout: 15000 })
  await demoButton.click()

  // wait for navigation away from login page (up to 30 seconds in CI)
  try {
    await page.waitForURL((url) => !url.toString().includes('/auth/login'), {
      timeout: 30000,
    })
  } catch {
    console.error(`❌ Still on login page after demo login (timeout)`)
    throw new Error(`Demo login failed - still on login page`)
  }
  await page.waitForLoadState('domcontentloaded').catch(() => {})

  const currentUrl = page.url()
  console.info(`✅ Logged in as demo user, redirected to: ${currentUrl}`)

  // always navigate directly to /home/feed to bypass any onboarding redirects
  // this is more reliable for CI testing than trying to click skip buttons
  console.info('Navigating to /home/feed...')
  await page.goto(`${BASE_URL}/home/feed`, { waitUntil: 'domcontentloaded' })

  // wait for page to stabilize
  await page.waitForTimeout(2000)

  // navigate to desired pathname if different from home/feed
  if (pathname !== '/' && pathname !== '/home' && pathname !== '/home/feed') {
    await page.goto(`${BASE_URL}${pathname}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
  }
}

export async function loginAsAdmin(page: Page, pathname = '/') {
  console.info('Navigating to login page...')
  await page.goto(`${BASE_URL}/auth/login?showAdmin`, {
    waitUntil: 'domcontentloaded',
  })

  console.info('Logging in as admin...')

  // click the login as admin button
  await page.locator('[data-testid="login-as-admin"]').click()
  await page.waitForTimeout(1000)
  await page.waitForLoadState('networkidle')

  // verify login by checking if we're redirected away from login page
  const currentUrl = page.url()
  if (currentUrl.includes('/auth/login')) {
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
