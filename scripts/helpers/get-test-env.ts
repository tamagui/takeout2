import { loadEnv } from './env-load'
import { getDockerHost } from './get-docker-host'
import { getZeroVersion } from './zero-get-version'

export async function getTestEnv() {
  const zeroVersion = getZeroVersion()
  const devEnv = await loadEnv('development')
  const dockerHost = getDockerHost()
  const serverEnvFallback = await import('../../src/server/env-server')

  return {
    ...serverEnvFallback,
    ...devEnv,
    CI: 'true', // Ensure CI flag is set for test environment
    ...(!process.env.DEBUG_BACKEND && {
      ZERO_LOG_LEVEL: 'warn',
    }),
    DO_NOT_TRACK: '1',
    ZERO_VERSION: zeroVersion,
    ZERO_AUTH_JWKS_URL: `http://${dockerHost}:8081/api/auth/jwks`,
    ZERO_PUSH_URL: `http://${dockerHost}:8081/api/zero/push`,
  }
}
