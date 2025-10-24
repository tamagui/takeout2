import { test as setup } from '@playwright/test'
import {
  finishOnboarding,
  loginAsAdmin,
  setupTamaguiServer,
  setupTestUsers,
} from './helpers'

setup('setup', async ({ page }) => {
  // login and navigate to main app
  await loginAsAdmin(page)

  await page.waitForSelector('[data-testid="app-container"]', { timeout: 30000 })
  await page.waitForTimeout(200)

  const alreadySetup = await page.locator(`.server-item-tamagui`).count()

  if (!alreadySetup) {
    await finishOnboarding(page)
    await setupTamaguiServer(page)
    await setupTestUsers(page)
  }

  console.info('✅ Global setup complete')
})
