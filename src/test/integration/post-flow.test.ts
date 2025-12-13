import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import { loginAsDemo } from './helpers'

const BASE_URL = 'http://localhost:8081'

// increase timeout for this test since it involves file uploads and syncing
test.describe('Post Flow', () => {
  test('can create a post with caption only', async ({ page }) => {
    test.setTimeout(120000)

    await loginAsDemo(page)

    // navigate to /plus to open create post dialog
    await page.goto(`${BASE_URL}/plus`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // wait for create post dialog to appear
    // use placeholder selector since tamagui doesn't pass data-testid through
    const captionInput = page.locator('textarea[placeholder="What\'s on your mind?"]')
    await captionInput.waitFor({ state: 'visible', timeout: 10000 })

    // enter caption with timestamp
    const caption = `Test post ${Date.now()}`
    await captionInput.fill(caption)

    // upload an image since posts require one
    const testImagePath = path.resolve(__dirname, '../../../assets/icon.png')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.waitFor({ state: 'attached', timeout: 5000 })
    await fileInput.setInputFiles(testImagePath)

    // wait for upload to complete
    await page.waitForTimeout(2000)

    // submit the post
    const submitButton = page.locator('[data-testid="create-post-submit"]')
    await submitButton.waitFor({ state: 'visible' })

    // wait for button to be enabled (upload complete)
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('[data-testid="create-post-submit"]')
        return btn && !btn.hasAttribute('disabled')
      },
      { timeout: 15000 }
    )

    await submitButton.click()

    // wait for mutation to complete and dialog to close
    await page.waitForTimeout(3000)

    // navigate to home to verify post appears
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // verify post appears in feed
    const postText = page.locator(`text=${caption}`)
    await postText.waitFor({ state: 'visible', timeout: 15000 })

    expect(await postText.isVisible()).toBe(true)
  })
})
