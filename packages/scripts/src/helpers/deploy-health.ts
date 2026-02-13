/**
 * deployment health check helpers for uncloud deployments
 * shared across repos via @take-out/scripts/helpers/deploy-health
 */

export interface SSHContext {
  sshOpts: string
  deployUser: string
  deployHost: string
  $: (
    strings: TemplateStringsArray,
    ...values: any[]
  ) => { quiet: () => Promise<{ stdout: Buffer }> }
}

export interface ContainerInfo {
  id: string
  status: string
  state: string
  names: string
  isRestarting: boolean
}

/**
 * check for containers stuck in restart loop
 * fails fast if any container is crash-looping
 * excludes init containers (minio-init, migrate) that are expected to exit
 */
export async function checkRestartLoops(
  ctx: SSHContext,
  options?: { excludePatterns?: string[] }
): Promise<{
  hasLoop: boolean
  services: string[]
}> {
  const { sshOpts, deployUser, deployHost, $ } = ctx
  // default exclude patterns for init/oneshot containers
  const excludePatterns = options?.excludePatterns ?? ['init', 'migrate']

  try {
    const sshCmd = `ssh ${sshOpts} ${deployUser}@${deployHost}`
    const result =
      await $`${sshCmd.split(' ')} "docker ps -a --format '{{.Names}} {{.Status}}'"`.quiet()
    const lines = result.stdout.toString().trim().split('\n').filter(Boolean)

    const loopingServices: string[] = []
    for (const line of lines) {
      if (line.includes('Restarting')) {
        const name = line.split(' ')[0] || ''
        // skip init/oneshot containers
        const isExcluded = excludePatterns.some((pattern) => name.includes(pattern))
        if (!isExcluded) {
          loopingServices.push(name)
        }
      }
    }

    return { hasLoop: loopingServices.length > 0, services: loopingServices }
  } catch {
    return { hasLoop: false, services: [] }
  }
}

/**
 * get container status for all running containers
 * extracts service name from container names (handles various naming patterns)
 */
export async function getContainerStatus(
  ctx: SSHContext,
  options?: { verbose?: boolean }
): Promise<Map<string, ContainerInfo>> {
  const { sshOpts, deployUser, deployHost, $ } = ctx
  try {
    const sshCmd = `ssh ${sshOpts} ${deployUser}@${deployHost}`
    // use -a to see all containers including stopped/restarting
    const result = await $`${sshCmd.split(' ')} "docker ps -a --format json"`.quiet()
    const lines = result.stdout.toString().trim().split('\n').filter(Boolean)

    const containers = new Map<string, ContainerInfo>()
    for (const line of lines) {
      try {
        const container = JSON.parse(line)
        const name = container.Names || ''
        let serviceName: string | null = null

        // try various naming patterns
        // pattern 1: "projectname-service-1" or "projectname_service_1"
        let match = name.match(/[^_-]+[_-]([^_-]+)[_-]\w+/)
        if (match) {
          serviceName = match[1]
        } else {
          // pattern 2: "service-xxxx" where xxxx is alphanumeric
          match = name.match(/^([^_-]+)[_-]\w+$/)
          if (match) {
            serviceName = match[1]
          } else {
            // pattern 3: just the name before any dash or underscore
            match = name.match(/^([^_-]+)/)
            if (match) {
              serviceName = match[1]
            }
          }
        }

        if (serviceName) {
          const status = container.Status || ''
          const state = container.State || ''
          const isRestarting = state === 'restarting' || status.includes('Restarting')

          containers.set(serviceName, {
            id: container.ID,
            status,
            state,
            names: container.Names,
            isRestarting,
          })
        }
      } catch {
        // skip invalid json lines
      }
    }

    return containers
  } catch (error) {
    if (options?.verbose) {
      console.error('failed to get container status:', error)
    }
    return new Map()
  }
}

/**
 * check health status of a specific container
 * returns 'healthy', 'checking' (mid-probe), or 'unhealthy'
 */
export async function checkContainerHealth(
  ctx: SSHContext,
  containerId: string
): Promise<'healthy' | 'checking' | 'unhealthy'> {
  const { sshOpts, deployUser, deployHost, $ } = ctx
  try {
    const sshCmd = `ssh ${sshOpts} ${deployUser}@${deployHost}`
    const healthResult =
      await $`${sshCmd.split(' ')} "docker inspect ${containerId} --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}'"`.quiet()
    const healthStatus = healthResult.stdout.toString().trim()

    if (healthStatus === 'healthy') {
      return 'healthy'
    } else if (healthStatus === 'no-healthcheck') {
      // fall back to checking if running for containers without healthcheck
      const statusResult =
        await $`${sshCmd.split(' ')} "docker inspect ${containerId} --format '{{.State.Status}}'"`.quiet()
      const status = statusResult.stdout.toString().trim()
      return status === 'running' ? 'healthy' : 'unhealthy'
    } else if (healthStatus === 'starting') {
      // mid-healthcheck probe, don't treat as failure yet
      return 'checking'
    }

    return 'unhealthy'
  } catch {
    return 'unhealthy'
  }
}

/**
 * check http health endpoint from inside web container
 */
export async function checkHttpHealth(
  ctx: SSHContext,
  options?: { endpoint?: string; containerFilter?: string }
): Promise<{
  healthy: boolean
  status?: number
  message?: string
}> {
  const { sshOpts, deployUser, deployHost, $ } = ctx
  const endpoint = options?.endpoint || 'http://localhost:8081/'
  const containerFilter = options?.containerFilter || 'web'

  try {
    const sshCmd = `ssh ${sshOpts} ${deployUser}@${deployHost}`
    const containersResult =
      await $`${sshCmd.split(' ')} "docker ps --filter 'name=${containerFilter}' --format '{{.Names}}'"`.quiet()
    const webContainer = containersResult.stdout.toString().trim()

    if (!webContainer) {
      return { healthy: false, message: 'web container not found' }
    }

    const result =
      await $`${sshCmd.split(' ')} "docker exec ${webContainer} curl -so /dev/null -w '%{http_code}' -m 5 ${endpoint}"`.quiet()
    const output = result.stdout.toString().trim()
    const statusCode = parseInt(output, 10)

    if (statusCode >= 200 && statusCode < 400) {
      return { healthy: true, status: statusCode }
    } else if (statusCode >= 400 && statusCode < 500) {
      return { healthy: true, status: statusCode, message: 'server running' }
    } else if (statusCode >= 500) {
      return { healthy: false, status: statusCode, message: 'server error' }
    }

    return { healthy: false, message: 'app starting...' }
  } catch {
    return { healthy: false, message: 'app starting...' }
  }
}

/**
 * get recent logs from a container
 */
export async function getContainerLogs(
  ctx: SSHContext,
  containerId: string,
  lines = 20
): Promise<string[]> {
  const { sshOpts, deployUser, deployHost, $ } = ctx
  try {
    const sshCmd = `ssh ${sshOpts} ${deployUser}@${deployHost}`
    const result =
      await $`${sshCmd.split(' ')} "docker logs ${containerId} --tail ${lines} 2>&1"`.quiet()
    return result.stdout.toString().trim().split('\n')
  } catch {
    return []
  }
}
