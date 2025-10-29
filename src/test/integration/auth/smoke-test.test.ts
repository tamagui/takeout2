/**
 * Smoke test to verify auth backend is working
 */

import { test, expect } from '@playwright/test'

test('auth backend smoke test', async ({ page }) => {
  console.log('\n=== Testing auth backend connectivity ===')

  // Test 1: Health check
  const healthResponse = await page.request.get('http://localhost:8081/api/health')
  console.log('Health check:', healthResponse.status())

  // Test 2: Auth session endpoint
  const sessionResponse = await page.request.get('http://localhost:8081/api/auth/get-session')
  console.log('Session endpoint:', sessionResponse.status())
  expect(sessionResponse.status()).toBe(200)

  const sessionData = await sessionResponse.json()
  console.log('Session data:', sessionData)

  // Test 3: Try admin signup via API
  console.log('\n=== Testing admin signup via API ===')
  const signupResponse = await page.request.post('http://localhost:8081/api/auth/sign-up/email', {
    data: {
      name: 'Admin',
      email: 'admin@fleek.xyz',
      password: 'password123',
    },
    headers: {
      'Content-Type': 'application/json',
    }
  })

  console.log('Signup response:', signupResponse.status())
  const signupBody = await signupResponse.text()
  console.log('Signup body:', signupBody)

  // Test 4: Try login
  console.log('\n=== Testing admin login via API ===')
  const loginResponse = await page.request.post('http://localhost:8081/api/auth/sign-in/email', {
    data: {
      email: 'admin@fleek.xyz',
      password: 'password123',
    },
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:8081',
    }
  })

  console.log('Login response:', loginResponse.status())
  const loginBody = await loginResponse.json()
  console.log('Login body:', JSON.stringify(loginBody, null, 2))

  // Check if we got a session
  if (loginBody.user) {
    console.log('✅ Login successful! User:', loginBody.user.email)
  } else {
    console.log('❌ Login failed:', loginBody)
  }
})
