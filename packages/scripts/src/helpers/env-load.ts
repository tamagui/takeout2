import { join } from 'node:path'

import { loadEnv as vxrnLoadEnv } from 'vxrn/loadEnv'

export async function loadEnv(
  environment: 'development' | 'production' | 'dev-prod',
  options?: { optional?: string[]; envPath?: string }
) {
  // loads env into process.env
  await vxrnLoadEnv(environment)

  const Environment = await import(
    options?.envPath || join(process.cwd(), 'src/server/env-server.ts')
  )

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
