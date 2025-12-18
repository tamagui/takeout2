#!/usr/bin/env bun
/**
 * Uncloud deployment health check script
 * Monitors deployment status and health of services
 * Inspired by chat project's excellent monitoring patterns
 */

import { readFileSync } from 'node:fs'

import { $ } from 'bun'

const TIMEOUT = 5 * 60 * 1000 // 5 minutes
const CHECK_INTERVAL = 10000 // 10 seconds
const PROGRESS_UPDATE_INTERVAL = 30000 // 30 seconds for progress updates
const HEALTH_CHECK_GRACE_PERIOD = 45000 // docker health check startup allowance

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
let deploySshKey: string | undefined = process.env.DEPLOY_SSH_KEY

// try to load from .env.production if env vars not set (local use)
if (!deployHost) {
  try {
    const envContent = readFileSync(envFile, 'utf-8')
    envContent.split('\n').forEach((line) => {
      const [key, value] = line.split('=')
      if (key === 'DEPLOY_HOST') deployHost = value?.trim()
      if (key === 'DEPLOY_USER') deployUser = value?.trim()
      if (key === 'DEPLOY_SSH_KEY') deploySshKey = value?.trim()
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

// build SSH options - use identity file if key path exists
const sshIdentity =
  deploySshKey && deploySshKey.startsWith('/') ? `-i ${deploySshKey}` : ''
const sshOpts =
  `${sshIdentity} -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes`.trim()

/**
 * Get container status via SSH using docker ps with better pattern matching
 */
async function getContainerStatus(): Promise<Map<string, any>> {
  try {
    const sshCmd = `ssh ${sshOpts} ${deployUser}@${deployHost}`
    const result = await $`${sshCmd.split(' ')} "docker ps --format json"`.quiet()
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
        let match = name.match(/takeout[_-]([^_-]+)[_-]\w+/)
        if (match) {
          serviceName = match[1]
        } else {
          // try without takeout prefix (uncloud format: service-xxxx where xxxx is alphanumeric)
          match = name.match(/^([^_-]+)[_-]\w+$/)
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
 * Uses docker's built-in health check status if available
 */
async function checkContainerHealth(containerId: string): Promise<boolean> {
  try {
    const sshCmd = `ssh ${sshOpts} ${deployUser}@${deployHost}`
    // first check if container has a health check configured
    const healthResult =
      await $`${sshCmd.split(' ')} "docker inspect ${containerId} --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}'"`.quiet()
    const healthStatus = healthResult.stdout.toString().trim()

    if (healthStatus === 'healthy') {
      return true
    } else if (healthStatus === 'no-healthcheck') {
      // fall back to checking if running for containers without healthcheck
      const statusResult =
        await $`${sshCmd.split(' ')} "docker inspect ${containerId} --format '{{.State.Status}}'"`.quiet()
      const status = statusResult.stdout.toString().trim()
      return status === 'running'
    }

    // unhealthy, starting, or other health status - not ready yet
    return false
  } catch (error) {
    console.error(`  error checking ${containerId}: ${error}`)
    return false
  }
}

/**
 * Get recent logs from a container
 */
async function getContainerLogs(containerId: string, lines = 20): Promise<string[]> {
  try {
    const sshCmd = `ssh ${sshOpts} ${deployUser}@${deployHost}`
    const result =
      await $`${sshCmd.split(' ')} "docker logs ${containerId} --tail ${lines} 2>&1"`.quiet()
    return result.stdout.toString().trim().split('\n')
  } catch {
    return []
  }
}

/**
 * Check HTTP health endpoint from inside web container
 */
async function checkHttpHealth(): Promise<{
  healthy: boolean
  status?: number
  message?: string
}> {
  try {
    const sshCmd = `ssh ${sshOpts} ${deployUser}@${deployHost}`
    // Get web container name
    const containersResult =
      await $`${sshCmd.split(' ')} "docker ps --filter 'name=web' --format '{{.Names}}'"`.quiet()
    const webContainer = containersResult.stdout.toString().trim()

    if (!webContainer) {
      return { healthy: false, message: 'Web container not found' }
    }

    // Check the /api/health endpoint from inside the container
    // use -f to fail on HTTP errors, check exit code separately
    const result =
      await $`${sshCmd.split(' ')} "docker exec ${webContainer} curl -sf -o /dev/null -w '%{http_code}' -m 5 http://localhost:8081/api/health || echo $?"`.quiet()
    const output = result.stdout.toString().trim()

    // if output is just a number 0-255, curl failed (exit code)
    if (/^\d{1,3}$/.test(output) && parseInt(output, 10) !== 200) {
      // curl failed - app not ready yet, keep trying
      return { healthy: false, message: 'App starting...' }
    }

    const statusCode = parseInt(output, 10)

    if (statusCode === 200) {
      return { healthy: true, status: statusCode }
    } else if (statusCode === 302) {
      return { healthy: true, status: statusCode, message: 'Redirect (auth working)' }
    } else if (statusCode === 404) {
      return { healthy: true, status: statusCode, message: 'Not found (server running)' }
    } else if (statusCode >= 500) {
      return { healthy: false, status: statusCode, message: 'Server error' }
    }

    return { healthy: false, message: 'App starting...' }
  } catch {
    // container or curl command failed - app not ready yet
    return { healthy: false, message: 'App starting...' }
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
  console.info('')

  // Quick initial check
  console.info('checking initial container status...')
  const initialContainers = await getContainerStatus()
  console.info(`found ${initialContainers.size} containers`)

  const initialHttpHealth = await checkHttpHealth()
  console.info(
    `http health: ${initialHttpHealth.healthy ? '✅' : '❌'} ${initialHttpHealth.message || ''}`
  )
  console.info('')

  // Initialize state tracking
  console.info('checking service health:')
  let allInitiallyHealthy = initialHttpHealth.healthy
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
      const icon = state.healthy ? '✅' : '⏳'
      console.info(
        `  ${icon} ${serviceName}: ${state.status} (${state.healthy ? 'healthy' : 'checking...'})`
      )
      if (!state.healthy) {
        allInitiallyHealthy = false
      }
    } else {
      console.info(`  ❌ ${serviceName}: not found`)
      allInitiallyHealthy = false
    }
    detectStateChanges(state)
  }
  console.info('')

  const monitoredServices = expectedServices

  // only wait for grace period if services aren't already healthy
  if (!allInitiallyHealthy) {
    console.info(
      `waiting ${HEALTH_CHECK_GRACE_PERIOD / 1000}s for docker health check grace period...`
    )
    await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_GRACE_PERIOD))
  } else {
    console.info('✅ all services already healthy, skipping grace period')
  }
  console.info('starting health monitoring...')
  console.info('')

  // Monitoring loop
  while (Date.now() - startTime < TIMEOUT) {
    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL))

    const currentTime = Date.now()
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000)

    console.info(`[${elapsedSeconds}s] checking health...`)

    // Get current state
    const containers = await getContainerStatus()
    console.info(`  containers found: ${containers.size}`)

    const httpHealth = await checkHttpHealth()
    console.info(`  http health: ${httpHealth.healthy ? '✅' : '❌'}`)
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
        console.info(`  ${serviceName}: ${state.healthy ? '✅ healthy' : '⏳ checking'}`)

        // in verbose mode, show why service is unhealthy
        if (verbose && !state.healthy && state.status === 'running') {
          const sshCmd = `ssh ${sshOpts} ${deployUser}@${deployHost}`
          const healthResult =
            await $`${sshCmd.split(' ')} "docker inspect ${container.id} --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}'"`.quiet()
          const healthStatus = healthResult.stdout.toString().trim()
          console.info(`    [debug] health status = ${healthStatus}`)
        }
      } else {
        console.info(`  ${serviceName}: ❌ not found`)
      }

      if (detectStateChanges(state)) {
        hasChanges = true
      }

      if (!state.healthy || state.status !== 'running') {
        allHealthy = false
      }
    }

    console.info(`  all healthy: ${allHealthy}`)
    console.info('')

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
      console.info(`  ✅ all healthy (${consecutiveHealthyChecks}/2 consecutive checks)`)

      // Require 2 consecutive healthy checks for stability
      if (consecutiveHealthyChecks >= 2 && !allHealthyDetected) {
        allHealthyDetected = true
        console.info('')
        console.info(`✅ all services healthy and stable!`)
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
      if (consecutiveHealthyChecks > 0) {
        console.info(`  ⚠️  health check failed, resetting counter`)
      }
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
