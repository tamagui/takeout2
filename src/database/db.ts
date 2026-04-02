import 'server-only'

import { createDatabase, derivePublicTables } from '@take-out/database'

import { server } from '~/env'

import * as schema from './schema'
import { relations } from './relations'

if (!server.ZERO_UPSTREAM_DB) {
  throw new Error('No db string connection found')
}

export const db = createDatabase({
  connectionString: server.ZERO_UPSTREAM_DB,
  schema,
  relations,
  zero: {
    publicationName: 'zero_takeout',
    publicTables: derivePublicTables(schema),
  },
})

export const { drizzle, sql } = db
