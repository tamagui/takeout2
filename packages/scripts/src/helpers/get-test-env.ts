import { join } from 'node:path'

import { loadEnv } from './env-load'
import { getDockerHost } from './get-docker-host'
import { getZeroVersion } from './zero-get-version'

export async function getTestEnv() {
  const zeroVersion = getZeroVersion()
  const devEnv = await loadEnv('development')
  const dockerHost = getDockerHost()
  const serverEnvFallback = await import(join(process.cwd(), 'src/server/env-server'))

  return {
    ...serverEnvFallback,
    ...devEnv,
    CI: 'true', // Ensure CI flag is set for test environment
    ...(!process.env.DEBUG_BACKEND && {
      ZERO_LOG_LEVEL: 'warn',
    }),
    DO_NOT_TRACK: '1',
    ZERO_VERSION: zeroVersion,
    ZERO_MUTATE_URL: `http://${dockerHost}:8081/api/zero/push`,
    ZERO_QUERY_URL: `http://${dockerHost}:8081/api/zero/pull`,
  }
}
