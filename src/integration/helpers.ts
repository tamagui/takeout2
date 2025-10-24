import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function setupTestUsers(page: Page) {
  console.info(`Creating test users...`)
  // open dev tools
  await page.click('[data-testid="devtools-button"]')
  await page.waitForTimeout(500)

  // click simulate tab
  await page.click('button:has-text("Simulate")')
  await page.waitForTimeout(500)

  console.info('Creating test users (one time only)...')

  await page.click('button:has-text("Create 3 Test Users")')

  await page
    .locator('[data-testid="has-test-users"]')
    .waitFor({ state: 'visible', timeout: 15_000 })
}

export async function loginAsAdmin(page: Page, pathname = '/') {
  console.info('Navigating to login page...')
  await page.goto('http://localhost:8081/_/login?showAdmin', {
    waitUntil: 'domcontentloaded',
  })

  console.info('Logging in as admin...')

  // click the login as admin button
  await page.locator('[data-testid="login-as-admin"]').click()
  await page.waitForTimeout(500)
  await page.waitForLoadState('networkidle')

  // add admin so devtools show
  await page.goto(`http://localhost:8081${pathname}?showAdmin`, {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(500)

  const isAdmin = await page.locator('[data-username="admin"]').isVisible()

  if (isAdmin) {
    console.info(`✅ Logged in as admin`)
  } else {
    console.error(`❌ Not admin!`)
    throw new Error(`Not admin`)
  }
}

export async function finishOnboarding(page: Page) {
  try {
    // Look for the skip button and click it
    const skipButton = page.locator('[data-testid="skip-onboarding"]')
    await skipButton.waitFor({ state: 'attached', timeout: 3000 })
    console.info('Found onboard dialog, clicking hidden skip button...')
    await skipButton.click({ force: true }) // force click since it's invisible
    await page.waitForTimeout(500)
    console.info('Onboard dialog skipped')
  } catch (err) {
    console.info(`Error waiting for onboarding, may already be complete`)
    console.info('DEBUG: Full error:', err)

    // some helpful logging if not working:
    try {
      const notAdminSpan = page.locator('[data-test-id="not-admin"]')
      const exists = (await notAdminSpan.count()) > 0
      if (exists) {
        const textContent = await notAdminSpan.textContent()
        console.info('DEBUG: Found not-admin span with content:', textContent)
        if (textContent) {
          try {
            const parsed = JSON.parse(textContent)
            console.info('DEBUG: Parsed user data:', parsed)
          } catch (e) {
            console.info('DEBUG: Could not parse user data:', e)
          }
        }
      } else {
        console.info('DEBUG: No not-admin span found')
      }
    } catch (e) {
      console.info('DEBUG: Error checking not-admin span:', e)
    }
  }
}

export async function setupTamaguiServer(page: Page) {
  try {
    const existing = page.locator('[data-testid="server-Tamagui"]')
    await existing.waitFor({ state: 'visible', timeout: 1000 })
    console.info('Tamagui server exists')
    return
  } catch {
    //
  }

  console.info('Creating Tamagui server...')

  // wait for and click dev tools button
  const devToolsButton = page.locator('[data-testid="devtools-button"]')
  await devToolsButton.waitFor({ state: 'visible', timeout: 5000 })
  await devToolsButton.click()
  await page.waitForTimeout(200)

  // wait for and click create tamagui server
  const createServerButton = page.locator('button:has-text("Create Tamagui Server")')
  await createServerButton.waitFor({ state: 'visible', timeout: 5000 })
  await createServerButton.click()
  console.info('Creating Tamagui server... waiting for it to be created')

  // close the dev tools dialog by pressing escape
  await page.waitForTimeout(200)
  await page.keyboard.press('Escape')

  // wait for server creation
  await page.waitForTimeout(4000)

  // navigate to the tamagui server
  await page.goto('http://localhost:8081/tamagui')
  console.info('Navigated to Tamagui server')
  await page.waitForTimeout(500)

  // join the channel if needed
  const joinButton = page.locator('button:has-text("Join")').first()
  if (await joinButton.isVisible({ timeout: 2000 })) {
    console.info('Found Join button, clicking to join channel...')
    await joinButton.click()
    await page.waitForTimeout(500)
  }

  // close any overlays
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
}

export async function expectToBeHidden(locator: Locator, options?: { timeout?: number }) {
  await expect(locator).toHaveAttribute('aria-hidden', 'true', options)
  await expect(locator).toHaveCSS('opacity', '0', options)
}

export async function expectToBeVisible(
  locator: Locator,
  options?: { timeout?: number }
) {
  await expect(locator).toHaveAttribute('aria-hidden', 'false', options)
  await expect(locator).toHaveCSS('opacity', '1', options)
}

export async function sendMessageIn(
  page: Page,
  inputName: 'thread' | 'channel' | 'hud',
  message: string
) {
  const channelInput = page.getByTestId(`${inputName}-input`).getByRole('textbox')
  await channelInput.waitFor({ state: 'visible', timeout: 3000 })
  await channelInput.click()
  await channelInput.fill(message)
  await page.waitForTimeout(100)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(100)
}

export async function expectMessageInChannel(page: Page, message: string) {
  const messageInChat = page
    .locator(`[data-testid="channel-main"]`)
    .locator(`text="${message}"`)
  expect(await messageInChat.isVisible({ timeout: 2000 }))
}

export async function openHUD(page: Page) {
  await page.keyboard.press('Meta+f')
  const hudContainer = page.locator('[data-testid="hud-input-container"]')
  await expectToBeVisible(hudContainer, { timeout: 5000 })
}
