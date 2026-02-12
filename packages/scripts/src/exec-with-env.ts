#!/usr/bin/env bun

import { ensureExists } from '@take-out/helpers'

import { cmd } from './cmd'

export async function execWithEnvironment(
  environment: 'development' | 'production',
  command: string
) {
  const { spawnSync } = await import('node:child_process')
  const { loadEnv } = await import('./helpers/env-load')

  const { USE_LOCAL_SERVER } = process.env

  let envFileEnv: Record<string, string>

  if (process.env.REMOTE) {
    await import('./ensure-tunnel')
    const { getEnvironment } = await import('./sst-get-environment')
    envFileEnv = getEnvironment(process.env.REMOTE)
    ensureExists(envFileEnv)
  } else {
    envFileEnv = await loadEnv(environment)
  }

  console.info(
    `($): ${command} | env ${environment} ${USE_LOCAL_SERVER ? '| using local endpoints' : ''}`
  )

  const devEnv = USE_LOCAL_SERVER ? await loadEnv('development') : null

  const env = {
    ...envFileEnv,
    ...process.env,
    // running local server but hitting most prod endpoints except auth
    ...(USE_LOCAL_SERVER && {
      ONE_SERVER_URL: devEnv?.ONE_SERVER_URL,
      // vite reads from .env.production for us unless defined into process.env
      VITE_ZERO_HOSTNAME: 'start.chat',
    }),
  } as any as Record<string, string>

  const parts = command.split(' ')
  return spawnSync(parts[0]!, parts.slice(1), {
    stdio: ['ignore', 'inherit', 'inherit'],
    env,
  })
}

if (import.meta.main) {
  await cmd`execute command with environment variables loaded from local or remote`.run(
    async () => {
      const result = await execWithEnvironment(
        (process.env.NODE_ENV as 'development' | 'production') || 'development',
        process.argv.slice(3).join(' ')
      )
      process.exit(result.status ?? 1)
    }
  )
}
