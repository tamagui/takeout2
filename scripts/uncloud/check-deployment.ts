#!/usr/bin/env bun
/**
 * Uncloud deployment health check script
 * Monitors deployment status and health of services
 * Inspired by chat project's excellent monitoring patterns
 */

import { $ } from 'bun'
import { readFileSync } from 'node:fs'

const TIMEOUT = 5 * 60 * 1000 // 5 minutes
const CHECK_INTERVAL = 5000 // 5 seconds
const VERBOSE_LOG_INTERVAL = 30000 // 30 seconds for verbose logs
const STATUS_OVERVIEW_INTERVAL = 60000 // 1 minute for status overview

// State tracking
interface ServiceState {
  name: string
  status: 'running' | 'starting' | 'stopped' | 'unknown'
  healthy: boolean
  containerId?: string
  lastChange?: number
}

const serviceStates = new Map<string, ServiceState>()
let lastVerboseLog = Date.now()
let lastStatusOverview = Date.now()
let allHealthyDetected = false

// Parse arguments
const args = process.argv.slice(2)
const verbose = args.includes('--verbose') || args.includes('-v')
const help = args.includes('--help') || args.includes('-h')

if (help) {
  console.info(`
Uncloud Deployment Health Check

Usage: bun tko uncloud/check-deployment [options]

Options:
  --verbose, -v    Show detailed logs and container output
  --help, -h       Show this help message

Monitors the deployment and exits when all services are healthy or on timeout.
`)
  process.exit(0)
}

// Load environment
const envFile = '.env.production'
let deployHost: string | undefined
let deployUser: string | undefined

try {
  const envContent = readFileSync(envFile, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const [key, value] = line.split('=')
    if (key === 'DEPLOY_HOST') deployHost = value?.trim()
    if (key === 'DEPLOY_USER') deployUser = value?.trim()
  })
} catch (error) {
  console.error('❌ Could not read .env.production - is uncloud configured?')
  process.exit(1)
}

if (!deployHost || !deployUser) {
  console.error('❌ Missing DEPLOY_HOST or DEPLOY_USER in .env.production')
  console.error('Run `bun tko onboard` to configure deployment')
  process.exit(1)
}

/**
 * Get container status via SSH
 */
async function getContainerStatus(): Promise<Map<string, any>> {
  try {
    const result =
      await $`ssh ${deployUser}@${deployHost} "docker ps --format json"`.quiet()
    const lines = result.stdout.toString().trim().split('\n').filter(Boolean)

    const containers = new Map()
    for (const line of lines) {
      try {
        const container = JSON.parse(line)
        // Extract service name from container name (e.g., "takeout-web-1" -> "web")
        const match = container.Names?.match(/takeout[_-]([^_-]+)[_-]\d+/)
        if (match) {
          const serviceName = match[1]
          containers.set(serviceName, {
            id: container.ID,
            status: container.Status,
            state: container.State,
            names: container.Names,
          })
        }
      } catch (e) {
        // skip invalid json lines
      }
    }

    return containers
  } catch (error) {
    if (verbose) {
      console.error('Failed to get container status:', error)
    }
    return new Map()
  }
}

/**
 * Check health status of a specific container
 */
async function checkContainerHealth(containerId: string): Promise<boolean> {
  try {
    const result =
      await $`ssh ${deployUser}@${deployHost} "docker inspect ${containerId} --format '{{.State.Health.Status}}'"`.quiet()
    const health = result.stdout.toString().trim()
    return health === 'healthy'
  } catch {
    return false
  }
}

/**
 * Get recent logs from a container
 */
async function getContainerLogs(containerId: string, lines = 20): Promise<string[]> {
  try {
    const result =
      await $`ssh ${deployUser}@${deployHost} "docker logs ${containerId} --tail ${lines} 2>&1"`.quiet()
    return result.stdout.toString().trim().split('\n')
  } catch {
    return []
  }
}

/**
 * Check HTTP health endpoint
 */
async function checkHttpHealth(): Promise<{
  healthy: boolean
  status?: number
  message?: string
}> {
  try {
    // Try port 8081 first (web service)
    const result =
      await $`curl -s -o /dev/null -w "%{http_code}" -m 5 http://${deployHost}:8081/`.quiet()
    const statusCode = parseInt(result.stdout.toString().trim(), 10)

    if (statusCode === 200) {
      return { healthy: true, status: statusCode }
    } else if (statusCode === 302) {
      return { healthy: true, status: statusCode, message: 'Redirect (auth working)' }
    } else if (statusCode === 404) {
      return { healthy: true, status: statusCode, message: 'Not found (server running)' }
    } else if (statusCode >= 500) {
      return { healthy: false, status: statusCode, message: 'Server error' }
    } else if (statusCode === 0) {
      return { healthy: false, message: 'Connection failed' }
    }

    return { healthy: false, status: statusCode }
  } catch {
    return { healthy: false, message: 'Connection failed' }
  }
}

/**
 * Detect state changes and log them
 */
function detectStateChanges(current: ServiceState): boolean {
  const previous = serviceStates.get(current.name)

  if (!previous) {
    serviceStates.set(current.name, current)
    return true
  }

  const changed =
    previous.status !== current.status || previous.healthy !== current.healthy

  if (changed) {
    current.lastChange = Date.now()
    serviceStates.set(current.name, current)
  }

  return changed
}

/**
 * Format service status for display
 */
function formatServiceStatus(state: ServiceState): string {
  const healthIcon = state.healthy ? '✅' : state.status === 'running' ? '⏳' : '❌'
  const status =
    state.status === 'running' ? (state.healthy ? 'healthy' : 'unhealthy') : state.status
  return `  ${healthIcon} ${state.name}: ${status}`
}

/**
 * Main monitoring loop
 */
async function monitor() {
  const startTime = Date.now()
  console.info('🔍 Monitoring uncloud deployment...\n')

  // Initial status
  const containers = await getContainerStatus()
  const httpHealth = await checkHttpHealth()

  console.info('📊 Initial Status:')

  // Expected services
  const expectedServices = ['web', 'pgdb', 'zero', 'minio']
  for (const serviceName of expectedServices) {
    const container = containers.get(serviceName)
    const state: ServiceState = {
      name: serviceName,
      status: container ? 'running' : 'stopped',
      healthy: false,
      containerId: container?.id,
    }

    if (container?.id) {
      state.healthy = await checkContainerHealth(container.id)
    }

    detectStateChanges(state)
    console.info(formatServiceStatus(state))
  }

  if (httpHealth.healthy) {
    console.info(`  🌐 HTTP: ${httpHealth.status} ${httpHealth.message || ''}`)
  } else {
    console.info(`  🌐 HTTP: ${httpHealth.message || 'Not responding'}`)
  }
  console.info('')

  // Monitoring loop
  while (Date.now() - startTime < TIMEOUT) {
    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL))

    const currentTime = Date.now()
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)

    // Get current state
    const containers = await getContainerStatus()
    const httpHealth = await checkHttpHealth()
    let allHealthy = httpHealth.healthy
    let hasChanges = false

    // Check each service
    for (const serviceName of expectedServices) {
      const container = containers.get(serviceName)
      const state: ServiceState = {
        name: serviceName,
        status: container ? 'running' : 'stopped',
        healthy: false,
        containerId: container?.id,
      }

      if (container?.id) {
        state.healthy = await checkContainerHealth(container.id)
      }

      if (detectStateChanges(state)) {
        hasChanges = true
      }

      if (!state.healthy || state.status !== 'running') {
        allHealthy = false
      }
    }

    // Log state changes
    if (hasChanges) {
      console.info(`[${elapsedSeconds}s] State change detected:`)
      for (const [name, state] of serviceStates) {
        if (state.lastChange && currentTime - state.lastChange < CHECK_INTERVAL * 2) {
          console.info(formatServiceStatus(state))
        }
      }
      console.info('')
    }

    // Verbose logging
    if (verbose && currentTime - lastVerboseLog > VERBOSE_LOG_INTERVAL) {
      lastVerboseLog = currentTime
      console.info(`[${elapsedSeconds}s] Verbose status:`)

      // Show unhealthy service logs
      for (const [name, state] of serviceStates) {
        if (!state.healthy && state.containerId) {
          console.info(`\n  📋 Recent logs from ${name}:`)
          const logs = await getContainerLogs(state.containerId, 5)
          for (const line of logs) {
            console.info(`    ${line}`)
          }
        }
      }
      console.info('')
    }

    // Periodic overview
    if (currentTime - lastStatusOverview > STATUS_OVERVIEW_INTERVAL) {
      lastStatusOverview = currentTime
      console.info(`[${elapsedSeconds}s] Status overview:`)
      for (const [name, state] of serviceStates) {
        console.info(formatServiceStatus(state))
      }
      if (httpHealth.healthy) {
        console.info(`  🌐 HTTP: ${httpHealth.status} ${httpHealth.message || ''}`)
      } else {
        console.info(`  🌐 HTTP: ${httpHealth.message || 'Not responding'}`)
      }
      console.info('')
    }

    // Check for success
    if (allHealthy && !allHealthyDetected) {
      allHealthyDetected = true
      console.info(`✅ [${elapsedSeconds}s] All services are healthy and stable!`)

      // Wait a bit to ensure stability
      await new Promise((resolve) => setTimeout(resolve, 5000))

      // Double-check health
      const finalHealth = await checkHttpHealth()
      if (finalHealth.healthy) {
        console.info(
          `\n🎉 Deployment successful! Application is accessible at http://${deployHost}:8081`
        )
        process.exit(0)
      } else {
        console.warn(
          '⚠️ HTTP check failed after services became healthy, continuing monitoring...'
        )
        allHealthyDetected = false
      }
    }
  }

  // Timeout reached
  console.error(`\n⏱️ Timeout reached after ${TIMEOUT / 1000} seconds`)
  console.error('\n❌ Final status:')

  for (const [name, state] of serviceStates) {
    console.error(formatServiceStatus(state))

    // Show logs for unhealthy services
    if (!state.healthy && state.containerId) {
      console.error(`\n  Recent logs from ${name}:`)
      const logs = await getContainerLogs(state.containerId, 10)
      for (const line of logs) {
        console.error(`    ${line}`)
      }
    }
  }

  process.exit(1)
}

// Run monitoring
monitor().catch((error) => {
  console.error('❌ Monitoring failed:', error)
  process.exit(1)
})
