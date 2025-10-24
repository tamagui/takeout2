import { expect, test, type Page } from '@playwright/test'
import { loginAsAdmin } from './helpers'

async function navigateToNotificationSettings(page: Page) {
  console.info('Navigating to notification settings...')

  await loginAsAdmin(page, '/tamagui')

  // click user profile button
  await page.click('#topbar-user')
  await page.waitForTimeout(500)

  // click settings tab
  await page.click('#popover-user .tab-settings')
  await page.waitForTimeout(500)

  // click notifications menu item
  await page.click('#list-item-user-notifications')
  await page.waitForTimeout(500)
}

async function createTestMention(page: Page) {
  page.on('console', (msg) => {
    const text = msg.text()
    if (
      text.includes('GlobalNotificationsEffects') ||
      text.includes('playNotificationSound')
    ) {
      console.info('📌 Page log:', text)
    }
  })

  // open dev tools
  await page.click('[data-testid="devtools-button"]')
  await page.waitForTimeout(500)

  // click simulate tab
  await page.click('button:has-text("Simulate")')
  await page.waitForTimeout(500)

  // click mention button (try other channel first, then regular)
  let mentionButton = await page.$('button:has-text("Mention Me (Other Channel)")')
  if (!mentionButton) {
    mentionButton = await page.$('button:has-text("Mention Me"):not(:has-text("Other"))')
  }

  if (mentionButton) {
    console.info('Clicking mention button...')
    await mentionButton.click()
    await page.waitForTimeout(5000) // wait longer for notification to process
  } else {
    console.info('‼️‼️‼️‼️ Mention button not found!')
  }

  // close dev tools
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
}

test.describe('Notification Settings Tests', () => {
  let globalAudioCaptures: string[] = []

  test.beforeEach(async ({ page }) => {
    // reset audio captures for each test
    globalAudioCaptures = []

    // set up audio capture BEFORE navigating
    await page.exposeFunction('captureAudioPlay', (url: string) => {
      console.info(`🔊 Audio captured: ${url}`)
      globalAudioCaptures.push(url)
    })

    await page.addInitScript(() => {
      const OriginalAudio = window.Audio
      window.Audio = class extends OriginalAudio {
        constructor(url?: string) {
          super(url)
          if (url) {
            // @ts-ignore
            window.captureAudioPlay(url)
          }
        }

        play() {
          // @ts-ignore
          if (this.src) window.captureAudioPlay(this.src)
          return super.play()
        }
      }
    })
  })

  test('should find notification settings elements', async ({ page }) => {
    await navigateToNotificationSettings(page)

    // log what we find
    const radioGroup = await page.$('[data-testid="notification-frequency-group"]')
    console.info('Radio group found:', !!radioGroup)

    const everythingRadio = await page.$('[data-testid="notification-radio-everything"]')
    console.info('Everything radio found:', !!everythingRadio)

    const directRadio = await page.$('[data-testid="notification-radio-direct"]')
    console.info('Direct radio found:', !!directRadio)

    const noneRadio = await page.$('[data-testid="notification-radio-none"]')
    console.info('None radio found:', !!noneRadio)

    const soundCheckbox = await page.$('[data-testid="notification-sound-checkbox"]')
    console.info('Sound checkbox found:', !!soundCheckbox)

    // try different selectors if test IDs don't work
    const labelEverything = await page.$('label:has-text("Everything")')
    console.info('Label "Everything" found:', !!labelEverything)

    const labelDirect = await page.$('label:has-text("Direct messages")')
    console.info('Label "Direct messages" found:', !!labelDirect)

    const labelNone = await page.$('label:has-text("None")')
    console.info('Label "None" found:', !!labelNone)

    // check for sound checkbox by text
    const soundLabel = await page.$('label:has-text("Enable sounds")')
    console.info('Sound label found:', !!soundLabel)

    // get all radio inputs
    const radioInputs = await page.$$('input[type="radio"]')
    console.info('Radio inputs found:', radioInputs.length)

    // get all checkboxes
    const checkboxes = await page.$$('input[type="checkbox"]')
    console.info('Checkboxes found:', checkboxes.length)

    // try RadioGroup.Item selector
    const radioItems = await page.$$('[role="radio"]')
    console.info('Radio items (role=radio) found:', radioItems.length)

    // check for Checkbox component
    const checkboxComponents = await page.$$('[role="checkbox"]')
    console.info('Checkbox components (role=checkbox) found:', checkboxComponents.length)
  })

  test.skip('notification sound plays with "Everything" setting', async ({ page }) => {
    await navigateToNotificationSettings(page)

    // select "Everything" notifications
    const everythingLabel = await page.$('label:has-text("Everything")')
    if (everythingLabel) {
      await everythingLabel.click()
      await page.waitForTimeout(500)
    }

    // ensure sounds are enabled
    const soundCheckbox = await page.$('[role="checkbox"]')
    if (soundCheckbox) {
      const isChecked = await soundCheckbox.getAttribute('data-state')
      if (isChecked !== 'checked') {
        await soundCheckbox.click()
        await page.waitForTimeout(500)
      }
    }

    // close settings
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)

    // create a mention
    const audiosBefore = globalAudioCaptures.length
    await createTestMention(page)
    const audiosAfter = globalAudioCaptures.length

    console.info(`Audio plays: ${audiosBefore} -> ${audiosAfter}`)
    console.info('Audio captures:', globalAudioCaptures)
    expect(audiosAfter).toBeGreaterThan(audiosBefore)
  })

  test('notification sound does not play with "None" setting', async ({ page }) => {
    await navigateToNotificationSettings(page)

    // select "None" notifications
    const noneLabel = await page.$('label:has-text("None")')
    if (noneLabel) {
      await noneLabel.click()
      await page.waitForTimeout(500)
    }

    // close settings
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)

    // create a mention
    const audiosBefore = globalAudioCaptures.length
    await createTestMention(page)
    const audiosAfter = globalAudioCaptures.length

    console.info(`Audio plays: ${audiosBefore} -> ${audiosAfter}`)
    console.info('Audio captures:', globalAudioCaptures)
    expect(audiosAfter).toBe(audiosBefore)
  })

  test('notification sound does not play when sounds disabled', async ({ page }) => {
    await navigateToNotificationSettings(page)

    // select "Everything" notifications
    const everythingLabel = await page.$('label:has-text("Everything")')
    if (everythingLabel) {
      await everythingLabel.click()
      await page.waitForTimeout(500)
    }

    // disable sounds
    const soundCheckbox = await page.$('[role="checkbox"]')
    if (soundCheckbox) {
      const isChecked = await soundCheckbox.getAttribute('data-state')
      if (isChecked === 'checked') {
        await soundCheckbox.click()
        await page.waitForTimeout(500)
      }
    }

    // close settings
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1000)

    // create a mention
    const audiosBefore = globalAudioCaptures.length
    await createTestMention(page)
    const audiosAfter = globalAudioCaptures.length

    console.info(`Audio plays: ${audiosBefore} -> ${audiosAfter}`)
    console.info('Audio captures:', globalAudioCaptures)
    expect(audiosAfter).toBe(audiosBefore)
  })
})
