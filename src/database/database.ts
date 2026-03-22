import { Pool } from 'pg'

import { ZERO_UPSTREAM_DB } from '~/server/env-server'

if (!ZERO_UPSTREAM_DB) {
  throw new Error(`No db string connection found`)
}

export const database = new Pool({
  connectionString: ZERO_UPSTREAM_DB,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  // handle self-signed certificates in production
  ssl: ZERO_UPSTREAM_DB.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
})

database.on('error', (error) => {
  // pg attaches the full Client object to pool errors — only log the message + stack
  console.error(`[postgres] pool error`, error.message, error.stack)
})

// attach error handlers to every client to prevent unhandled 'error' events
// from crashing the process when a connection drops on a checked-out client
database.on('connect', (client) => {
  client.on('error', (error) => {
    console.error(`[postgres] client error`, error.message, error.stack)
  })

  // pg-protocol's parser can throw synchronously inside the stream 'data' handler
  // (e.g. RangeError when reading corrupted/stale buffer data from a zombie connection).
  // those throws bypass client.on('error') and become uncaught exceptions.
  // wrapping the stream with its own error handler catches them at the source.
  const stream = (client as any).connection?.stream
  if (stream && !stream.__pgErrorPatched) {
    stream.__pgErrorPatched = true
    stream.on('error', (error: Error) => {
      console.error(`[postgres] stream error`, error.message, error.stack)
    })
  }
})

// cleanup function that can be called during shutdown
export async function closeDatabase() {
  try {
    await database.end()
  } catch (error) {
    console.error(`[postgres] error closing database:`, error)
  }
}
