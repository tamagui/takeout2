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

// extract port from a URL like http://localhost:8081
function getPortFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    return parsed.port || undefined
  } catch {
    return undefined
  }
}

export async function getTestEnv() {
  const zeroVersion = getZeroVersion()
  const dockerHost = getDockerHost()
  const devEnv = await loadEnv('development')
  const serverEnvFallback = await import(join(process.cwd(), 'src/server/env-server'))

  // read ports from PORT_* env vars (set in .env.development) to support per-project configuration
  const dbPort = process.env.PORT_POSTGRES || getDevEnvVar('PORT_POSTGRES') || '5433'
  const appPort = process.env.PORT_WEB || getDevEnvVar('PORT_WEB') || '8081'
  const minioPort = process.env.PORT_MINIO || getDevEnvVar('PORT_MINIO') || '9200'

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
    ZERO_MUTATE_URL: `http://${dockerHost}:${appPort}/api/zero/push`,
    ZERO_QUERY_URL: `http://${dockerHost}:${appPort}/api/zero/pull`,
    ZERO_UPSTREAM_DB: `${dockerDbBase}/postgres`,
    ZERO_CVR_DB: `${dockerDbBase}/zero_cvr`,
    ZERO_CHANGE_DB: `${dockerDbBase}/zero_cdb`,
    CLOUDFLARE_R2_ENDPOINT: `http://127.0.0.1:${minioPort}`,
    CLOUDFLARE_R2_PUBLIC_URL: `http://127.0.0.1:${minioPort}`,
    CLOUDFLARE_R2_ACCESS_KEY: 'minio',
    CLOUDFLARE_R2_SECRET_KEY: 'minio_password',
    // ensure auth secret matches dev db keys
    ...(devAuthSecret && { BETTER_AUTH_SECRET: devAuthSecret }),
  }
}
