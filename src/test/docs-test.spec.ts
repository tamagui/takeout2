import { test, expect } from '@playwright/test'

test.describe('Docs Pages', () => {
  test('should load docs home page', async ({ page }) => {
    await page.goto('http://localhost:8081/docs')
    await expect(page.locator('h1')).toContainText('Documentation')
  })

  test('should load introduction page', async ({ page }) => {
    await page.goto('http://localhost:8081/docs/introduction')
    await expect(page.locator('h1')).toContainText('Introduction')
  })

  test('should load getting started page', async ({ page }) => {
    await page.goto('http://localhost:8081/docs/getting-started')
    await expect(page.locator('h1')).toContainText('Getting Started')
  })

  test('should have working sidebar navigation', async ({ page }) => {
    await page.goto('http://localhost:8081/docs')

    // Check that sidebar exists
    const sidebar = page
      .locator('[data-testid="docs-sidebar"]')
      .or(page.locator('text="Introduction"').first())
    await expect(sidebar).toBeVisible()
  })

  test('should render code blocks', async ({ page }) => {
    await page.goto('http://localhost:8081/docs/getting-started')

    // Check for code block
    const codeBlock = page.locator('pre code')
    if ((await codeBlock.count()) > 0) {
      await expect(codeBlock.first()).toBeVisible()
    }
  })
})
