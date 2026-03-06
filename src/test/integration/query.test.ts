import { expect, test } from '@playwright/test'

import { loginAsDemo } from './helpers'

test.describe('query()', () => {
  test('fetches user data from server', async ({ page }) => {
    test.setTimeout(45000)

    await loginAsDemo(page)

    // wait for zero to initialize and expose Dev globals
    await page.waitForFunction(() => typeof (window as any).Dev?.run === 'function', {
      timeout: 15000,
    })

    const user = await page.evaluate(async () => {
      const { run, userByUsername } = (window as any).Dev
      return await run(userByUsername, { username: 'alexr' })
    })

    expect(user).toBeTruthy()
    expect(user.username).toBe('alexr')
    expect(user.id).toBe('seed-user-4')
  })
})
