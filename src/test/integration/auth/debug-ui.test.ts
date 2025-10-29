import { test } from '@playwright/test'

test('debug login page rendering', async ({ page }) => {
  console.log('Navigating to login page...')

  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('[PAGE ERROR]:', msg.text())
    }
  })

  page.on('pageerror', (error) => {
    console.log('[PAGE EXCEPTION]:', error.message)
  })

  await page.goto('http://localhost:8081/login?showAdmin', {
    waitUntil: 'domcontentloaded',
  })

  await page.waitForTimeout(5000)

  // Take screenshot
  await page.screenshot({ path: 'login-page-debug.png', fullPage: true })
  console.log('Screenshot saved to login-page-debug.png')

  // Get all test IDs on page
  const testIds = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-testid]')
    return Array.from(elements).map((el) => el.getAttribute('data-testid'))
  })

  console.log('Test IDs found on page:', testIds)

  // Get page text
  const bodyText = await page.textContent('body')
  console.log('Page text preview:', bodyText?.substring(0, 500))
})
