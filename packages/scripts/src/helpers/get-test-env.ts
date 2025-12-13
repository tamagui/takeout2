import { join } from 'node:path'

import { loadEnv } from './env-load'
import { getDockerHost } from './get-docker-host'
import { getZeroVersion } from './zero-get-version'

export async function getTestEnv() {
  const zeroVersion = getZeroVersion()
  const devEnv = await loadEnv('development')
  const dockerHost = getDockerHost()
  const serverEnvFallback = await import(join(process.cwd(), 'src/server/env-server'))

  // docker database URLs - must be explicit since vxrn loadEnv doesn't override existing env vars
  const dockerDbBase = `postgresql://user:password@127.0.0.1:5433`

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
  }
}
