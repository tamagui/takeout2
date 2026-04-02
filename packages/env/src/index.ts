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

// --- expected sentinel ---

/** marker for env vars that must be provided at runtime */
export const expected: unique symbol = Symbol.for('take-out/env/expected')
export type Expected = typeof expected

// --- types ---

type EnvValue = string | Expected

type EnvConfig<
  TPorts extends Record<string, number>,
  TBase extends Record<string, EnvValue>,
  TDev extends Record<string, EnvValue>,
  TProd extends Record<string, EnvValue>,
> = {
  /** base port numbers (before PORT_OFFSET) */
  ports: TPorts
  /** env vars shared across all modes */
  base: TBase
  /** dev-mode env vars — function form receives computed ports */
  development: ((ctx: { ports: Resolved<TPorts>; portOffset: number }) => TDev) | TDev
  /** production env vars */
  production: TProd
}

type Resolved<T extends Record<string, number>> = { [K in keyof T]: number }

type AllKeys<TBase, TDev, TProd> =
  | (keyof TBase & string)
  | (keyof TDev & string)
  | (keyof TProd & string)
  | 'NODE_ENV'

type EnvMap<TBase, TDev, TProd> = { [K in AllKeys<TBase, TDev, TProd>]: string }

type EnvResult<
  TPorts extends Record<string, number>,
  TBase extends Record<string, EnvValue>,
  TDev extends Record<string, EnvValue>,
  TProd extends Record<string, EnvValue>,
> = {
  env: EnvMap<TBase, TDev, TProd>
  /** server-only env — throws if accessed on client (typeof window !== 'undefined') */
  server: EnvMap<TBase, TDev, TProd>
  ports: Resolved<TPorts>
  portOffset: number
  /** raw config for tooling (env-update, generate) */
  config: EnvConfig<TPorts, TBase, TDev, TProd>
  /** set env vars into process.env (skip keys already set) */
  apply: () => void
  /** write .env.development from current env (no-op if PORT_OFFSET is set) */
  writeDotEnv: () => void
  /** import.meta.main handler: writes .env.development then runs argv command */
  run: () => Promise<void>
}

// --- createEnv ---

const validEnvs = { development: true, production: true } as const

export function createEnv<
  TPorts extends Record<string, number>,
  TBase extends Record<string, EnvValue>,
  TDev extends Record<string, EnvValue>,
  TProd extends Record<string, EnvValue>,
>(config: EnvConfig<TPorts, TBase, TDev, TProd>): EnvResult<TPorts, TBase, TDev, TProd> {
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

  // merge base + mode, mode wins
  const merged: Record<string, EnvValue> = {
    ...config.base,
    ...modeEnv,
  }

  // resolve expected values and build final env
  const env = { NODE_ENV } as { [K in AllKeys<TBase, TDev, TProd>]: string }

  for (const [key, val] of Object.entries(merged)) {
    if (val === expected) {
      // check process.env for the value
      const envVal = process.env[key]
      if (envVal !== undefined && envVal !== '') {
        ;(env as any)[key] = envVal
      } else if (NODE_ENV === 'production') {
        throw new Error(`expected env var ${key} to be set in production`)
      } else {
        console.warn(` - expected env ${key} not set`)
        ;(env as any)[key] = ''
      }
    } else {
      ;(env as any)[key] = val
    }
  }

  function apply() {
    // don't overwrite when running inside vite SSR (VITE_ENVIRONMENT is set)
    if (process.env.VITE_ENVIRONMENT) return
    for (const [key, val] of Object.entries(env)) {
      if (process.env[key] === undefined) {
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

  // server-only proxy — throws on client, reads live from process.env
  // reading from process.env at access time prevents build-time inlining
  // and ensures runtime env overrides take effect
  const isClient = () => typeof (globalThis as any).window !== 'undefined'
  const server = new Proxy(env, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && isClient()) {
        throw new Error(`server env var ${prop} accessed on client`)
      }
      // prefer live process.env value over pre-resolved value
      if (typeof prop === 'string' && process.env[prop] !== undefined) {
        return process.env[prop]
      }
      return Reflect.get(target, prop, receiver)
    },
    ownKeys(target) {
      if (isClient()) {
        throw new Error('server env vars accessed on client')
      }
      return Reflect.ownKeys(target)
    },
    has(target, prop) {
      if (isClient()) {
        throw new Error('server env vars accessed on client')
      }
      return Reflect.has(target, prop)
    },
    getOwnPropertyDescriptor(target, prop) {
      if (isClient()) {
        throw new Error('server env vars accessed on client')
      }
      return Reflect.getOwnPropertyDescriptor(target, prop)
    },
  })

  // auto-apply on creation (matches existing behavior where importing env.ts has side effects)
  apply()

  return { env, server, ports, portOffset, config, apply, writeDotEnv, run }
}
