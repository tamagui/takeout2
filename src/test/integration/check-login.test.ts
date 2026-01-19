import { test } from '@playwright/test'

test('check login page has demo button', async ({ page }) => {
  await page.goto('http://localhost:8081/auth/login', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  await page.screenshot({ path: '/tmp/login-page.png', fullPage: true })
  console.info('Screenshot saved to /tmp/login-page.png')

  // list all buttons and testids
  const buttons = await page.locator('button').all()
  console.info(`Found ${buttons.length} buttons:`)
  for (const btn of buttons) {
    const text = await btn.textContent().catch(() => 'no text')
    const testId = await btn.getAttribute('data-testid').catch(() => null)
    console.info(`  - ${text} [data-testid=${testId}]`)
  }
})
