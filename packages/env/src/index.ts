/**
 * `@take-out/env` is intentionally a dual-use module:
 *
 * 1. It must be safe to import from browser/client code.
 * 2. It must still be able to do useful server-only work for local development
 *    and tooling.
 *
 * That contract matters because app-level `src/env.ts` files often re-export
 * values from `createEnv(...)`, and those modules are sometimes imported from
 * shared or client-facing code. If this package statically imports Node-only
 * builtins such as `node:fs`, Vite and other browser bundlers will pull a
 * server-only dependency into the client graph and fail at build/runtime.
 *
 * The rules for this file are therefore:
 *
 * - Importing this module must be browser-safe.
 * - Reading `process.env` at import/evaluation time is allowed.
 * - Node-only behavior must stay behind lazy server checks.
 * - The heavy / side-effectful dev workflow is expected to happen through
 *   `result.run()` from the parent `src/env.ts` entrypoint.
 *
 * In practice that means:
 *
 * - We do not use a static top-level `node:fs` import here.
 * - Filesystem access is resolved lazily via `process.getBuiltinModule`.
 * - Browser imports can still access resolved env values without touching fs.
 * - Server/dev code can still read managed `.env.development`, write it back,
 *   and inspect `package.json` versions when those features are used.
 *
 * If this file starts needing more server-only behavior over time, keep that
 * logic lazy and gated. Do not reintroduce top-level Node builtin imports into
 * this entrypoint unless the package contract changes everywhere that consumes
 * it.
 */
declare const window: unknown
declare const Bun: {
  spawn: (cmd: string[], opts: Record<string, unknown>) => { exited: Promise<number> }
}

type FsModule = {
  existsSync: (path: string) => boolean
  readFileSync: (path: string, encoding: string) => string
  writeFileSync: (path: string, data: string, encoding?: string) => void
}

function getFs(): FsModule | null {
  const getBuiltinModule = (process as any).getBuiltinModule
  if (typeof getBuiltinModule !== 'function') {
    return null
  }
  return (getBuiltinModule('node:fs') as FsModule | null) ?? null
}

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
  /** dev-mode env vars — function form receives computed ports + helpers */
  development:
    | ((ctx: {
        ports: Resolved<TPorts>
        portOffset: number
        /** build a postgres connection string using ports.postgres */
        pgUrl: (opts?: { database?: string; user?: string; password?: string }) => string
      }) => TDev)
    | TDev
  /** production env vars */
  production: TProd
  /** env var → package name, for version resolution by env-update */
  deps?: Record<string, string>
  /** in dev mode, refresh values sourced from managed .env.development without clobbering explicit overrides */
  freshDev?: boolean
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
  /** base + production merged — the full var registry for CI/docker sync */
  production: Record<string, string | Expected>
  /** resolved package versions from deps config (e.g. { ZERO_VERSION: '1.2.0' }) */
  versions: Record<string, string>
  /** set env vars into process.env (skip keys already set) */
  apply: () => void
  /** write .env.development from current env (no-op if PORT_OFFSET is set) */
  writeDotEnv: () => void
  /** import.meta.main handler: writes .env.development then runs argv command */
  run: () => Promise<void>
}

// --- createEnv ---

const validEnvs = { development: true, production: true } as const
const managedDotEnvHeader = '# managed by src/env.ts!'

function readManagedDotEnv(dotEnvPath: string): Record<string, string> {
  const fs = getFs()
  if (!fs || !fs.existsSync(dotEnvPath)) {
    return {}
  }

  const content = fs.readFileSync(dotEnvPath, 'utf-8')
  if (!content.startsWith(`${managedDotEnvHeader}\n`)) {
    return {}
  }

  const values: Record<string, string> = {}
  for (const line of content.split('\n')) {
    if (!line || line.startsWith('#')) {
      continue
    }

    const equalsIndex = line.indexOf('=')
    if (equalsIndex <= 0) {
      continue
    }

    const key = line.slice(0, equalsIndex)
    const rawValue = line.slice(equalsIndex + 1)
    // unquoted values are literal, quoted values just strip quotes
    values[key] =
      rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1)
        : rawValue
  }

  return values
}

export function createEnv<
  TPorts extends Record<string, number>,
  TBase extends Record<string, EnvValue>,
  TDev extends Record<string, EnvValue>,
  TProd extends Record<string, EnvValue>,
>(config: EnvConfig<TPorts, TBase, TDev, TProd>): EnvResult<TPorts, TBase, TDev, TProd> {
  const portOffset = Number(process.env.PORT_OFFSET || 0)

  // compute ports with offset
  const resolvedPorts: Record<string, number> = {}
  for (const [key, base] of Object.entries(config.ports)) {
    resolvedPorts[key] = (base as number) + portOffset
  }
  const ports = resolvedPorts as Resolved<TPorts>

  // allow callers (like test/release helpers) to resolve env values for a
  // target mode without inheriting the parent process's NODE_ENV branch.
  const explicitMode = process.env.TAKEOUT_ENV_MODE
  const rawEnv = explicitMode || process.env.NODE_ENV || 'development'
  const NODE_ENV = (rawEnv === 'test' ? 'development' : rawEnv) as keyof typeof validEnvs

  if (!validEnvs[NODE_ENV]) {
    throw new Error(`invalid NODE_ENV: ${rawEnv}`)
  }

  // postgres connection string helper
  const pgPort = (ports as Record<string, number>).postgres
  const pgUrl = (opts?: { database?: string; user?: string; password?: string }) => {
    const user = opts?.user || 'user'
    const password = opts?.password || 'password'
    const database = opts?.database || 'postgres'
    const port = pgPort || 5432
    return `postgresql://${user}:${password}@127.0.0.1:${port}/${database}`
  }

  // resolve mode-specific env
  const modeConfig = config[NODE_ENV]
  const modeEnv =
    typeof modeConfig === 'function'
      ? modeConfig({ ports, portOffset, pgUrl })
      : modeConfig
  const modeKeys = new Set(Object.keys(modeEnv || {}))
  const managedDevEnv =
    NODE_ENV === 'development' && config.freshDev
      ? readManagedDotEnv('.env.development')
      : {}
  const refreshedKeys = new Set<string>()

  // in dev mode with freshDev, clear only values that came from our managed
  // .env.development file so computed defaults refresh without clobbering
  // explicit overrides inherited from the parent process.
  if (NODE_ENV === 'development' && config.freshDev && modeEnv) {
    for (const key of Object.keys(modeEnv)) {
      const envVal = process.env[key]
      if (envVal !== undefined && managedDevEnv[key] === envVal) {
        delete process.env[key]
        refreshedKeys.add(key)
      }
    }
  }

  // merge base + mode, mode wins
  const merged: Record<string, EnvValue> = {
    ...config.base,
    ...modeEnv,
  }

  // resolve expected values and build final env
  const resolvedEnv: Record<string, string> = { NODE_ENV }

  for (const [key, val] of Object.entries(merged)) {
    if (val === expected) {
      const envVal = process.env[key]
      if (envVal !== undefined && envVal !== '') {
        resolvedEnv[key] = envVal
      } else if (NODE_ENV === 'production' && !process.env.ALLOW_MISSING_ENV) {
        throw new Error(`expected env var ${key} to be set in production`)
      } else {
        console.warn(` - expected env ${key} not set`)
        resolvedEnv[key] = ''
      }
    } else {
      // prefer process.env over config defaults, except when an explicit mode
      // override is active. In that case, mode-computed keys must resolve from
      // the requested mode rather than inherited parent-process values.
      const envVal = process.env[key]
      resolvedEnv[key] =
        explicitMode && modeKeys.has(key)
          ? val
          : envVal !== undefined && envVal !== ''
            ? envVal
            : val
    }
  }

  const env = resolvedEnv as EnvMap<TBase, TDev, TProd>

  function apply() {
    // don't overwrite when running inside vite SSR (VITE_ENVIRONMENT is set)
    if (process.env.VITE_ENVIRONMENT) return
    for (const [key, val] of Object.entries(env)) {
      if (explicitMode && modeKeys.has(key)) {
        process.env[key] = val
      } else if (process.env[key] === undefined || refreshedKeys.has(key)) {
        process.env[key] = val
      }
    }
  }

  function writeDotEnv() {
    const fs = getFs()
    if (!fs) {
      return
    }

    const dotEnvDevPath = '.env.development'
    const dotEnvDev = Object.entries(env)
      .map(([key, val]) => {
        // bun's dotenv doesn't unescape \", so avoid quoting when possible
        // unquoted values preserve quotes and backslashes correctly
        // must quote if: starts with #, has leading/trailing whitespace, or contains newlines
        const needsQuotes =
          val.startsWith('#') ||
          val.startsWith(' ') ||
          val.startsWith('\t') ||
          val.endsWith(' ') ||
          val.endsWith('\t') ||
          val.includes('\n')
        if (needsQuotes) {
          // for quoted values, we have no good escape mechanism in bun's dotenv
          // just quote it and hope there are no internal quotes
          return `${key}="${val}"`
        }
        return `${key}=${val}`
      })
      .join('\n')
    const content = `${managedDotEnvHeader}\n${dotEnvDev}`
    if (
      !fs.existsSync(dotEnvDevPath) ||
      fs.readFileSync(dotEnvDevPath, 'utf-8') !== content
    ) {
      fs.writeFileSync(dotEnvDevPath, content, 'utf8')
    }
  }

  async function run() {
    // prevent RUN from leaking to child processes
    delete process.env.RUN

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
      const proc = Bun.spawn(cmd, {
        env: process.env,
        stdio: ['inherit', 'inherit', 'inherit'],
      })
      process.exitCode = await proc.exited
    }
  }

  // server-only proxy — throws on client, reads live from process.env
  // reading from process.env at access time prevents build-time inlining
  // and ensures runtime env overrides take effect
  const isClient = () => typeof window !== 'undefined'
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

  // base + production merged — the full var registry
  const production: Record<string, string | Expected> = {
    ...config.base,
    ...config.production,
  }

  // resolve dep versions from package.json
  const versions: Record<string, string> = {}
  if (config.deps) {
    try {
      const fs = getFs()
      if (fs) {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
        for (const [key, depName] of Object.entries(config.deps)) {
          const version = pkg.dependencies?.[depName]?.replace(/^[\^~]/, '')
          if (version) {
            versions[key] = version
          }
        }
      }
    } catch {}
  }

  // auto-apply on creation (matches existing behavior where importing env.ts has side effects)
  apply()

  return {
    env,
    server,
    ports,
    portOffset,
    config,
    production,
    versions,
    apply,
    writeDotEnv,
    run,
  }
}
