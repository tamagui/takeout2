import { test, expect } from '@playwright/test'
import { ports } from '~/env'

const BASE_URL = `http://localhost:${ports.web}`

test.describe('Docs Pages', () => {
  test('should load docs home page', async ({ page }) => {
    await page.goto(`${BASE_URL}/docs`)
    await expect(page.locator('h1')).toContainText('Documentation')
  })

  test('should load introduction page', async ({ page }) => {
    await page.goto(`${BASE_URL}/docs/introduction`)
    await expect(page.locator('h1')).toContainText('Introduction')
  })

  test('should load getting started page', async ({ page }) => {
    await page.goto(`${BASE_URL}/docs/getting-started`)
    await expect(page.locator('h1')).toContainText('Getting Started')
  })

  test('should have working sidebar navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/docs`)

    // Check that sidebar exists
    const sidebar = page
      .locator('[data-testid="docs-sidebar"]')
      .or(page.locator('text="Introduction"').first())
    await expect(sidebar).toBeVisible()
  })

  test('should render code blocks', async ({ page }) => {
    await page.goto(`${BASE_URL}/docs/getting-started`)

    // Check for code block
    const codeBlock = page.locator('pre code')
    if ((await codeBlock.count()) > 0) {
      await expect(codeBlock.first()).toBeVisible()
    }
  })
})
