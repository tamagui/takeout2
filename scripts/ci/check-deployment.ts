#!/usr/bin/env bun

/**
 * @description Check deployment health after CI deployment
 */

import { time, sleep } from '@vxrn/helpers'

const PRODUCTION_URL = process.env.ONE_SERVER_URL || 'https://api.takeout.com'
const MAX_RETRIES = 30
const RETRY_DELAY = time.ms.seconds(10)

console.info('Checking deployment health...')
console.info(`URL: ${PRODUCTION_URL}`)

async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PRODUCTION_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(time.ms.seconds(30)),
    })

    if (response.ok) {
      const data = await response.json()
      console.info('✅ Health check passed:', data)
      return true
    }

    console.warn(`Health check returned status ${response.status}`)
    return false
  } catch (error) {
    console.warn('Health check failed:', error)
    return false
  }
}

async function main() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    console.info(`Attempt ${i + 1}/${MAX_RETRIES}...`)

    if (await checkHealth()) {
      console.info('\n🎉 Deployment is healthy!')
      process.exit(0)
    }

    if (i < MAX_RETRIES - 1) {
      console.info(`Waiting ${RETRY_DELAY / 1000} seconds before retry...`)
      await sleep(RETRY_DELAY)
    }
  }

  console.error('\n❌ Deployment health check failed after all retries')
  process.exit(1)
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
