#!/usr/bin/env bun

import { ensureExists } from '@vxrn/helpers'
import { loadEnv } from '@vxrn/scripts/helpers/env-load'

export async function execWithEnvironment(
  environment: 'development' | 'production',
  command: string
) {
  const { USE_LOCAL_SERVER } = process.env

  let envFileEnv: Record<string, string>

  if (process.env.REMOTE) {
    await import('@vxrn/scripts/ensure-tunnel')
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
      VITE_PUBLIC_ZERO_SERVER: 'https://start.chat',
      // actually we need to use prod better auth but allow localhost trusted origin, may need other env though
      // BETTER_AUTH_SECRET: devEnv?.BETTER_AUTH_SECRET,
      // BETTER_AUTH_URL: devEnv?.BETTER_AUTH_URL,
    }),
  } as any as Record<string, string>

  return Bun.spawnSync(command.split(' '), {
    stdin: 'ignore',
    stdout: 'inherit',
    stderr: 'inherit',
    env,
  })
}

if (import.meta.main) {
  const result = await execWithEnvironment(
    (process.env.NODE_ENV as 'development' | 'production') || 'development',
    process.argv.slice(3).join(' ')
  )
  process.exit(result.exitCode)
}
