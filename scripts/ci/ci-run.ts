#!/usr/bin/env bun

import { getDockerHost } from '../helpers/get-docker-host'
import { getTestEnv } from '../helpers/get-test-env'
import { handleProcessExit } from '../helpers/handleProcessExit'
import { run } from '../helpers/run'

export async function getTestWebEnv() {
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

export async function ciServeWeb() {
  return await run(`bun web:serve:dev`, {
    detached: true,
    prefix: 'web-serve',
    env: await getTestWebEnv(),
  })
}

export async function ciDevWeb() {
  return await run(`bun one:dev`, {
    prefix: 'web-dev',
    env: await getTestWebEnv(),
  })
}

export async function ciBackend() {
  if (!process.env.SKIP_BACKEND_CLEAN) {
    await run(`bun backend:clean`)
  }
  await run(`bun backend --no-color`, {
    env: await getTestWebEnv(),
  })
}

if (process.env.RUN) {
  handleProcessExit()

  switch (process.env.RUN) {
    case 'frontend-prod': {
      await ciServeWeb()
      break
    }

    case 'frontend-dev': {
      await ciDevWeb()
      break
    }

    case 'backend': {
      await ciBackend()
      break
    }
  }
}
