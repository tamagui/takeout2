import type { Page } from '@playwright/test'
import { ports } from '~/env'

const BASE_URL = `http://localhost:${ports.web}`

export async function loginAsDemo(page: Page, pathname = '/') {
  console.info('Logging in as demo user via API...')

  // sign up (creates user if needed, auto-signs-in if exists) via the page context
  // so the session cookie gets set on the browser
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'commit' })

  const result = await page.evaluate(async (baseUrl) => {
    const creds = {
      email: 'demo@takeout.tamagui.dev',
      password: 'demopassword123',
    }
    const headers = { 'Content-Type': 'application/json' }

    // retry loop: sign-in can 401 briefly while better-auth creates the account
    // record after a concurrent sign-up from another test
    for (let attempt = 0; attempt < 5; attempt++) {
      // try sign-in first (user may already exist from previous test)
      const signIn = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers,
        body: JSON.stringify(creds),
        credentials: 'include',
      })
      if (signIn.ok) return { step: 'sign-in', status: signIn.status, attempt }

      // user doesn't exist yet, create via sign-up
      const signUp = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Demo User', ...creds }),
        credentials: 'include',
      })
      if (signUp.ok) return { step: 'sign-up', status: signUp.status, attempt }

      // both failed, wait briefly for account record to propagate
      await new Promise((r) => setTimeout(r, 500))
    }

    return { step: 'failed', status: 0, error: true, attempt: 5 }
  }, BASE_URL)

  if (result.error) {
    throw new Error(`Demo login failed after ${result.attempt} attempts`)
  }

  console.info(
    `✅ Logged in via ${result.step} (status: ${result.status})${result.attempt ? ` (attempt ${result.attempt + 1})` : ''}`,
  )

  // navigate to home feed (cookie is set, so we'll be authenticated)
  const target =
    pathname !== '/' && pathname !== '/home' && pathname !== '/home/feed'
      ? pathname
      : '/home/feed'

  await page.goto(`${BASE_URL}${target}`, {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  })

  // wait for page to stabilize
  await page.waitForTimeout(2000)
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
