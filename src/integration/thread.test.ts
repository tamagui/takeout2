import { expect, test } from '@playwright/test'
import { randomId } from '@vxrn/helpers'
import { loginAsAdmin, sendMessageIn } from './helpers'

test.describe('Thread Tests', () => {
  test.skip('test create thread and reply simple', async ({ page }) => {
    await loginAsAdmin(page, '/tamagui')

    const id = randomId()
    const message1 = `hello ${id}`
    const message2 = `test ${id}`
    const message3 = `test again ${id}`

    await sendMessageIn(page, 'channel', message1)
    const message = page.getByTestId('message-item').locator(`text="${message1}"`)
    await message.hover()
    const threadButton = message.getByTestId('message-action-thread')

    // breaking here, even though its visible it refuses to accept that:
    await page.pause()
    await threadButton.waitFor({ state: 'visible', timeout: 1500 })
    await threadButton.click({ force: true })
    const threadPanel = page.getByTestId('thread-panel')
    await sendMessageIn(page, 'thread', message2)
    expect(
      threadPanel.getByTestId('message-item').locator(`text="${message2}"`)
    ).toBeVisible()
    await page.waitForTimeout(100)
    await sendMessageIn(page, 'thread', message3)
    await page.pause()
    expect(
      threadPanel.getByTestId('message-item').locator(`text="${message3}"`)
    ).toBeVisible()
  })
})
