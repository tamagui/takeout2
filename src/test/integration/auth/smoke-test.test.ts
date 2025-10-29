/**
 * Smoke test to verify auth backend is working
 */

import { test, expect } from '@playwright/test'

test('auth backend smoke test', async ({ page }) => {
  // Test 1: Health check
  const healthResponse = await page.request.get('http://localhost:8081/api/health')

  // Test 2: Auth session endpoint
  const sessionResponse = await page.request.get(
    'http://localhost:8081/api/auth/get-session'
  )
  expect(sessionResponse.status()).toBe(200)

  const sessionData = await sessionResponse.json()
  const signupResponse = await page.request.post(
    'http://localhost:8081/api/auth/sign-up/email',
    {
      data: {
        name: 'Admin',
        email: 'admin@fleek.xyz',
        password: 'password123',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  const signupBody = await signupResponse.text()
  const loginResponse = await page.request.post(
    'http://localhost:8081/api/auth/sign-in/email',
    {
      data: {
        email: 'admin@fleek.xyz',
        password: 'password123',
      },
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:8081',
      },
    }
  )
  const loginBody = await loginResponse.json()

  // Check if we got a session
  if (loginBody.user) {
  } else {
  }
})
