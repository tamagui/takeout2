import 'server-only'

import { createDatabase } from '@take-out/database'

import { server } from '~/env'

import * as schema from './schema'
import { relations } from './relations'

if (!server.ZERO_UPSTREAM_DB) {
  throw new Error('No db string connection found')
}

const db = createDatabase({
  connectionString: server.ZERO_UPSTREAM_DB,
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

export const { pg, sql, getDBClient, pool, close, migrate: runMigrate } = db
export { db }
