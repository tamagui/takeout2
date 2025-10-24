import { expect, test } from '@playwright/test'
import {
  expectMessageInChannel,
  expectToBeHidden,
  expectToBeVisible,
  loginAsAdmin,
  openHUD,
  sendMessageIn,
} from './helpers'

// TODO i disabled alongside HudInput due to loop bug
test.skip('Search Integration Tests', () => {
  test.setTimeout(60000)

  test('search opens with keyboard shortcuts', async ({ page }) => {
    await loginAsAdmin(page, '/tamagui')
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 5000 })

    const hudContainer = page.locator('[data-testid="hud-input-container"]')

    // test cmd+f shortcut
    await page.keyboard.press('Meta+f')
    await expectToBeVisible(hudContainer, { timeout: 2000 })
    console.info('✅ "cmd+f" shortcut opens search')

    // close
    await page.keyboard.press('Escape')
    await expectToBeHidden(hudContainer, { timeout: 2000 })
    console.info('✅ "escape" closes search')
  })

  test('create message and search for it', async ({ page }) => {
    await loginAsAdmin(page, '/tamagui')

    const uniqueMessage = `Testing pgvector search ${Date.now()}`
    console.info(`Creating test message: "${uniqueMessage}"`)

    await sendMessageIn(page, 'channel', uniqueMessage)
    console.info('Message sent')

    await expectMessageInChannel(page, uniqueMessage)

    await openHUD(page)

    await page.keyboard.type('pgvector search')

    // wait for search results container to be visible
    await page.waitForSelector('[data-testid="search-results"]', {
      state: 'visible',
      timeout: 2000,
    })

    // wait for search results to load
    await page.waitForTimeout(800)

    // wait for actual message items to appear
    await page.waitForSelector('.message-item-minimal', {
      state: 'visible',
      timeout: 2000,
    })

    // check if we have results
    const messageItems = page.locator('.message-item-minimal')
    const count = await messageItems.count()

    // debug logging if we don't get exactly 1 result
    if (count !== 1) {
      console.info(
        `Expected 1 search result for "pgvector search", but found ${count}. Debugging:`
      )
      for (let i = 0; i < count; i++) {
        const item = messageItems.nth(i)
        const text = await item.textContent()
        const messageId = await item
          .locator('[data-message-id]')
          .first()
          .getAttribute('data-message-id')
          .catch(() => 'no-id')
        console.info(
          `  Message ${i + 1} (id: ${messageId}): "${text?.substring(0, 150)}"`
        )
      }
    }

    // we should find exactly our test message (with clean database)
    expect(count).toBe(1)

    // verify it's actually our message
    const messageText = await messageItems.first().textContent()
    expect(messageText).toContain(uniqueMessage)
  })
})
