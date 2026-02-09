import { resolve, join } from 'node:path'
import { existsSync, readFileSync, mkdirSync } from 'node:fs'
import { spawn, type ChildProcess } from 'node:child_process'
import { getConfig, getConnectionString, type ZeroLiteConfig } from './config'
import { createPGliteInstance, runMigrations } from './pglite-manager'
import { installChangeTracking } from './replication/change-tracker'
import { startPgProxy } from './pg-proxy'
import { startS3Server } from './s3-local'
import type { PGlite } from '@electric-sql/pglite'
import type { Server } from 'node:net'
import type { Server as HttpServer } from 'node:http'

export type { ZeroLiteConfig } from './config'
export { getConfig, getConnectionString } from './config'

export async function startZeroLite(overrides: Partial<ZeroLiteConfig> = {}) {
  const config = getConfig(overrides)
  console.info('[zero-lite] starting...')
  console.info(`[zero-lite] data dir: ${resolve(config.dataDir)}`)

  mkdirSync(config.dataDir, { recursive: true })

  // start pglite
  const db = await createPGliteInstance(config)

  // run migrations
  await runMigrations(db, config)

  // install change tracking
  console.info('[zero-lite] installing change tracking')
  await installChangeTracking(db)

  // start tcp proxy
  const pgServer = await startPgProxy(db, config)

  // start s3 server
  const s3Server = await startS3Server(config)

  // seed data if needed
  await seedIfNeeded(db, config)

  // start zero-cache
  console.info('[zero-lite] starting zero-cache...')
  const zeroCacheProcess = await startZeroCache(config)

  // wait for zero-cache to be healthy
  await waitForZeroCache(config)

  const stop = async () => {
    console.info('[zero-lite] shutting down...')
    if (zeroCacheProcess) {
      zeroCacheProcess.kill('SIGTERM')
    }
    pgServer.close()
    s3Server.close()
    await db.close()
    console.info('[zero-lite] stopped')
  }

  return { config, stop }
}

async function seedIfNeeded(db: PGlite, config: ZeroLiteConfig): Promise<void> {
  // check if we already have data
  try {
    const result = await db.query<{ count: string }>('SELECT count(*) as count FROM public."user"')
    if (Number(result.rows[0].count) > 0) {
      return
    }
  } catch {
    // table might not exist yet
  }

  console.info('[zero-lite] seeding demo data...')
  const seedFile = resolve(config.seedFile)
  if (!existsSync(seedFile)) {
    console.info('[zero-lite] no seed file found, skipping')
    return
  }

  const sql = readFileSync(seedFile, 'utf-8')
  const statements = sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    await db.exec(stmt)
  }
  console.info('[zero-lite] seeded demo data')
}

async function startZeroCache(config: ZeroLiteConfig): Promise<ChildProcess> {
  // find zero-cache binary
  const zeroCachePaths = [
    resolve('node_modules/.bin/zero-cache'),
    resolve('node_modules/@rocicorp/zero/out/zero-cache/src/bin/main.js'),
  ]

  let zeroCacheBin = ''
  for (const p of zeroCachePaths) {
    if (existsSync(p)) {
      zeroCacheBin = p
      break
    }
  }

  if (!zeroCacheBin) {
    throw new Error('zero-cache binary not found. install @rocicorp/zero')
  }

  const upstreamUrl = getConnectionString(config, 'postgres')
  const cvrUrl = getConnectionString(config, 'zero_cvr')
  const cdbUrl = getConnectionString(config, 'zero_cdb')

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    ZERO_UPSTREAM_DB: upstreamUrl,
    ZERO_CVR_DB: cvrUrl,
    ZERO_CHANGE_DB: cdbUrl,
    ZERO_REPLICA_FILE: resolve(config.dataDir, 'zero-replica.db'),
    ZERO_PORT: String(config.zeroPort),
    ZERO_LOG_LEVEL: 'info',
    ZERO_NUM_SYNC_WORKERS: '1',
    DO_NOT_TRACK: '1',
  }

  const child = spawn(zeroCacheBin, [], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n')
    for (const line of lines) {
      console.info(`[zero-cache] ${line}`)
    }
  })

  child.stderr?.on('data', (data: Buffer) => {
    const lines = data.toString().trim().split('\n')
    for (const line of lines) {
      console.info(`[zero-cache] ${line}`)
    }
  })

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.info(`[zero-cache] exited with code ${code}`)
    }
  })

  return child
}

async function waitForZeroCache(config: ZeroLiteConfig, timeoutMs = 60000): Promise<void> {
  const start = Date.now()
  const url = `http://127.0.0.1:${config.zeroPort}/`

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        console.info('[zero-lite] zero-cache is ready')
        return
      }
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }

  console.info('[zero-lite] warning: zero-cache health check timed out, continuing anyway')
}
