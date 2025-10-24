import { test, expect, type Page } from '@playwright/test'

const BASE_URL = 'http://localhost:8081'

test.describe('Basic Integration Tests', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('server should be running on port 8081', async () => {
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    expect(response?.status()).toBe(200)
  })

  // test('page should load and log "💬 chat loaded"', async () => {
  //   const consoleMessages: string[] = []

  //   page.on('console', (msg) => {
  //     if (msg.type() === 'log') {
  //       consoleMessages.push(msg.text())
  //     }
  //   })

  //   await page.goto(BASE_URL, { waitUntil: 'networkidle' })

  //   // Wait for the app to fully load
  //   await page.waitForTimeout(3000)

  //   const chatLoadedLog = consoleMessages.some((msg) => msg.includes('💬 chat loaded'))
  //   expect(chatLoadedLog).toBe(true)
  // })

  test('required elements should exist', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })

    // Wait for elements to be rendered
    await page.waitForSelector('#topbar', { timeout: 10000 })
    await page.waitForSelector('#sidebar-content', { timeout: 10000 })

    const topbar = await page.$('#topbar')
    const sidebarContent = await page.$('#sidebar-content')

    expect(topbar).not.toBeNull()
    expect(sidebarContent).not.toBeNull()
  })

  test('should have no error logs', async () => {
    const errorLogs: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      errorLogs.push(error.message)
    })

    await page.goto(BASE_URL, { waitUntil: 'networkidle' })

    // Wait for the app to fully load
    await page.waitForTimeout(3000)

    expect(errorLogs).toHaveLength(0)
  })
})
