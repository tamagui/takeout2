import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:8081/__soot/'
const waitMs = Number(process.argv[3] || '10000')

function findExecutablePath() {
  const candidates = [
    chromium.executablePath(),
    path.join(
      process.env.HOME || '',
      'Library/Caches/ms-playwright/chromium-1217/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    ),
    path.join(
      process.env.HOME || '',
      'Library/Caches/ms-playwright/chromium-1208/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    ),
    path.join(
      process.env.HOME || '',
      'Library/Caches/ms-playwright/chromium-1194/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    ),
  ]

  return candidates.find((candidate) => candidate && fs.existsSync(candidate))
}

const executablePath = findExecutablePath()
if (!executablePath) {
  throw new Error('No Playwright Chromium executable found in local cache')
}

const browser = await chromium.launch({
  headless: true,
  executablePath,
})

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
})

const consoleMessages = []
const pageErrors = []
const failedRequests = []
const responses = []

page.on('console', (msg) => {
  consoleMessages.push({
    type: msg.type(),
    text: msg.text(),
  })
})

page.on('pageerror', (error) => {
  pageErrors.push({
    message: error.message,
    stack: error.stack || '',
  })
})

page.on('requestfailed', (request) => {
  failedRequests.push({
    url: request.url(),
    method: request.method(),
    failure: request.failure()?.errorText || 'unknown',
  })
})

page.on('response', async (response) => {
  if (response.status() >= 400) {
    responses.push({
      status: response.status(),
      url: response.url(),
    })
  }
})

const result = {
  url,
  status: null,
  finalUrl: null,
  title: null,
  canvasCount: 0,
  bodyText: '',
  consoleMessages: [],
  pageErrors: [],
  failedRequests: [],
  badResponses: [],
}

try {
  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  })

  result.status = response?.status() ?? null
  await page.waitForTimeout(waitMs)

  result.finalUrl = page.url()
  result.title = await page.title()
  result.canvasCount = await page.locator('canvas').count()
  result.bodyText = (await page.locator('body').innerText()).slice(0, 1000)
  result.consoleMessages = consoleMessages.slice(0, 200)
  result.pageErrors = pageErrors.slice(0, 50)
  result.failedRequests = failedRequests.slice(0, 50)
  result.badResponses = responses.slice(0, 100)
} finally {
  await page
    .screenshot({
      path: '/tmp/sootsim-debug.png',
      fullPage: true,
    })
    .catch(() => {})
  await browser.close()
}

console.log(JSON.stringify(result, null, 2))
