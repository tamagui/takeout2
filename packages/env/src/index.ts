import { existsSync, readFileSync, writeFileSync } from 'node:fs'

// --- ensureEnv (inlined from @take-out/helpers — zero deps) ---

export function ensureEnv(name: string, defaultValue?: string): string {
  if (typeof process.env[name] === 'string') {
    return process.env[name] || defaultValue || ''
  }
  if (defaultValue !== undefined) {
    return defaultValue
  }
  if (process.env.ALLOW_MISSING_ENV) {
    return ''
  }
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    if (typeof defaultValue === 'undefined') {
      console.warn(` - missing env ${name}`)
    }
    return ''
  }
  throw new Error(`Environment variable ${name} not set.`)
}

// --- types ---

type EnvConfig<TPorts extends Record<string, number>> = {
  /** base port numbers (before PORT_OFFSET) */
  ports: TPorts
  /** env vars shared across all modes */
  base: Record<string, string>
  /** dev-mode env vars — function form receives computed ports */
  development:
    | ((ctx: { ports: Resolved<TPorts>; portOffset: number }) => Record<string, string>)
    | Record<string, string>
  /** production env vars */
  production: Record<string, string>
}

type Resolved<T extends Record<string, number>> = { [K in keyof T]: number }

type EnvResult<TPorts extends Record<string, number>> = {
  env: Record<string, string>
  ports: Resolved<TPorts>
  portOffset: number
  /** set env vars into process.env (skip keys already set) */
  apply: () => void
  /** write .env.development from current env (no-op if PORT_OFFSET is set) */
  writeDotEnv: () => void
  /** import.meta.main handler: writes .env.development then runs argv command */
  run: () => Promise<void>
}

// --- createEnv ---

const validEnvs = { development: true, production: true } as const

export function createEnv<TPorts extends Record<string, number>>(
  config: EnvConfig<TPorts>,
): EnvResult<TPorts> {
  const portOffset = Number(process.env.PORT_OFFSET || 0)

  // compute ports with offset
  const ports = {} as Resolved<TPorts>
  for (const [key, base] of Object.entries(config.ports)) {
    ;(ports as any)[key] = (base as number) + portOffset
  }

  // resolve NODE_ENV
  const rawEnv = process.env.NODE_ENV || 'development'
  const NODE_ENV = (rawEnv === 'test' ? 'development' : rawEnv) as keyof typeof validEnvs

  if (!validEnvs[NODE_ENV]) {
    throw new Error(`invalid NODE_ENV: ${rawEnv}`)
  }

  // resolve mode-specific env
  const modeConfig = config[NODE_ENV]
  const modeEnv =
    typeof modeConfig === 'function' ? modeConfig({ ports, portOffset }) : modeConfig

  const env: Record<string, string> = {
    NODE_ENV,
    ...config.base,
    ...modeEnv,
  }

  function apply() {
    // don't overwrite when running inside vite SSR (VITE_ENVIRONMENT is set)
    if (process.env.VITE_ENVIRONMENT) return
    for (const [key, val] of Object.entries(env)) {
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }

  function writeDotEnv() {
    const dotEnvDevPath = '.env.development'
    const dotEnvDev = Object.entries(env)
      .map(([key, val]) => `${key}="${val}"`)
      .join('\n')
    const content = `# managed by src/env.ts!\n${dotEnvDev}`
    if (!existsSync(dotEnvDevPath) || readFileSync(dotEnvDevPath, 'utf-8') !== content) {
      writeFileSync(dotEnvDevPath, content, 'utf8')
    }
  }

  async function run() {
    // write .env.development if default offset and dev mode
    if (
      !process.env.VITE_ENVIRONMENT &&
      !process.env.PORT_OFFSET &&
      NODE_ENV === 'development'
    ) {
      writeDotEnv()
    }

    // run command from argv (after --)
    const sep = process.argv.indexOf('--')
    const cmd = sep >= 0 ? process.argv.slice(sep + 1) : process.argv.slice(2)
    if (cmd.length) {
      const proc = (globalThis as any).Bun.spawn(cmd, {
        env: process.env,
        stdio: ['inherit', 'inherit', 'inherit'],
      })
      process.exitCode = await proc.exited
    }
  }

  // auto-apply on creation (matches existing behavior where importing env.ts has side effects)
  apply()

  return { env, ports, portOffset, apply, writeDotEnv, run }
}
