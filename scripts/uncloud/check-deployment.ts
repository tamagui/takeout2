#!/usr/bin/env bun

import { cmd } from '@take-out/cli'
import {
  checkRestartLoops,
  getContainerStatus as getContainerStatusHelper,
  checkContainerHealth as checkContainerHealthHelper,
  checkHttpHealth as checkHttpHealthHelper,
  getContainerLogs as getContainerLogsHelper,
  type SSHContext,
} from '@take-out/scripts/helpers/deploy-health'

await cmd`Check deployment health`.run(async ({ $, fs }) => {
  const TIMEOUT = 5 * 60 * 1000 // 5 minutes
  const CHECK_INTERVAL = 10000 // 10 seconds
  const PROGRESS_UPDATE_INTERVAL = 30000 // 30 seconds for progress updates
  const HEALTH_CHECK_GRACE_PERIOD = 45000 // docker health check startup allowance

  // state tracking
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

  // parse arguments
  const args = process.argv.slice(2)
  const verbose = args.includes('--verbose') || args.includes('-v')
  const help = args.includes('--help') || args.includes('-h')

  if (help) {
    console.info(`
Uncloud Deployment Health Check

Usage: bun tko uncloud check-deployment [options]

Options:
  --verbose, -v    Show detailed logs and container output
  --help, -h       Show this help message

Monitors the deployment and exits when all services are healthy or on timeout.
`)
    process.exit(0)
  }

  // load environment from env vars (CI) or .env.production (local)
  const envFile = '.env.production'
  let deployHost: string | undefined = process.env.DEPLOY_HOST
  let deployUser: string | undefined = process.env.DEPLOY_USER || 'root'
  let deploySshKey: string | undefined = process.env.DEPLOY_SSH_KEY

  // try to load from .env.production if env vars not set (local use)
  if (!deployHost) {
    try {
      const envContent = await fs.promises.readFile(envFile, 'utf-8')
      envContent.split('\n').forEach((line) => {
        const [key, value] = line.split('=')
        if (key === 'DEPLOY_HOST') deployHost = value?.trim()
        if (key === 'DEPLOY_USER') deployUser = value?.trim()
        if (key === 'DEPLOY_SSH_KEY') deploySshKey = value?.trim()
      })
    } catch {
      // file doesn't exist - likely running in CI without deployment configured
    }
  }

  if (!deployHost) {
    console.error('DEPLOY_HOST not set')
    console.error('for local: add to .env.production')
    console.error('for CI: ensure DEPLOY_HOST is in GitHub secrets')
    process.exit(1)
  }

  // build SSH options - use identity file if key path exists
  const sshIdentity =
    deploySshKey && deploySshKey.startsWith('/') ? `-i ${deploySshKey}` : ''
  const sshOpts =
    `${sshIdentity} -o ConnectTimeout=10 -o StrictHostKeyChecking=no -o BatchMode=yes`.trim()

  // create ssh context for shared helpers
  const sshCtx: SSHContext = {
    sshOpts,
    deployUser: deployUser!,
    deployHost: deployHost!,
    $,
  }

  // wrapper functions using shared helpers
  async function getContainerStatus() {
    return getContainerStatusHelper(sshCtx, { verbose })
  }

  async function checkContainerHealth(containerId: string) {
    const result = await checkContainerHealthHelper(sshCtx, containerId)
    return result === 'healthy'
  }

  async function getContainerLogs(containerId: string, lines = 20) {
    return getContainerLogsHelper(sshCtx, containerId, lines)
  }

  async function checkHttpHealth() {
    return checkHttpHealthHelper(sshCtx, { endpoint: 'http://localhost:8081/api/health' })
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
      state.status === 'running'
        ? state.healthy
          ? 'healthy'
          : 'unhealthy'
        : state.status
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

    // check for restart loops first - fail fast if containers are looping
    console.info('checking for restart loops...')
    const initialLoops = await checkRestartLoops(sshCtx)
    if (initialLoops.hasLoop) {
      console.error(`restart loop detected: ${initialLoops.services.join(', ')}`)
      console.error('containers are crash-looping - deployment unhealthy')
      process.exit(1)
    }
    console.info('  no restart loops detected')
    console.info('')

    // quick initial check
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

      // check for restart loops
      const loops = await checkRestartLoops(sshCtx)
      if (loops.hasLoop) {
        console.error(`  restart loop detected: ${loops.services.join(', ')}`)
        console.error('containers are crash-looping - deployment failed')
        process.exit(1)
      }

      // get current state
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
          console.info(
            `  ${serviceName}: ${state.healthy ? '✅ healthy' : '⏳ checking'}`
          )

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
        console.info(
          `  ✅ all healthy (${consecutiveHealthyChecks}/2 consecutive checks)`
        )

        // Require 2 consecutive healthy checks for stability
        if (consecutiveHealthyChecks >= 2 && !allHealthyDetected) {
          allHealthyDetected = true
          console.info('')
          console.info(`✅ all services healthy and stable!`)
          console.info(`🎉 deployment successful!`)

          // Show access info
          const webHost = process.env.VITE_WEB_HOSTNAME || deployHost
          const zeroHost = process.env.VITE_ZERO_HOSTNAME
          console.info()
          console.info(`  web:  https://${webHost}`)
          if (zeroHost) {
            console.info(`  zero: https://${zeroHost}`)
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

  // run monitoring
  await monitor().catch((error) => {
    console.error('❌ Monitoring failed:', error)
    process.exit(1)
  })
})
