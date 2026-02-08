import fs from 'node:fs'
import { join } from 'node:path'

import { loadEnv as vxrnLoadEnv } from 'vxrn/loadEnv'

export async function loadEnv(
  environment: 'development' | 'production' | 'dev-prod',
  options?: { optional?: string[]; envPath?: string }
) {
  // loads env into process.env
  await vxrnLoadEnv(environment)

  const envPath = options?.envPath || resolveEnvServerPath()

  const Environment = await import(envPath)

  // validate
  for (const key in Environment) {
    if (options?.optional?.includes(key)) {
      continue
    }
    if (typeof Environment[key as keyof typeof Environment] === 'undefined') {
      console.warn(`Missing key: ${key}`)
    }
  }

  return Environment
}

function resolveEnvServerPath(): string {
  const candidates = ['src/constants/env-server.ts', 'src/server/env-server.ts']
  for (const candidate of candidates) {
    const full = join(process.cwd(), candidate)
    if (fs.existsSync(full)) {
      return full
    }
  }
  // fall back to first candidate for error message
  return join(process.cwd(), 'src/constants/env-server.ts')
}
