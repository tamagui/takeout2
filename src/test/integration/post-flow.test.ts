import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { expect, test } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

import { loginAsDemo } from './helpers'

const BASE_URL = 'http://localhost:8081'

// increase timeout for this test since it involves file uploads
test.describe('Post Flow', () => {
  test('can create a post with caption and image', async ({ page }) => {
    test.setTimeout(120000)

    await loginAsDemo(page)

    // go to home feed and click the plus button to open create post dialog
    await page.goto(`${BASE_URL}/home/feed`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // click the plus button in the header to open the create post dialog
    const plusButton = page.locator('[data-testid="create-post-button"]')
    await plusButton.waitFor({ state: 'visible', timeout: 10000 })
    await plusButton.click()

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

    // wait for image upload to complete - check for preview image
    const previewImage = page.locator('img[src^="blob:"]')
    await previewImage.waitFor({ state: 'visible', timeout: 30000 })

    // submit the post
    const submitButton = page.locator('[data-testid="create-post-submit"]')
    await submitButton.waitFor({ state: 'visible' })

    // wait for button to be enabled (upload complete to S3)
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('[data-testid="create-post-submit"]')
        return btn && !btn.hasAttribute('disabled')
      },
      { timeout: 30000 }
    )

    await submitButton.click()

    // verify success toast appears (post created successfully)
    // use .first() since there may be a notification element too
    const successToast = page.locator('text=Post created successfully').first()
    await successToast.waitFor({ state: 'visible', timeout: 15000 })

    // verify dialog closed (caption input no longer visible)
    await captionInput.waitFor({ state: 'hidden', timeout: 10000 })

    expect(true).toBe(true)
  })
})
