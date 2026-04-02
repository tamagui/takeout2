import { test, expect, type Page } from '@playwright/test'
import { ports } from '~/env'

const BASE_URL = `http://localhost:${ports.web}`

test.describe('Basic Integration Tests', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('server should be running', async () => {
    const response = await page.goto(`${BASE_URL}/auth/login`, {
      waitUntil: 'domcontentloaded',
    })
    expect(response?.status()).toBe(200)
  })
})
