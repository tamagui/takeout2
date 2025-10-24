import { expect, test, type Page } from '@playwright/test'
import { loginAsAdmin } from './helpers'

const BASE_URL = 'http://localhost:8081'

// TODO never got this working i think

test.skip('jobs system integration tests', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    await loginAsAdmin(page)
  })

  test.afterAll(async () => {
    await page.close()
  })

  test('admin can access jobs page', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    const heading = await page.getByText('jobs admin')
    expect(await heading.isVisible()).toBe(true)
  })

  test('insert test job button creates a job', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    await page.getByText('actions').click()

    const insertButton = page.locator('#insert-test-job')
    expect(await insertButton.isVisible()).toBe(true)

    const initialJobCount = await page.locator('table tbody tr').count()

    await insertButton.click()

    await page.waitForTimeout(1000)

    const newJobCount = await page.locator('table tbody tr').count()
    expect(newJobCount).toBeGreaterThan(initialJobCount)
  })

  test('inserted job appears in table with correct status', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    await page.getByText('actions').click()
    await page.locator('#insert-test-job').click()

    await page.waitForTimeout(500)

    const firstRow = page.locator('table tbody tr').first()
    expect(await firstRow.isVisible()).toBe(true)

    const statusCell = firstRow.locator('td').nth(2)
    const statusText = await statusCell.textContent()
    expect(statusText).toMatch(/pending|running/)
  })

  test('insert test fail job creates a failing job', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    await page.getByText('actions').click()

    const insertFailButton = page.locator('#insert-test-fail-job')
    expect(await insertFailButton.isVisible()).toBe(true)

    await insertFailButton.click()

    await page.waitForTimeout(500)

    const jobCount = await page.locator('table tbody tr').count()
    expect(jobCount).toBeGreaterThan(0)
  })

  test('clicking on job row shows details', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    const firstRow = page.locator('table tbody tr').first()
    await firstRow.click()

    await page.waitForTimeout(500)

    const basicInfoSection = page.getByText('basic info')
    expect(await basicInfoSection.isVisible()).toBe(true)

    const timingSection = page.getByText('timing')
    expect(await timingSection.isVisible()).toBe(true)
  })

  test('job details show correct information', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    await page.getByText('actions').click()
    await page.locator('#insert-test-job').click()
    await page.waitForTimeout(500)

    const firstRow = page.locator('table tbody tr').first()
    await firstRow.click()

    await page.waitForTimeout(500)

    const nameLabel = page.getByText('name:')
    expect(await nameLabel.isVisible()).toBe(true)

    const statusLabel = page.getByText('status:')
    expect(await statusLabel.isVisible()).toBe(true)

    const priorityLabel = page.getByText('priority:')
    expect(await priorityLabel.isVisible()).toBe(true)
  })

  test('pagination controls work correctly', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    const previousButton = page.getByText('previous')
    const nextButton = page.getByText('next')

    expect(await previousButton.isVisible()).toBe(true)
    expect(await nextButton.isVisible()).toBe(true)

    const pageInfo = page.getByText(/page \d+ of \d+/)
    expect(await pageInfo.isVisible()).toBe(true)
  })

  test('sorting table updates sort indicator', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    const statusHeader = page.getByText('status')
    await statusHeader.click()

    await page.waitForTimeout(300)

    const headerText = await statusHeader.textContent()
    expect(headerText).toMatch(/↑|↓/)
  })

  test('job status eventually changes from pending', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    await page.getByText('actions').click()
    await page.locator('#insert-test-job').click()

    await page.waitForTimeout(500)

    const firstRow = page.locator('table tbody tr').first()
    await firstRow.click()

    await page.waitForTimeout(1000)

    let attempts = 0
    let status = ''

    while (attempts < 10) {
      await page.reload({ waitUntil: 'networkidle' })
      await page.waitForTimeout(1000)

      const firstRowAfterReload = page.locator('table tbody tr').first()
      await firstRowAfterReload.click()

      const statusElement = page.getByText(/status:/)
      const statusParent = statusElement.locator('..')
      status = (await statusParent.textContent()) || ''

      if (status.includes('completed') || status.includes('failed')) {
        break
      }

      attempts++
      await page.waitForTimeout(2000)
    }

    expect(status).toMatch(/completed|failed/)
  })

  test('completed job shows result section', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    await page.getByText('actions').click()
    await page.locator('#insert-test-job').click()

    await page.waitForTimeout(10000)

    await page.reload({ waitUntil: 'networkidle' })

    const firstRow = page.locator('table tbody tr').first()
    await firstRow.click()

    await page.waitForTimeout(500)

    const resultSection = page.getByText('result')
    const logsSection = page.getByText('logs')

    const hasResult = await resultSection.isVisible()
    const hasLogs = await logsSection.isVisible()

    expect(hasResult || hasLogs).toBe(true)
  })

  test('failed job shows error section', async () => {
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' })

    await page.getByText('actions').click()
    await page.locator('#insert-test-fail-job').click()

    await page.waitForTimeout(10000)

    await page.reload({ waitUntil: 'networkidle' })

    const rows = await page.locator('table tbody tr').all()

    for (const row of rows) {
      const statusCell = row.locator('td').nth(2)
      const status = await statusCell.textContent()

      if (status?.includes('failed')) {
        await row.click()
        await page.waitForTimeout(500)

        const errorSection = page.getByText('error')
        expect(await errorSection.isVisible()).toBe(true)
        break
      }
    }
  })
})
