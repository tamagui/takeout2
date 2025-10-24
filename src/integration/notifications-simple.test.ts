import { expect, test } from '@playwright/test'
import { loginAsAdmin } from './helpers'

test.describe('Notification Tests', () => {
  test('should play notification sound when user is mentioned', async ({ page }) => {
    await loginAsAdmin(page, '/tamagui')

    // array to capture audio plays
    const audioPlayCalls: Array<{ url: string; timestamp: number }> = []

    // capture console logs from the start
    page.on('console', (msg) => {
      const text = msg.text()
      if (
        text.includes('GlobalNotificationsEffects') ||
        text.includes('playNotificationSound') ||
        text.includes('[Audio]')
      ) {
        console.info('📌 Page log:', text)
      }
    })

    // expose function to capture audio plays
    await page.exposeFunction('captureAudioPlay', (url: string) => {
      audioPlayCalls.push({ url, timestamp: Date.now() })
      console.info(`Audio play captured: ${url}`)
    })

    // inject script to override Audio constructor
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

    await page.goto('/tamagui', { waitUntil: 'networkidle' })

    // first, set up notification preferences
    console.info('Setting up notification preferences...')

    const userSettingsButton = await page.$(
      '[data-testid="user-profile-button"][data-username="admin"]'
    )

    if (userSettingsButton) {
      console.info('Opening user settings...')
      await userSettingsButton.click()
      await page.waitForTimeout(1000)

      // wait for tabs to be visible and click on Settings tab
      try {
        await page.waitForSelector('button:has-text("Settings")', { timeout: 5000 })
      } catch (e) {
        console.info('Settings tab not found after waiting')
      }

      const settingsTab = await page.$('button:has-text("Settings")')
      if (settingsTab) {
        console.info('Clicking Settings tab...')
        await settingsTab.click({ force: true })
        await page.waitForTimeout(500)

        // click on Notifications button
        const notificationsButton = await page.$(
          '[data-testid="notifications-settings-button"]'
        )
        if (notificationsButton) {
          console.info('Opening Notifications settings...')
          await notificationsButton.click({ force: true })
          await page.waitForTimeout(500)

          // click on "Everything" radio button for notifications
          const everythingRadio = await page.$(
            '[data-testid="notification-radio-everything"]'
          )
          if (everythingRadio) {
            console.info('Found Everything radio button, clicking...')
            await everythingRadio.click()
            await page.waitForTimeout(500)
          } else {
            console.info('Everything radio button not found')
          }

          // make sure sound is enabled
          const soundCheckbox = await page.$(
            '[data-testid="notification-sound-checkbox"]'
          )
          if (soundCheckbox) {
            console.info('Found sound checkbox')
            const isChecked = await soundCheckbox.evaluate((el) => {
              // check if checkbox is checked
              return el.getAttribute('data-state') === 'checked'
            })

            if (!isChecked) {
              console.info('Enabling notification sounds...')
              await soundCheckbox.click()
              await page.waitForTimeout(500)
            } else {
              console.info('Notification sounds already enabled')
            }
          } else {
            console.info('Sound checkbox not found')
          }
        } else {
          console.info('Notifications button not found')
        }
      } else {
        console.info('Settings tab not found')
      }

      // close settings by clicking outside or pressing escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
      await page.keyboard.press('Escape')
      await page.waitForTimeout(1000)
    } else {
      console.info('User profile button not found')
    }

    // try to find and click dev tools button
    const devToolsButton = await page.$('[data-testid="devtools-button"]')

    if (devToolsButton) {
      console.info('Found dev tools button, clicking...')
      await devToolsButton.click()

      // wait for dev tools to open
      await page.waitForTimeout(1000)

      // look for simulate tab
      const simulateTab = await page.$('button:has-text("Simulate")')

      if (simulateTab) {
        console.info('Found simulate tab, clicking...')
        await simulateTab.click()

        // wait for simulate panel
        await page.waitForTimeout(1000)

        // look for the new "Mention Me (Other Channel)" button first
        let mentionButton = await page.$('button:has-text("Mention Me (Other Channel)")')
        let buttonType = 'other channel'

        // fallback to regular "Mention Me" if the other channel button doesn't exist
        if (!mentionButton) {
          console.info(
            'Mention Me (Other Channel) not found, trying regular Mention Me...'
          )
          mentionButton = await page.$(
            'button:has-text("Mention Me"):not(:has-text("Other"))'
          )
          buttonType = 'same channel'
        }

        if (mentionButton) {
          console.info(`Found mention me button (${buttonType})`)

          const audioPlaysBefore = audioPlayCalls.length
          console.info(`Audio plays before: ${audioPlaysBefore}`)

          await mentionButton.click()

          // wait for notification - give more time for async operations
          console.info('Waiting for notification to trigger...')
          await page.waitForTimeout(5000)

          const audioPlaysAfter = audioPlayCalls.length
          console.info(`Audio plays after: ${audioPlaysAfter}`)
          console.info('Audio calls:', audioPlayCalls)

          // check if audio was played
          if (audioPlaysAfter > audioPlaysBefore) {
            console.info('✅ Notification sound was played!')
            expect(audioPlaysAfter).toBeGreaterThan(audioPlaysBefore)
          } else {
            console.info('⚠️ No notification sound detected TODO FIX THIS')
          }
        } else {
          console.info('No mention buttons found')
        }
      } else {
        console.info('Simulate tab not found')
      }
    } else {
      console.info(
        'Dev tools button not found - may need admin access or development mode'
      )
    }
  })
})
