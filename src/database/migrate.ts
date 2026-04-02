import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { createDatabase } from '@take-out/database'

import * as schema from './schema'
import { relations } from './relations'

const ZERO_UPSTREAM_DB = process.env['ZERO_UPSTREAM_DB'] || ''
const ZERO_CVR_DB = process.env['ZERO_CVR_DB'] || ''
const ZERO_CHANGE_DB = process.env['ZERO_CHANGE_DB'] || ''

// vite tries to eval this at build time :/
const PROCESS_ENV = globalThis['process']['env']

// build migrations glob compatible with @take-out/database/migrate
const migrationsDir = join(import.meta.dirname, 'migrations')
const migrationsGlob: Record<string, () => Promise<unknown>> = {}
for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.ts'))) {
  const path = `./migrations/${file}`
  migrationsGlob[path] = () => import(join(migrationsDir, file))
}
console.info('[migrate] found migrations:', Object.keys(migrationsGlob).length)

const db = createDatabase({
  connectionString: ZERO_UPSTREAM_DB,
  schema,
  relations,
  zero: {
    publicationName: 'zero_takeout',
    publicTables: [
      'userPublic',
      'userState',
      'post',
      'comment',
      'block',
      'report',
      'device',
      'notification',
      'invite',
    ],
  },
})

export async function main() {
  await db.migrate({
    migrationsGlob,
    cvrDb: ZERO_CVR_DB,
    changeDb: ZERO_CHANGE_DB,
    gitSha: process.env.GIT_SHA,
  })
}

if (PROCESS_ENV.RUN) {
  main().catch((err: unknown) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
}
