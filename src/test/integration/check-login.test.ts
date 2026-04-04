import { test, expect } from '@playwright/test'
import { ports } from '~/env'

const BASE_URL = `http://localhost:${ports.web}`

test('check login page has demo button', async ({ page }) => {
  // capture console errors and network failures
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(`[page error] ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`)
  })

  const response = await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)

  // dump what we actually got
  const html = await page.content()
  const bodyHtml = await page.locator('body').innerHTML()
  console.info(`response status: ${response?.status()}`)
  console.info(`full html length: ${html.length}`)
  console.info(`body innerHTML length: ${bodyHtml.length}`)
  if (bodyHtml.length < 500) {
    console.info(`body innerHTML: ${bodyHtml}`)
  } else {
    console.info(`body innerHTML (first 500): ${bodyHtml.slice(0, 500)}`)
  }
  if (errors.length) {
    console.info(`errors (${errors.length}):`)
    for (const e of errors) console.info(`  ${e}`)
  }

  // list all buttons and testids
  const buttons = await page.locator('button').all()
  console.info(`Found ${buttons.length} buttons:`)
  for (const btn of buttons) {
    const text = await btn.textContent().catch(() => 'no text')
    const testId = await btn.getAttribute('data-testid').catch(() => null)
    console.info(`  - ${text} [data-testid=${testId}]`)
  }
})
