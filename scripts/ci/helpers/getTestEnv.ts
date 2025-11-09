#!/usr/bin/env bun

import { getDockerHost } from '@take-out/scripts/helpers/get-docker-host'
import { getTestEnv } from '@take-out/scripts/helpers/get-test-env'

export async function getTestWebEnv() {
  process.env.NODE_ENV = 'test'

  const testEnv = await getTestEnv()
  return {
    ...testEnv,
    IS_TESTING: '1',
    DISABLE_CLIENT_OPTIMIZE: '1',
    DISABLE_METRO: '1', // not testing native here
    ONE_SERVER_URL: 'http://localhost:8081',
    DOCKER_BUILDKIT_PROGRESS: 'plain',
    COMPOSE_ANSI: 'never',
    BUILDKIT_PROGRESS: 'plain',
    BETTER_AUTH_URL: 'http://localhost:8081',
    ...(getDockerHost() !== 'host.docker.internal' && {
      FORCE_ISSUER: new URL(testEnv.ZERO_AUTH_JWKS_URL).origin,
    }),
  }
}
