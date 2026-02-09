/**
 * tcp proxy that makes pglite speak postgresql wire protocol.
 *
 * uses pg-gateway to handle protocol lifecycle for regular connections,
 * and directly handles the raw socket for replication connections.
 *
 * regular connections: forwarded to pglite via execProtocolRaw()
 * replication connections: intercepted, replication protocol faked
 */

import { createServer, type Server, type Socket } from 'node:net'
import { fromNodeSocket } from 'pg-gateway/node'
import type { PGlite } from '@electric-sql/pglite'
import type { ZeroLiteConfig } from './config'
import { handleReplicationQuery, handleStartReplication } from './replication/handler'

// database name → search_path mapping
const DB_SCHEMA_MAP: Record<string, string> = {
  postgres: 'public',
  zero_cvr: 'zero_cvr, public',
  zero_cdb: 'zero_cdb, public',
}

// query rewrites: make pglite look like real postgres with logical replication
const QUERY_REWRITES: Array<{ match: RegExp; replace: string }> = [
  // wal_level check - zero-cache verifies this before opening replication
  {
    match: /current_setting\s*\(\s*'wal_level'\s*\)/gi,
    replace: "'logical'::text",
  },
  // strip READ ONLY from BEGIN - pglite is single-session so read-only
  // transactions from different connections get interleaved, leaving pglite
  // stuck in read-only mode when a later INSERT needs to run
  {
    match: /\bREAD\s+ONLY\b/gi,
    replace: '',
  },
  // redirect pg_replication_slots to our fake table
  {
    match: /\bpg_replication_slots\b/g,
    replace: 'public._zero_replication_slots',
  },
]

// queries to intercept and return no-op success (can't be handled by pglite)
const NOOP_QUERY_PATTERNS = [
  /^\s*SET\s+TRANSACTION\s+SNAPSHOT\s+/i, // pglite doesn't support imported snapshots
]

/**
 * extract query text from a Parse message (0x50).
 * format: type(1) + len(4) + name(cstring) + query(cstring) + numParams(2) + paramOids
 */
function extractParseQuery(data: Uint8Array): string | null {
  if (data[0] !== 0x50) return null
  let offset = 5
  // skip statement name
  while (offset < data.length && data[offset] !== 0) offset++
  offset++
  const queryStart = offset
  while (offset < data.length && data[offset] !== 0) offset++
  return new TextDecoder().decode(data.subarray(queryStart, offset))
}

/**
 * rebuild a Parse message with a modified query string.
 * preserves statement name, parameter types, and all other fields.
 */
function rebuildParseMessage(data: Uint8Array, newQuery: string): Uint8Array {
  let offset = 5
  while (offset < data.length && data[offset] !== 0) offset++
  const nameEnd = offset + 1
  const nameBytes = data.subarray(5, nameEnd)

  offset = nameEnd
  while (offset < data.length && data[offset] !== 0) offset++
  offset++

  const suffix = data.subarray(offset)
  const encoder = new TextEncoder()
  const queryBytes = encoder.encode(newQuery)

  const totalLen = 4 + nameBytes.length + queryBytes.length + 1 + suffix.length
  const result = new Uint8Array(1 + totalLen)
  const dv = new DataView(result.buffer)
  result[0] = 0x50
  dv.setInt32(1, totalLen)
  let pos = 5
  result.set(nameBytes, pos)
  pos += nameBytes.length
  result.set(queryBytes, pos)
  pos += queryBytes.length
  result[pos++] = 0
  result.set(suffix, pos)
  return result
}

/**
 * rebuild a Simple Query message with a modified query string.
 */
function rebuildSimpleQuery(newQuery: string): Uint8Array {
  const encoder = new TextEncoder()
  const queryBytes = encoder.encode(newQuery + '\0')
  const buf = new Uint8Array(5 + queryBytes.length)
  buf[0] = 0x51
  new DataView(buf.buffer).setInt32(1, 4 + queryBytes.length)
  buf.set(queryBytes, 5)
  return buf
}

/**
 * intercept and rewrite query messages to make pglite look like real postgres.
 * handles both simple queries (0x51) and Parse messages (0x50).
 */
function interceptQuery(data: Uint8Array): Uint8Array {
  const msgType = data[0]

  if (msgType === 0x51) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const len = view.getInt32(1)
    let query = new TextDecoder().decode(data.subarray(5, 1 + len - 1)).replace(/\0$/, '')

    let modified = false
    for (const rw of QUERY_REWRITES) {
      if (rw.match.test(query)) {
        query = query.replace(rw.match, rw.replace)
        modified = true
        rw.match.lastIndex = 0
      }
      rw.match.lastIndex = 0
    }

    if (modified) {
      return rebuildSimpleQuery(query)
    }
  } else if (msgType === 0x50) {
    const query = extractParseQuery(data)
    if (query) {
      let newQuery = query
      let modified = false
      for (const rw of QUERY_REWRITES) {
        if (rw.match.test(newQuery)) {
          newQuery = newQuery.replace(rw.match, rw.replace)
          modified = true
          rw.match.lastIndex = 0
        }
        rw.match.lastIndex = 0
      }
      if (modified) {
        return rebuildParseMessage(data, newQuery)
      }
    }
  }

  return data
}

/**
 * check if a query should be intercepted as a no-op.
 * returns the query text if it matches, null otherwise.
 */
function isNoopQuery(data: Uint8Array): boolean {
  let query: string | null = null
  if (data[0] === 0x51) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
    const len = view.getInt32(1)
    query = new TextDecoder().decode(data.subarray(5, 1 + len - 1)).replace(/\0$/, '')
  } else if (data[0] === 0x50) {
    query = extractParseQuery(data)
  }
  if (!query) return false
  return NOOP_QUERY_PATTERNS.some((p) => p.test(query!))
}

/**
 * build a synthetic "SET" command complete response for simple queries.
 */
function buildSetCompleteResponse(): Uint8Array {
  const encoder = new TextEncoder()
  const tag = encoder.encode('SET\0')
  const cc = new Uint8Array(1 + 4 + tag.length)
  cc[0] = 0x43
  new DataView(cc.buffer).setInt32(1, 4 + tag.length)
  cc.set(tag, 5)

  const rfq = new Uint8Array(6)
  rfq[0] = 0x5a
  new DataView(rfq.buffer).setInt32(1, 5)
  rfq[5] = 0x54 // 'T' = in transaction

  const result = new Uint8Array(cc.length + rfq.length)
  result.set(cc, 0)
  result.set(rfq, cc.length)
  return result
}

/**
 * build a synthetic ParseComplete response for extended protocol no-ops.
 */
function buildParseCompleteResponse(): Uint8Array {
  const pc = new Uint8Array(5)
  pc[0] = 0x31 // ParseComplete
  new DataView(pc.buffer).setInt32(1, 4)
  return pc
}

/**
 * strip ReadyForQuery messages from a response buffer.
 * pglite adds ReadyForQuery after every execProtocolRaw, but the pg wire
 * protocol only expects it after Sync messages in extended query mode.
 */
function stripReadyForQuery(data: Uint8Array): Uint8Array {
  if (data.length === 0) return data

  // walk through messages and filter out ReadyForQuery (0x5a)
  const parts: Uint8Array[] = []
  let offset = 0
  while (offset < data.length) {
    const msgType = data[offset]
    if (offset + 5 > data.length) break
    const msgLen = new DataView(data.buffer, data.byteOffset + offset + 1).getInt32(0)
    const totalLen = 1 + msgLen

    if (msgType !== 0x5a) {
      // also strip NoticeResponse (0x4e could be NoData - keep NoData, only strip actual notices)
      parts.push(data.subarray(offset, offset + totalLen))
    }

    offset += totalLen
  }

  if (parts.length === 0) return new Uint8Array(0)
  if (parts.length === 1) return parts[0]

  const total = parts.reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(total)
  let pos = 0
  for (const p of parts) {
    result.set(p, pos)
    pos += p.length
  }
  return result
}

// simple mutex for serializing pglite access
class Mutex {
  private locked = false
  private queue: Array<() => void> = []

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true
      return
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    const next = this.queue.shift()
    if (next) {
      next()
    } else {
      this.locked = false
    }
  }
}

const mutex = new Mutex()

// module-level search_path tracking (shared between connection handler and replication handler)
let currentSearchPath = 'public'

export async function startPgProxy(
  db: PGlite,
  config: ZeroLiteConfig
): Promise<Server> {

  const server = createServer(async (socket: Socket) => {
    let dbName = 'postgres'
    let isReplicationConnection = false

    try {
      const connection = await fromNodeSocket(socket, {
        auth: {
          method: 'password',
          getClearTextPassword() {
            return config.pgPassword
          },
          validateCredentials(credentials: {
            username: string
            password: string
            clearTextPassword: string
          }) {
            return (
              credentials.password === credentials.clearTextPassword &&
              credentials.username === config.pgUser
            )
          },
        },

        async onStartup(state) {
          // detect replication mode and database name
          const params = state.clientParams
          if (params?.replication === 'database') {
            isReplicationConnection = true
          }
          dbName = params?.database || 'postgres'
          console.info(
            `[zero-lite] new connection: db=${dbName} user=${params?.user} replication=${params?.replication || 'none'}`
          )
          await db.waitReady
        },

        async onMessage(data, state) {
          if (!state.isAuthenticated) return

          // handle replication connections
          if (isReplicationConnection) {
            if (data[0] === 0x51) {
              const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
              const len = view.getInt32(1)
              const query = new TextDecoder()
                .decode(data.subarray(5, 1 + len - 1))
                .replace(/\0$/, '')
              console.info(`[zero-lite] repl query: ${query.slice(0, 200)}`)
            }
            return handleReplicationMessage(data, socket, db, connection)
          }

          // check for no-op queries (e.g. SET TRANSACTION SNAPSHOT)
          if (isNoopQuery(data)) {
            if (data[0] === 0x51) {
              // simple query - return SET complete + ReadyForQuery
              return buildSetCompleteResponse()
            } else if (data[0] === 0x50) {
              // Parse - return ParseComplete (no ReadyForQuery)
              return buildParseCompleteResponse()
            }
          }

          // intercept and rewrite queries that check wal_level or other pg settings
          data = interceptQuery(data)

          // regular query: set search_path based on database name, then forward
          await mutex.acquire()
          try {
            const searchPath = DB_SCHEMA_MAP[dbName] || 'public'
            if (currentSearchPath !== searchPath) {
              await db.exec(`SET search_path TO ${searchPath}`)
              currentSearchPath = searchPath
            }
            let result = await db.execProtocolRaw(data, { throwOnError: false })
            // strip ReadyForQuery from non-Sync responses.
            // pglite appends ReadyForQuery after every execProtocolRaw call,
            // but the postgres wire protocol only expects it after Sync.
            if (data[0] !== 0x53 && data[0] !== 0x51) {
              result = stripReadyForQuery(result)
            }
            return result
          } finally {
            mutex.release()
          }
        },
      })
    } catch (err) {
      // connection closed or errored during setup
      if (!socket.destroyed) {
        socket.destroy()
      }
    }
  })

  return new Promise((resolve, reject) => {
    server.listen(config.pgPort, '127.0.0.1', () => {
      console.info(`[zero-lite] pg proxy listening on port ${config.pgPort}`)
      resolve(server)
    })
    server.on('error', reject)
  })
}

async function handleReplicationMessage(
  data: Uint8Array,
  socket: Socket,
  db: PGlite,
  connection: Awaited<ReturnType<typeof fromNodeSocket>>
): Promise<Uint8Array | undefined> {
  // only handle simple query messages for replication
  if (data[0] !== 0x51) return undefined

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const len = view.getInt32(1)
  const query = new TextDecoder().decode(data.subarray(5, 1 + len - 1)).replace(/\0$/, '')
  const upper = query.trim().toUpperCase()

  // check if this is a START_REPLICATION command
  if (upper.startsWith('START_REPLICATION')) {
    // detach from pg-gateway to get raw stream control
    const duplex = await connection.detach()

    const writer = {
      write(chunk: Uint8Array) {
        if (!socket.destroyed) {
          socket.write(chunk)
        }
      },
    }

    // send the response through raw socket, not pg-gateway
    handleStartReplication(query, writer, db).catch((err) => {
      console.info(`[zero-lite] replication stream ended: ${err}`)
    })
    return undefined
  }

  // handle other replication queries
  const response = await handleReplicationQuery(query, db)
  if (response) return response

  // fall through to pglite for unrecognized queries
  await mutex.acquire()
  try {
    const searchPath = 'public'
    if (currentSearchPath !== searchPath) {
      await db.exec(`SET search_path TO ${searchPath}`)
      currentSearchPath = searchPath
    }
    return await db.execProtocolRaw(data, { throwOnError: false })
  } finally {
    mutex.release()
  }
}

