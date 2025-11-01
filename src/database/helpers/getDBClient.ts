import pg, { type PoolClient } from 'pg'
import retry from 'async-retry'
import { ZERO_UPSTREAM_DB } from '~/server/env-server'

// some of this file retry logic taken from:
// https://github.com/brianc/node-postgres/issues/2718#issuecomment-1074019993

/**
 * TODO i was getting this in search endpoint over and over:
 *
 *
 * one:dev Connecting to pool postgresql://user:password@127.0.0.1:5432/postgres...
 * one:dev Connecting to pool postgresql://user:password@127.0.0.1:5432/postgres...
 * one:dev Connecting to pool postgresql://user:password@127.0.0.1:5432/postgres...
 * one:dev Connecting to pool postgresql://user:password@127.0.0.1:5432/postgres...
 * one:dev Connecting to pool postgresql://user:password@127.0.0.1:5432/postgres...
 */

const configurations: pg.PoolConfig = {
  connectionString: ZERO_UPSTREAM_DB,
  connectionTimeoutMillis: 5_000,
  // idle_session_timeout set to 35s on server, client timeout at 30s
  // fix via https://github.com/brianc/node-postgres/issues/2718#issuecomment-2094885323
  idleTimeoutMillis: 30_000,
  allowExitOnIdle: true,
}

const cache = {
  pool: null as pg.Pool | null,
  maxConnections: null as number | null,
  reservedConnections: null as number | null,
  openedConnections: null as number | null,
  openedConnectionsLastUpdate: null as number | null,
}

export async function getDBClient(): Promise<PoolClient> {
  if (!ZERO_UPSTREAM_DB) {
    console.error(`error: no ZERO_UPSTREAM_DB`)
    process.exit(1)
  }

  let client: PoolClient | null = null

  try {
    client = await tryToGetNewClientFromPool()
    return client
  } catch (error) {
    console.error(`Failed to get DB client:`, error)
    throw error
  }
}

async function tryToGetNewClientFromPool(): Promise<PoolClient> {
  const clientFromPool = await retry(newClientFromPool, {
    retries: 8,
    minTimeout: 300,
    factor: 2,
    maxTimeout: 8000,
  })

  return clientFromPool

  async function newClientFromPool() {
    if (!cache.pool) {
      cache.pool = new pg.Pool(configurations)
    }

    console.info(`Connecting to pool ${ZERO_UPSTREAM_DB}...`)
    const client = await cache.pool.connect()
    console.info(`Connected to pool`)
    return client
  }
}

export async function queryDb(
  queryText: string,
  params?: any[]
): Promise<pg.QueryResult<any>> {
  let client: PoolClient | null = null

  try {
    client = await tryToGetNewClientFromPool()
    return await client.query(queryText, params)
  } catch (error) {
    console.error(`Database query failed:`, {
      query: queryText,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    if (client) {
      const tooManyConnections = await checkForTooManyConnections(client)

      if (tooManyConnections) {
        client.release()
        await cache.pool?.end()
        cache.pool = null
      } else {
        client.release()
      }
    }
  }
}

async function checkForTooManyConnections(client: PoolClient): Promise<boolean> {
  const currentTime = Date.now()
  const openedConnectionsMaxAge = 10000
  const maxConnectionsTolerance = 0.9

  if (cache.maxConnections === null || cache.reservedConnections === null) {
    const [maxConnections, reservedConnections] = await getConnectionLimits(client)
    console.info(
      `Max connections: ${maxConnections}, Reserved connections: ${reservedConnections}`
    )
    cache.maxConnections = maxConnections
    cache.reservedConnections = reservedConnections
  }

  if (
    cache.openedConnections === null ||
    cache.openedConnectionsLastUpdate === null ||
    currentTime - cache.openedConnectionsLastUpdate > openedConnectionsMaxAge
  ) {
    const openedConnections = await getOpenedConnections(client)
    cache.openedConnections = openedConnections
    cache.openedConnectionsLastUpdate = currentTime
  }

  if (
    cache.openedConnections >
    (cache.maxConnections - cache.reservedConnections) * maxConnectionsTolerance
  ) {
    console.warn(
      `Too many connections detected: ${cache.openedConnections}/${cache.maxConnections - cache.reservedConnections}`
    )
    return true
  }

  return false
}

async function getConnectionLimits(client: PoolClient): Promise<[number, number]> {
  console.info(`Getting connection limits...`)
  const maxConnectionsResult = await client.query('SHOW max_connections')
  const reservedConnectionResult = await client.query(
    'SHOW superuser_reserved_connections'
  )

  return [
    Number.parseInt(maxConnectionsResult.rows[0].max_connections, 10),
    Number.parseInt(reservedConnectionResult.rows[0].superuser_reserved_connections, 10),
  ]
}

async function getOpenedConnections(client: PoolClient): Promise<number> {
  // For Aurora/RDS, we need to get the database name from connection string
  const dbName = new URL(ZERO_UPSTREAM_DB!).pathname.slice(1)
  console.info(`Getting opened connections...`)
  const openConnectionsResult = await client.query(
    'SELECT numbackends as opened_connections FROM pg_stat_database WHERE datname = $1',
    [dbName]
  )
  const result = Number.parseInt(
    openConnectionsResult.rows[0]?.opened_connections || 0,
    10
  )
  console.info(`Opened connections: ${result}`)
  return result
}

export async function getNewClient(): Promise<pg.Client> {
  try {
    const client = await tryToGetNewClient()
    return client
  } catch (error) {
    console.error(`Failed to get new client:`, error)
    throw error
  }
}

async function tryToGetNewClient(): Promise<pg.Client> {
  const client = await retry(newClient, {
    retries: 10,
    minTimeout: 100,
    factor: 2,
    maxTimeout: 5000,
  })

  return client

  // You need to close the client when you are done with it
  // using the client.end() method.
  async function newClient() {
    const client = new pg.Client(configurations)
    await client.connect()
    return client
  }
}
