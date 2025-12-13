import path from 'node:path'

import { expect, test, type Page } from '@playwright/test'

import { loginAsDemo, waitForZeroSync } from './helpers'

const BASE_URL = 'http://localhost:8081'

test.describe.skip('Post Flow', () => {
  let page: Page
  let createdPostCaption: string

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('login as demo user', async () => {
    await loginAsDemo(page)

    const currentUrl = page.url()
    expect(currentUrl).toContain('/home')
    expect(currentUrl).not.toContain('/login')

    console.info('✅ Demo user logged in')
  })

  test('create a post with image and caption', async () => {
    // wait for zero to sync
    await waitForZeroSync(page, 10000)

    // navigate to /plus to open create post dialog
    await page.goto(`${BASE_URL}/plus`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // wait for create post dialog to appear
    const captionInput = page.locator('[data-testid="create-post-caption"]')
    await captionInput.waitFor({ state: 'visible', timeout: 10000 })

    // upload test image - use existing asset from repo
    const testImagePath = path.resolve(__dirname, '../../../assets/icon.png')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)

    // wait for upload to complete (the "Uploading..." overlay should disappear)
    await page.waitForTimeout(3000) // give time for upload

    // enter caption with timestamp to make it unique
    createdPostCaption = `Integration test post ${Date.now()}`
    await captionInput.fill(createdPostCaption)

    // submit the post
    const submitButton = page.locator('[data-testid="create-post-submit"]')
    await submitButton.waitFor({ state: 'visible' })

    // wait for button to be enabled (image uploaded + caption filled)
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('[data-testid="create-post-submit"]')
        return btn && !btn.hasAttribute('disabled')
      },
      { timeout: 15000 }
    )

    await submitButton.click()

    // wait for dialog to close and navigate back
    await page.waitForTimeout(2000)
    await page.waitForLoadState('networkidle')

    console.info(`✅ Created post with caption: ${createdPostCaption}`)
  })

  test('verify post appears in home feed', async () => {
    // navigate to home
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // wait for zero to sync
    await waitForZeroSync(page, 10000)

    // look for our post by caption text
    const postText = page.locator(`text=${createdPostCaption}`)
    await postText.waitFor({ state: 'visible', timeout: 15000 })

    expect(await postText.isVisible()).toBe(true)

    console.info('✅ Post appears in home feed')
  })

  test('post persists after page refresh', async () => {
    // refresh the page
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // wait for zero to sync
    await waitForZeroSync(page, 10000)

    // verify post still appears
    const postText = page.locator(`text=${createdPostCaption}`)
    await postText.waitFor({ state: 'visible', timeout: 15000 })

    expect(await postText.isVisible()).toBe(true)

    console.info('✅ Post persists after refresh')
  })

  test('post persists after full navigation cycle', async () => {
    // navigate away from home
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    // navigate back to home
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // wait for zero to sync
    await waitForZeroSync(page, 10000)

    // verify post still appears
    const postText = page.locator(`text=${createdPostCaption}`)
    await postText.waitFor({ state: 'visible', timeout: 15000 })

    expect(await postText.isVisible()).toBe(true)

    console.info('✅ Post persists after navigation cycle')
  })
})
