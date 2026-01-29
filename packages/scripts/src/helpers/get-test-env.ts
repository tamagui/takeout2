import { readFileSync } from 'node:fs'
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

// read a specific env var directly from .env.development file
// (process.env may have production values if NODE_ENV=production)
function getDevEnvVar(key: string): string | undefined {
  try {
    const envPath = join(process.cwd(), '.env.development')
    const content = readFileSync(envPath, 'utf-8')
    const regex = new RegExp(`^${key}=["']?([^"'\\n]+)["']?`, 'm')
    const match = content.match(regex)
    return match?.[1]
  } catch {
    return undefined
  }
}

function getDevDbPort(): string | undefined {
  const url = getDevEnvVar('ZERO_UPSTREAM_DB')
  return url ? getPortFromConnectionString(url) : undefined
}

export async function getTestEnv() {
  const zeroVersion = getZeroVersion()
  const dockerHost = getDockerHost()
  const devEnv = await loadEnv('development')
  const serverEnvFallback = await import(join(process.cwd(), 'src/server/env-server'))

  // determine db port from (in order of priority):
  // 1. DOCKER_DB_PORT env var
  // 2. port from ZERO_UPSTREAM_DB in .env.development file (read directly to avoid
  //    bun auto-loading .env.production when NODE_ENV=production)
  // 3. default 5432
  const dbPort = process.env.DOCKER_DB_PORT || getDevDbPort() || '5432'

  const dockerDbBase = `postgresql://user:password@127.0.0.1:${dbPort}`

  // use dev BETTER_AUTH_SECRET for CI/staging to match local dev database keys
  // (better-auth encrypts JWKS private keys with this secret, so it must match)
  const devAuthSecret = getDevEnvVar('BETTER_AUTH_SECRET')

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
    // ensure auth secret matches dev db keys
    ...(devAuthSecret && { BETTER_AUTH_SECRET: devAuthSecret }),
  }
}
