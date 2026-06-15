import { test, expect } from '@playwright/test'

import { ports } from '~/env'
import { gotoAndWaitForZero, loginAsDemo } from './helpers'

const BASE_URL = `http://localhost:${ports.web}`

// regression for the zero 1.5 upgrade. on-zero used to pass userID:null to zero's
// query handler for logged-out users, which makes zero server-validate the
// connection against null. a logged-out client still connects as "anon", so zero
// rejected it with "Connection userID does not match validated server userID" and
// never came online for anonymous visitors (every logged-out page load + every
// logout). on-zero now omits userID when there's no authenticated user, so zero
// uses its client-fallback path and trusts the client's declared id. authenticated
// users are still pinned to their real id (server-validated).
test.describe('zero anonymous connection', () => {
  test('connects as anon on a logged-out route without a protocol error', async ({
    page,
  }) => {
    const userIdMismatches: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (
        text.includes('does not match validated server userID') ||
        text.includes('Connection userID does not match')
      ) {
        userIdMismatches.push(text)
      }
    })

    // the login route lives under the (app) group, which mounts <ProvideZero>, so
    // visiting it logged-out connects zero as anon — the exact reporter scenario
    await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })

    await page.locator('body[data-zero-connected="true"]').waitFor({
      state: 'attached',
      timeout: 35000,
    })

    expect(
      userIdMismatches,
      `zero rejected the anon connection:\n${userIdMismatches.join('\n')}`,
    ).toEqual([])
  })

  test('still connects when authenticated (server-validated id)', async ({ page }) => {
    // loginAsDemo waits for body[data-zero-connected]; if server-validation broke
    // for authed users this would time out
    await loginAsDemo(page)
    await expect(page.locator('body[data-zero-connected="true"]')).toBeAttached()

    // a fresh authed navigation should also reconnect cleanly
    await gotoAndWaitForZero(page, '/home/feed')
    await expect(page.locator('body[data-zero-connected="true"]')).toBeAttached()
  })
})
