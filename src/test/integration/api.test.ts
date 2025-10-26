import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8081'

test.describe('API Integration Tests', () => {
  test('health endpoint should return ok status', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`)

    expect(response.ok()).toBe(true)
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()

    // verify timestamp is valid ISO string
    const timestamp = new Date(data.timestamp)
    expect(timestamp.toISOString()).toBe(data.timestamp)
  })

  test('health endpoint should respond quickly', async ({ request }) => {
    const start = Date.now()
    const response = await request.get(`${BASE_URL}/api/health`)
    const end = Date.now()

    expect(response.ok()).toBe(true)
    expect(end - start).toBeLessThan(1000) // should respond within 1 second
  })
})
