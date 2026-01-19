/**
 * Profile Page Flicker Debug Test
 * Reproduces the issue where profile shows content, then shimmer, then content again
 */

import { test } from '@playwright/test'

import { loginAsDemo } from './helpers'

test('debug profile page flicker on reload then navigate to account', async ({
  page,
}) => {
  test.setTimeout(60000)

  // collect console logs
  const consoleLogs: string[] = []
  page.on('console', (msg) => {
    const text = msg.text()
    if (
      text.includes('[ProfilePage]') ||
      text.includes('[useProfilePosts]') ||
      text.includes('[auth]') ||
      text.includes('[zero]')
    ) {
      consoleLogs.push(`${msg.type()}: ${text}`)
    }
  })

  // login as demo
  await loginAsDemo(page, '/home/feed')

  console.info('--- Logged in, now on /home/feed ---')

  // reload the page (this is key to reproducing the issue)
  console.info('--- Reloading page ---')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // clear logs from reload
  consoleLogs.length = 0

  console.info('--- Navigating to /home/profile ---')

  // navigate directly to profile page
  await page.goto('http://localhost:8081/home/profile', { waitUntil: 'domcontentloaded' })

  // wait and observe
  console.info('--- Waiting to observe flicker ---')
  await page.waitForTimeout(5000)

  // print all collected logs
  console.info('\n=== Console Logs ===')
  for (const log of consoleLogs) {
    console.info(log)
  }
  console.info('=== End Console Logs ===\n')

  // analyze the logs for flicker pattern
  const statusLogs = consoleLogs.filter((log) => log.includes('[useProfilePosts] status'))

  // check if statusType went from complete -> unknown -> complete (flicker)
  let sawComplete = false
  let sawUnknownAfterComplete = false
  let sawCompleteAfterUnknown = false

  for (const log of statusLogs) {
    if (
      log.includes("statusType: 'complete'") ||
      log.includes('statusType: "complete"')
    ) {
      if (sawUnknownAfterComplete) {
        sawCompleteAfterUnknown = true
      }
      sawComplete = true
    }
    if (
      (log.includes("statusType: 'unknown'") || log.includes('statusType: "unknown"')) &&
      sawComplete
    ) {
      sawUnknownAfterComplete = true
    }
  }

  const flickerDetected =
    sawComplete && sawUnknownAfterComplete && sawCompleteAfterUnknown
  console.info(`\n=== Flicker Analysis ===`)
  console.info(`Saw complete: ${sawComplete}`)
  console.info(`Saw unknown after complete: ${sawUnknownAfterComplete}`)
  console.info(`Saw complete after unknown: ${sawCompleteAfterUnknown}`)
  console.info(`FLICKER DETECTED: ${flickerDetected}`)
  console.info(`=== End Analysis ===\n`)

  // also check for the auth token fetch logs
  const authLogs = consoleLogs.filter((log) => log.includes('[auth]'))
  if (authLogs.length > 0) {
    console.info('\n=== Auth Logs ===')
    for (const log of authLogs) {
      console.info(log)
    }
    console.info('=== End Auth Logs ===\n')
  }

  // take a screenshot for visual verification
  await page.screenshot({ path: '/tmp/profile-flicker-test.png' })
  console.info('Screenshot saved to /tmp/profile-flicker-test.png')
})
