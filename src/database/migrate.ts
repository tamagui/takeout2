import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { createDatabase } from '@take-out/database'

import * as schema from './schema'
import { zeroPublicTables } from './schema'
import { relations } from './relations'

const ZERO_UPSTREAM_DB = process.env['ZERO_UPSTREAM_DB'] || ''
const ZERO_CVR_DB = process.env['ZERO_CVR_DB'] || ''
const ZERO_CHANGE_DB = process.env['ZERO_CHANGE_DB'] || ''

// vite tries to eval this at build time
const PROCESS_ENV = globalThis['process']['env']

const migrationsDir = join(import.meta.dirname, 'migrations')
const migrationsGlob: Record<string, () => Promise<unknown>> = {}
for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.ts'))) {
  migrationsGlob[`./migrations/${file}`] = () => import(join(migrationsDir, file))
}

const db = createDatabase({
  connectionString: ZERO_UPSTREAM_DB,
  schema,
  relations,
  zero: {
    publicationName: 'zero_takeout',
    publicTables: [...zeroPublicTables],
  },
})

if (PROCESS_ENV.RUN) {
  db.migrate({
    migrationsGlob,
    cvrDb: ZERO_CVR_DB,
    changeDb: ZERO_CHANGE_DB,
    gitSha: process.env.GIT_SHA,
  }).catch((err: unknown) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
}
