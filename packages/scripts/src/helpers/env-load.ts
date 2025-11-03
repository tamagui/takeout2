import { loadEnv as vxrnLoadEnv } from 'vxrn/loadEnv'
import { join } from 'node:path'

// safe loading of env, ensures values are set

export async function loadEnv(
  environment: 'development' | 'production' | 'dev-prod',
  options?: { optional?: string[] }
) {
  // loads env into process.env
  await vxrnLoadEnv(environment)

  // get our expected constants
  const Environment = await import(join(process.cwd(), 'src/server/env-server'))

  // validate they exist
  for (const key in Environment) {
    if (options?.optional?.includes(key)) {
      continue
    }
    if (!Environment[key as keyof typeof Environment]) {
      console.warn(`Missing key: ${key}`)
    }
  }

  return Environment
}
