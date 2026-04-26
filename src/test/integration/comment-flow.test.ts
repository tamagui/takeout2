import { expect, test } from '@playwright/test'

import { gotoAndWaitForZero, loginAsDemo } from './helpers'

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
      page.getByTestId('comment-item').filter({ hasText: commentText }),
    ).toBeVisible({ timeout: 5000 })

    // verify comment doesn't revert after a second
    await page.waitForTimeout(1000)
    await expect(
      page.getByTestId('comment-item').filter({ hasText: commentText }),
    ).toBeVisible({ timeout: 500 })

    // hard-nav back to feed; zero re-establishes its websocket on the new doc
    await gotoAndWaitForZero(page, '/home/feed')

    // the comment should appear in the feed's comment preview for this post
    // (the feed shows the latest comment inline)
    await expect(page.locator(`text=${commentText}`).first()).toBeVisible({
      timeout: 15000,
    })
  })
})
