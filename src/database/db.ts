import 'server-only'

import { createDatabase } from '@take-out/database'

import { server } from '~/env'

import * as schema from './schema'
import { zeroPublicTables } from './schema'
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
    publicTables: [...zeroPublicTables],
  },
})

export const { pg, sql } = db
