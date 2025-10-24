import { loadEnv as vxrnLoadEnv } from 'vxrn/loadEnv'

// safe loading of env, ensures values are set

export async function loadEnv(
  environment: 'development' | 'production' | 'dev-prod',
  options?: { optional?: string[] }
) {
  // loads env into process.env
  await vxrnLoadEnv(environment)

  // get our expected constants
  const Environment = await import('../../src/server/env-server.ts')

  // validate they exist
  for (const key in Environment) {
    if (options?.optional?.includes(key)) {
      continue
    }
    if (!Environment[key as keyof typeof Environment]) {
      if (environment === 'production') {
        console.error(`Missing key: ${key}`)
        process.exit(1)
      } else {
        console.warn(`Skipping env: ${key}`)
      }
    }
  }

  return Environment
}
