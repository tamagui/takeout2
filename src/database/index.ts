import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { ZERO_UPSTREAM_DB } from '~/server/env-server'

import * as schemaPrivate from './schema-private'
import * as schemaPublic from './schema-public'

const schema = {
  ...schemaPublic,
  ...schemaPrivate,
}

export const createPool = (connectionString?: string) => {
  const connStr = connectionString || ZERO_UPSTREAM_DB
  return new Pool({
    connectionString: connStr,
    // handle self-signed certificates in production
    ssl: connStr?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  })
}

export const createDb = () => {
  const pool = createPool()
  return drizzle(pool, {
    schema,
    logger: false,
  })
}

let db: ReturnType<typeof createDb>

export const getDb = () => {
  if (!db) {
    db = createDb()
  }
  return db
}
