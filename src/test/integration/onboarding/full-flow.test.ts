import { test, expect } from '@playwright/test'

test.beforeEach(async ({ context }) => {
  await context.clearCookies()
})

test.skip('complete onboarding flow', async ({ page }) => {
  const BASE_URL = 'http://localhost:8081'
  const testEmail = `test${Date.now()}@example.com`

  await page.goto(BASE_URL)
  await page.click('text=Login')
  await page.waitForURL('**/login')

  await page.fill('[data-testid="email-input"]', testEmail)
  await page.click('[data-testid="send-magic-link-button"]')
  await page.waitForURL('**/signup/otp**', { timeout: 10000 })

  await page.waitForTimeout(2000)
  const otpResponse = await fetch(
    `${BASE_URL}/api/dev/get-otp?email=${encodeURIComponent(testEmail)}`
  )
  const { otp } = await otpResponse.json()

  for (let i = 0; i < 6; i++) {
    await page.locator(`[data-testid="otp-input-${i}"]`).fill(otp[i])
    await page.waitForTimeout(50)
  }

  await page.waitForURL('**/profile-setup', { timeout: 10000 })

  const username = `testuser${Math.floor(Math.random() * 10000)}`
  await page.fill('input[placeholder="johndoe"]', username)
  await page.waitForTimeout(3000)

  const nextButton = page.locator('button:has-text("Next")')
  await expect(nextButton).toBeEnabled({ timeout: 10000 })
  await nextButton.click()

  await page.waitForURL('**/avatar-setup', { timeout: 10000 })
  expect(page.url()).toContain('/avatar-setup')
})
