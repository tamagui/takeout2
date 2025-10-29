import { test } from '@playwright/test'

test('simple login page load', async ({ page }) => {
  // Log ALL console messages
  page.on('console', (msg) => {
    const type = msg.type()
    const text = msg.text()
    console.log(`[${type.toUpperCase()}]:`, text)
  })

  // Log page errors
  page.on('pageerror', (error) => {
    console.log('[EXCEPTION]:', error.message)
    console.log(error.stack)
  })

  console.log('\n=== Loading login page ===\n')

  await page.goto('http://localhost:8081/login?showAdmin', {
    waitUntil: 'networkidle',
    timeout: 10000,
  })

  console.log('\n=== Page loaded ===\n')

  // Get entire HTML
  const html = await page.content()
  console.log('HTML length:', html.length)
  console.log('HTML contains "login-as-admin":', html.includes('login-as-admin'))
  console.log('HTML contains "Email":', html.includes('Email'))

  // Get body innerHTML
  const body = await page.evaluate(() => document.body.innerHTML)
  console.log('\n=== Body innerHTML length:', body.length)

  // Count elements
  const elementCount = await page.evaluate(() => document.querySelectorAll('*').length)
  console.log('Total elements:', elementCount)

  // Screenshot
  await page.screenshot({ path: 'simple-render.png', fullPage: true })
  console.log('\n✅ Test complete')
})
