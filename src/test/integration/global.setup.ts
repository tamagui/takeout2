import { test as setup } from '@playwright/test'
import { loginAsAdmin } from './helpers'

setup('setup', async ({ page }) => {
  // login and navigate to main app
  await loginAsAdmin(page)

  console.info('✅ Global setup complete')
})
