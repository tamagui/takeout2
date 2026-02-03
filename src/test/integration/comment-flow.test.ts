import { expect, test } from '@playwright/test'

const BASE_URL = 'http://localhost:8081'

// seed post from seed-demo.ts
const SEED_POST_ID = 'seed-post-1'

test.describe('Comment Flow', () => {
  // aggressive test - minimal waits to expose race condition
  test('can add comment immediately after login without page refresh', async ({
    page,
  }) => {
    test.setTimeout(90000)

    // capture browser console for debugging
    const consoleLogs: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('[on-zero]') || text.includes('[mutator]')) {
        consoleLogs.push(`[${msg.type()}] ${text}`)
        console.info(`BROWSER: ${text}`)
      }
    })

    // go to login page - wait for network to settle for reliable hydration
    console.info('navigating to login page...')
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' })

    // wait for demo button - this confirms the page hydrated
    console.info('waiting for demo button...')
    const demoButton = page.locator('[data-testid="login-as-demo"]')
    await demoButton.waitFor({ state: 'visible', timeout: 30000 })

    console.info('clicking demo login button...')
    await demoButton.click()

    // wait for redirect away from login - retry click if needed
    try {
      await page.waitForURL((url) => !url.toString().includes('/auth/login'), {
        timeout: 10000,
      })
    } catch {
      // sometimes first click doesn't register, retry
      console.info('retrying demo login click...')
      await demoButton.click()
      await page.waitForURL((url) => !url.toString().includes('/auth/login'), {
        timeout: 20000,
      })
    }
    console.info('login complete, now on:', page.url())

    // immediately look for the seed post - no extra wait
    console.info('looking for seed post in feed...')
    const seedPostLink = page.locator(`a[href*="/feed/post/${SEED_POST_ID}"]`).first()

    // wait for post to appear in feed
    await seedPostLink.waitFor({ state: 'visible', timeout: 15000 })

    console.info('clicking seed post link...')
    await seedPostLink.click()

    // immediately find the comment textarea - no extra wait
    console.info('waiting for comment input...')
    const commentInput = page.locator(
      'textarea[placeholder="Write your comments here..."]'
    )
    await commentInput.waitFor({ state: 'visible', timeout: 15000 })

    // type a comment with timestamp
    const commentText = `Test comment ${Date.now()}`
    console.info('typing comment:', commentText)
    await commentInput.fill(commentText)

    // find the submit button
    const submitButton = page
      .locator('textarea[placeholder="Write your comments here..."]')
      .locator('xpath=../following-sibling::*//button')
      .first()

    await submitButton.waitFor({ state: 'visible', timeout: 5000 })

    console.info('clicking submit button...')
    await submitButton.click()

    // verify comment appears optimistically
    console.info('waiting for comment to appear...')
    const newComment = page.locator(`text=${commentText}`)
    await newComment.waitFor({ state: 'visible', timeout: 15000 })
    console.info('comment visible optimistically')

    // now refresh the page and verify the comment persisted
    // if auth wasn't working, the mutation would have been rejected
    // and the comment would disappear after refresh
    console.info('refreshing page to verify comment persisted...')
    await page.reload({ waitUntil: 'domcontentloaded' })

    // wait for page to load
    await page.waitForTimeout(3000)

    // check if comment still exists after refresh
    const persistedComment = page.locator(`text=${commentText}`)
    const commentExists = await persistedComment
      .isVisible({ timeout: 10000 })
      .catch(() => false)

    if (!commentExists) {
      console.error('COMMENT DID NOT PERSIST - auth race condition confirmed!')
      console.error('=== BROWSER CONSOLE LOGS ===')
      consoleLogs.forEach((log) => console.error(log))
      console.error('=== END CONSOLE LOGS ===')
      throw new Error('Comment did not persist after refresh - auth token was not ready')
    }

    console.info('test passed - comment persisted after refresh!')
    console.info('=== BROWSER CONSOLE LOGS ===')
    consoleLogs.forEach((log) => console.info(log))
    console.info('=== END CONSOLE LOGS ===')
  })
})
