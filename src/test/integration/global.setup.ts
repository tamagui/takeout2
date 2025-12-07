import { test as setup } from '@playwright/test'

import { loginAsAdmin } from './helpers'

// This setup is currently commented out in playwright.config.ts
// To enable: Uncomment the 'setup' project and 'chromium-with-auth' project in playwright.config.ts
// Then auth tests will run with admin pre-logged in

setup('setup', async ({ page }) => {
  await loginAsAdmin(page)
  console.info('✅ Global setup complete')
})
