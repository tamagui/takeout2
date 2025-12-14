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

  // wait for navigation away from login page (up to 30 seconds in CI)
  try {
    await page.waitForURL((url) => !url.toString().includes('/login'), {
      timeout: 30000,
    })
  } catch {
    console.error(`❌ Still on login page after demo login (timeout)`)
    throw new Error(`Demo login failed - still on login page`)
  }
  await page.waitForLoadState('domcontentloaded').catch(() => {})

  const currentUrl = page.url()
  console.info(`✅ Logged in as demo user, redirected to: ${currentUrl}`)

  // if redirected to onboarding, skip it
  if (currentUrl.includes('/avatar-setup') || currentUrl.includes('/profile-setup')) {
    console.info('Skipping onboarding...')

    // wait for page to fully load and stabilize
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(3000)

    const skipButton = page.locator('[data-testid="skip-onboarding"]')
    try {
      await skipButton.waitFor({ state: 'visible', timeout: 10000 })
      await skipButton.click()
      // wait for navigation after clicking skip
      await page
        .waitForURL((url) => !url.toString().includes('/avatar-setup'), {
          timeout: 10000,
        })
        .catch(() => {})
    } catch (e) {
      console.info('Skip button not available, continuing...')
      // log page state for debugging
      const html = await page.content()
      console.info(`Page HTML length: ${html.length}`)
      console.info(`Contains skip-onboarding: ${html.includes('skip-onboarding')}`)
    }
  }

  // ensure we're on /home and reload for fresh state
  const afterLoginUrl = page.url()
  if (afterLoginUrl.includes('/home')) {
    console.info('Already on /home, reloading...')
    await page.reload({ waitUntil: 'domcontentloaded' })
  } else {
    console.info('Navigating to /home...')
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'domcontentloaded' })
  }

  // wait for page to fully stabilize after reload
  // waitForZeroSync disabled as the element may not exist and causes timing issues
  await page.waitForTimeout(5000)

  // navigate to desired pathname if different from home
  if (pathname !== '/' && pathname !== '/home') {
    await page.goto(`${BASE_URL}${pathname}`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
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
