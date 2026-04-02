import { join } from 'node:path'

export async function loadEnv(
  environment: 'development' | 'production' | 'dev-prod',
  options?: { optional?: string[] },
) {
  const { loadEnv: vxrnLoadEnv } = await import('vxrn/loadEnv')

  // loads env into process.env
  await vxrnLoadEnv(environment)

  // import src/env.ts to get the env config applied (side effect: populates process.env)
  const envModule = await import(join(process.cwd(), 'src/env.ts'))
  const Environment = envModule.server || {}

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
