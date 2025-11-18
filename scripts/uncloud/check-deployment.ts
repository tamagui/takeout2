#!/usr/bin/env bun
/**
 * Uncloud deployment health check script
 * Monitors deployment status and health of services
 * Inspired by chat project's excellent monitoring patterns
 */

import { $ } from 'bun'
import { readFileSync } from 'node:fs'

const TIMEOUT = 3 * 60 * 1000 // 3 minutes
const CHECK_INTERVAL = 3000 // 3 seconds
const PROGRESS_UPDATE_INTERVAL = 15000 // 15 seconds for progress updates

// State tracking
interface ServiceState {
  name: string
  status: 'running' | 'starting' | 'stopped' | 'unknown'
  healthy: boolean
  containerId?: string
  lastChange?: number
}

const serviceStates = new Map<string, ServiceState>()
let lastProgressUpdate = Date.now()
let allHealthyDetected = false
let consecutiveHealthyChecks = 0

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

// Load environment from env vars (CI) or .env.production (local)
const envFile = '.env.production'
let deployHost: string | undefined = process.env.DEPLOY_HOST
let deployUser: string | undefined = process.env.DEPLOY_USER || 'root'

// try to load from .env.production if env vars not set (local use)
if (!deployHost) {
  try {
    const envContent = readFileSync(envFile, 'utf-8')
    envContent.split('\n').forEach((line) => {
      const [key, value] = line.split('=')
      if (key === 'DEPLOY_HOST') deployHost = value?.trim()
      if (key === 'DEPLOY_USER') deployUser = value?.trim()
    })
  } catch (error) {
    // file doesn't exist - likely running in CI without deployment configured
  }
}

if (!deployHost) {
  console.error('❌ DEPLOY_HOST not set')
  console.error('For local: add to .env.production')
  console.error('For CI: ensure DEPLOY_HOST is in GitHub secrets')
  process.exit(1)
}

/**
 * Get container status via SSH using docker ps with better pattern matching
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
        // Try multiple patterns to extract service name
        // Pattern 1: "takeout-web-1" -> "web"
        // Pattern 2: "takeout_web_1" -> "web"
        // Pattern 3: just "web-1" -> "web"
        const name = container.Names || ''
        let serviceName = null

        // try takeout prefix with dash or underscore
        let match = name.match(/takeout[_-]([^_-]+)[_-]\d+/)
        if (match) {
          serviceName = match[1]
        } else {
          // try without takeout prefix
          match = name.match(/^([^_-]+)[_-]\d+$/)
          if (match) {
            serviceName = match[1]
          } else {
            // try just the name before any dash or underscore
            match = name.match(/^([^_-]+)/)
            if (match) {
              serviceName = match[1]
            }
          }
        }

        if (serviceName) {
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
    // Check the /api/health endpoint on port 8081
    const result =
      await $`curl -s -o /dev/null -w "%{http_code}" -m 5 http://${deployHost}:8081/api/health`.quiet()
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
  const expectedServices = ['web', 'zero', 'minio']

  console.info('waiting for services to become healthy...')

  // Quick initial check
  const initialContainers = await getContainerStatus()
  const initialHttpHealth = await checkHttpHealth()

  // Initialize state tracking
  for (const serviceName of expectedServices) {
    const container = initialContainers.get(serviceName)
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
  }

  const monitoredServices = expectedServices

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
    for (const serviceName of monitoredServices) {
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

    // Log significant changes only
    if (hasChanges) {
      const changedServices = Array.from(serviceStates.values()).filter(
        (s) => s.lastChange && currentTime - s.lastChange < CHECK_INTERVAL * 2
      )
      if (changedServices.length > 0) {
        for (const state of changedServices) {
          const icon = state.healthy ? '✅' : state.status === 'running' ? '⏳' : '❌'
          const status = state.healthy ? 'healthy' : 'starting...'
          console.info(`  ${icon} ${state.name}: ${status}`)
        }
      }
    }

    // Periodic minimal progress update
    if (!allHealthy && currentTime - lastProgressUpdate > PROGRESS_UPDATE_INTERVAL) {
      lastProgressUpdate = currentTime
      const unhealthyServices = Array.from(serviceStates.values())
        .filter((s) => !s.healthy)
        .map((s) => s.name)
      if (unhealthyServices.length > 0) {
        console.info(
          `  [${elapsedSeconds}s] waiting for: ${unhealthyServices.join(', ')}`
        )
      }
    }

    // Check for success with stability verification
    if (allHealthy) {
      consecutiveHealthyChecks++

      // Require 2 consecutive healthy checks for stability
      if (consecutiveHealthyChecks >= 2 && !allHealthyDetected) {
        allHealthyDetected = true
        console.info(`✅ all services healthy`)
        console.info(`🎉 deployment successful!`)

        // Show access info
        const webDomain = process.env.WEB_DOMAIN || deployHost
        const zeroDomain = process.env.ZERO_DOMAIN
        console.info()
        console.info(`  web:  https://${webDomain}`)
        if (zeroDomain) {
          console.info(`  zero: https://${zeroDomain}`)
        }

        process.exit(0)
      }
    } else {
      consecutiveHealthyChecks = 0
    }
  }

  // Timeout reached
  const unhealthyServices = Array.from(serviceStates.values()).filter((s) => !s.healthy)

  console.error(
    `\n❌ deployment health check timed out after ${TIMEOUT / 1000 / 60} minutes`
  )
  console.error(
    `\nunhealthy services: ${unhealthyServices.map((s) => s.name).join(', ')}`
  )
  console.error()

  // Show logs for unhealthy services only
  for (const state of unhealthyServices) {
    if (state.containerId) {
      console.error(`📋 ${state.name} logs:`)
      const logs = await getContainerLogs(state.containerId, 15)
      for (const line of logs.slice(-10)) {
        // only last 10 lines
        console.error(`   ${line}`)
      }
      console.error()
    }
  }

  console.error(`💡 troubleshooting:`)
  console.error(`   ssh ${deployUser}@${deployHost}`)
  console.error(`   docker ps`)
  console.error(`   docker logs <container-name>`)

  process.exit(1)
}

// Run monitoring
monitor().catch((error) => {
  console.error('❌ Monitoring failed:', error)
  process.exit(1)
})
