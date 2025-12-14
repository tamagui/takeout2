#!/usr/bin/env bun

import { chromium, type ConsoleMessage, type Request, type Response } from '@playwright/test'

const PROD_URL = 'https://takeout.tamagui.dev'

interface Issue {
  type: 'console_error' | 'network_error' | 'redirect' | 'reload' | 'zero_error' | 'performance'
  message: string
  url?: string
  timestamp: number
  details?: any
}

async function investigateProduction() {
  console.info('🔍 Deep investigation of production site:', PROD_URL)
  console.info('='.repeat(80))

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Playwright Investigation',
  })

  const page = await context.newPage()
  const issues: Issue[] = []
  const navigationHistory: string[] = []
  let reloadCount = 0
  let lastUrl = ''

  // collect console messages
  page.on('console', (msg: ConsoleMessage) => {
    const text = msg.text()
    const type = msg.type()

    if (type === 'error') {
      issues.push({
        type: 'console_error',
        message: text,
        url: page.url(),
        timestamp: Date.now(),
      })
    }

    // specifically look for zero errors
    if (text.includes('Zero') || text.includes('zero') || text.includes('sync') || text.includes('VersionNotSupported')) {
      issues.push({
        type: 'zero_error',
        message: text,
        url: page.url(),
        timestamp: Date.now(),
      })
    }
  })

  // collect page errors
  page.on('pageerror', (error) => {
    issues.push({
      type: 'console_error',
      message: `Page Error: ${error.message}`,
      url: page.url(),
      timestamp: Date.now(),
      details: error.stack,
    })
  })

  // collect network failures
  page.on('requestfailed', (request: Request) => {
    issues.push({
      type: 'network_error',
      message: `Request failed: ${request.url()} - ${request.failure()?.errorText}`,
      url: page.url(),
      timestamp: Date.now(),
    })
  })

  // track navigations and reloads
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      const currentUrl = frame.url()
      navigationHistory.push(currentUrl)

      if (currentUrl === lastUrl && lastUrl !== '') {
        reloadCount++
        issues.push({
          type: 'reload',
          message: `Page reloaded: ${currentUrl}`,
          url: currentUrl,
          timestamp: Date.now(),
        })
      } else if (lastUrl !== '' && lastUrl !== currentUrl) {
        issues.push({
          type: 'redirect',
          message: `Redirected from ${lastUrl} to ${currentUrl}`,
          url: currentUrl,
          timestamp: Date.now(),
        })
      }
      lastUrl = currentUrl
    }
  })

  // track HTTP errors
  page.on('response', async (response: Response) => {
    const status = response.status()
    if (status >= 400) {
      issues.push({
        type: 'network_error',
        message: `HTTP ${status}: ${response.url()}`,
        url: response.url(),
        timestamp: Date.now(),
      })
    }
  })

  try {
    // test 1: login page load
    console.info('\n📍 Test 1: Loading login page...')
    await page.goto(`${PROD_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000) // wait for any late errors/reloads

    // check for visual stability (layout shift detection)
    const loginPageMetrics = await page.evaluate(() => {
      return {
        documentHeight: document.documentElement.scrollHeight,
        bodyChildCount: document.body.childElementCount,
        hasFlicker: document.querySelectorAll('[style*="opacity"]').length,
        visibleButtons: document.querySelectorAll('button:not([style*="display: none"])').length,
      }
    })
    console.info('   Login page metrics:', loginPageMetrics)

    // check for demo button
    const demoButton = await page.locator('[data-testid="login-as-demo"]').count()
    console.info(`   Demo login button present: ${demoButton > 0}`)

    // test 2: attempt demo login
    console.info('\n📍 Test 2: Attempting demo login...')
    if (demoButton > 0) {
      await page.locator('[data-testid="login-as-demo"]').click()
      await page.waitForTimeout(5000) // wait for login + any redirects

      const afterLoginUrl = page.url()
      console.info(`   After login URL: ${afterLoginUrl}`)

      // wait for page to stabilize
      await page.waitForTimeout(3000)

      // check for zero connection status
      const zeroStatus = await page.evaluate(() => {
        const statusEl = document.querySelector('[data-zero-status]')
        return statusEl?.getAttribute('data-zero-status') || 'not found'
      })
      console.info(`   Zero status: ${zeroStatus}`)
    }

    // test 3: check home page
    console.info('\n📍 Test 3: Checking home page...')
    await page.goto(`${PROD_URL}/home`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    const homePageMetrics = await page.evaluate(() => {
      return {
        documentHeight: document.documentElement.scrollHeight,
        hasContent: document.body.innerText.length > 100,
        errorElements: document.querySelectorAll('[class*="error"], [class*="Error"]').length,
      }
    })
    console.info('   Home page metrics:', homePageMetrics)

  } catch (error) {
    console.error('❌ Investigation error:', error)
    issues.push({
      type: 'console_error',
      message: `Investigation error: ${error}`,
      timestamp: Date.now(),
    })
  }

  await browser.close()

  // print report
  console.info('\n' + '='.repeat(80))
  console.info('📊 INVESTIGATION REPORT')
  console.info('='.repeat(80))

  console.info(`\n📈 Navigation Summary:`)
  console.info(`   Total navigations: ${navigationHistory.length}`)
  console.info(`   Reloads detected: ${reloadCount}`)
  console.info(`   Navigation history:`)
  navigationHistory.forEach((url, i) => console.info(`     ${i + 1}. ${url}`))

  console.info(`\n🚨 Issues Found: ${issues.length}`)

  const groupedIssues = issues.reduce((acc, issue) => {
    acc[issue.type] = acc[issue.type] || []
    acc[issue.type].push(issue)
    return acc
  }, {} as Record<string, Issue[]>)

  for (const [type, typeIssues] of Object.entries(groupedIssues)) {
    console.info(`\n   ${type.toUpperCase()} (${typeIssues.length}):`)
    typeIssues.forEach((issue, i) => {
      console.info(`     ${i + 1}. ${issue.message}`)
      if (issue.details) {
        console.info(`        Details: ${issue.details}`)
      }
    })
  }

  if (issues.length === 0) {
    console.info('   ✅ No issues detected!')
  }

  console.info('\n' + '='.repeat(80))

  return { issues, navigationHistory, reloadCount }
}

investigateProduction().catch(console.error)
