import { join } from 'node:path'

import {
  createDatabase,
  derivePublicTables,
  loadMigrationsFromDir,
} from '@o/database/postgres'

import { server } from '../env'
import * as schema from './schema'
import { relations } from './relations'

const db = createDatabase({
  connectionString: server.ZERO_UPSTREAM_DB,
  schema,
  relations,
  zero: {
    publicationName: 'zero_takeout',
    publicTables: derivePublicTables(schema),
  },
})

export async function main() {
  await db.migrate({
    migrations: loadMigrationsFromDir(join(import.meta.dirname, 'migrations')),
    cvrDb: server.ZERO_CVR_DB,
    changeDb: server.ZERO_CHANGE_DB,
    gitSha: process.env.GIT_SHA,
  })
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
}
