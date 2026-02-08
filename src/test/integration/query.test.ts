import { expect, test } from '@playwright/test'

import { loginAsDemo } from './helpers'

test.describe('query()', () => {
  test('fetches user data from server', async ({ page }) => {
    test.setTimeout(20000)

    await loginAsDemo(page)

    // query() and userByUsername are exposed on window.Dev in dev mode
    const user = await page.evaluate(async () => {
      const { run, userByUsername } = (window as any).Dev
      return await run(userByUsername, { username: 'alexr' })
    })

    expect(user).toBeTruthy()
    expect(user.username).toBe('alexr')
    expect(user.id).toBe('seed-user-4')
  })
})
