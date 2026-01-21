import { join } from 'node:path'

import { loadEnv } from './env-load'
import { getDockerHost } from './get-docker-host'
import { getZeroVersion } from './zero-get-version'

// extract the port from a postgres connection string
function getPortFromConnectionString(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    // handle postgresql:// URLs
    const match = url.match(/:(\d+)\//)
    return match?.[1]
  } catch {
    return undefined
  }
}

export async function getTestEnv() {
  const zeroVersion = getZeroVersion()
  const devEnv = await loadEnv('development')
  const dockerHost = getDockerHost()
  const serverEnvFallback = await import(join(process.cwd(), 'src/server/env-server'))

  // determine db port from (in order of priority):
  // 1. DOCKER_DB_PORT env var
  // 2. port from ZERO_UPSTREAM_DB in devEnv
  // 3. default 5432
  const dbPort =
    process.env.DOCKER_DB_PORT ||
    getPortFromConnectionString(devEnv.ZERO_UPSTREAM_DB as string) ||
    '5432'

  const dockerDbBase = `postgresql://user:password@127.0.0.1:${dbPort}`

  return {
    ...serverEnvFallback,
    ...devEnv,
    CI: 'true',
    ...(!process.env.DEBUG_BACKEND && {
      ZERO_LOG_LEVEL: 'warn',
    }),
    DO_NOT_TRACK: '1',
    ZERO_VERSION: zeroVersion,
    ZERO_MUTATE_URL: `http://${dockerHost}:8081/api/zero/push`,
    ZERO_QUERY_URL: `http://${dockerHost}:8081/api/zero/pull`,
    ZERO_UPSTREAM_DB: `${dockerDbBase}/postgres`,
    ZERO_CVR_DB: `${dockerDbBase}/zero_cvr`,
    ZERO_CHANGE_DB: `${dockerDbBase}/zero_cdb`,
    CLOUDFLARE_R2_ENDPOINT: 'http://127.0.0.1:9200',
    CLOUDFLARE_R2_PUBLIC_URL: 'http://127.0.0.1:9200',
    CLOUDFLARE_R2_ACCESS_KEY: 'minio',
    CLOUDFLARE_R2_SECRET_KEY: 'minio_password',
  }
}
