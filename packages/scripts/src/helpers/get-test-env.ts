import fs from 'node:fs'
import { join } from 'node:path'

import { loadEnv } from './env-load'
import { getDockerHost } from './get-docker-host'

export async function getTestEnv() {
  const dockerHost = getDockerHost()
  const devEnv = await loadEnv('development')
  const envPath =
    ['src/constants/env-server', 'src/server/env-server']
      .map((p) => join(process.cwd(), p))
      .find((p) => fs.existsSync(p + '.ts')) ||
    join(process.cwd(), 'src/constants/env-server')
  const serverEnvFallback = await import(envPath)

  // ports come from VITE_PORT_* in .env.development (loaded by loadEnv)
  const dbPort = process.env.VITE_PORT_POSTGRES || '5433'
  const appPort = process.env.VITE_PORT_WEB || '8081'
  const minioPort = process.env.VITE_PORT_MINIO || '9200'

  const dockerDbBase = `postgresql://user:password@127.0.0.1:${dbPort}`

  return {
    ...serverEnvFallback,
    ...devEnv,
    CI: 'true',
    ...(!process.env.DEBUG_BACKEND && {
      ZERO_LOG_LEVEL: 'warn',
    }),
    DO_NOT_TRACK: '1',
    // force localhost urls so cross-subdomain cookies don't activate in test
    BETTER_AUTH_URL: `http://localhost:${appPort}`,
    ONE_SERVER_URL: `http://localhost:${appPort}`,
    ZERO_MUTATE_URL: `http://${dockerHost}:${appPort}/api/zero/push`,
    ZERO_QUERY_URL: `http://${dockerHost}:${appPort}/api/zero/pull`,
    ZERO_UPSTREAM_DB: `${dockerDbBase}/postgres`,
    ZERO_CVR_DB: `${dockerDbBase}/zero_cvr`,
    ZERO_CHANGE_DB: `${dockerDbBase}/zero_cdb`,
    CLOUDFLARE_R2_ENDPOINT: `http://127.0.0.1:${minioPort}`,
    CLOUDFLARE_R2_PUBLIC_URL: `http://127.0.0.1:${minioPort}`,
    CLOUDFLARE_R2_ACCESS_KEY: 'minio',
    CLOUDFLARE_R2_SECRET_KEY: 'minio_password',
  }
}
