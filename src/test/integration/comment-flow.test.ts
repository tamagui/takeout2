import { expect, test } from '@playwright/test'

import { loginAsDemo } from './helpers'

const BASE_URL = 'http://localhost:8081'
const SEED_POST_ID = 'seed-post-1'

test.describe('Comment Flow', () => {
  test('can add comment immediately after login without page refresh', async ({
    page,
  }) => {
    test.setTimeout(90000)

    await loginAsDemo(page)

    // wait for feed to populate via zero sync
    const postLink = page.locator(`a[href*="/feed/post/${SEED_POST_ID}"]`).first()
    await postLink.waitFor({ timeout: 30000 })
    await postLink.click()

    // add comment
    const commentText = `Test comment ${Date.now()}`
    await page.getByTestId('comment-input').fill(commentText)
    await page.getByTestId('comment-submit').click()

    // verify comment appears (zero is near instant)
    await expect(
      page.getByTestId('comment-item').filter({ hasText: commentText })
    ).toBeVisible({ timeout: 500 })

    // verify comment doesn't revert after a second
    await page.waitForTimeout(1000)
    await expect(
      page.getByTestId('comment-item').filter({ hasText: commentText })
    ).toBeVisible({ timeout: 500 })

    // wait for sync then navigate fresh to verify persistence
    await page.waitForTimeout(1000)
    await page.goto(page.url(), { waitUntil: 'networkidle' })

    // verify comment persisted (proves auth worked for mutation)
    const persistedComment = page
      .getByTestId('comment-item')
      .filter({ hasText: commentText })
    await expect(persistedComment).toBeVisible({ timeout: 5000 })
  })
})
