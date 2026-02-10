import pg, { type Pool, type PoolClient } from 'pg'

// some of this file retry logic taken from:
// https://github.com/brianc/node-postgres/issues/2718#issuecomment-1074019993

export type GetDBClientOptions = {
  pool?: Pool
  connectionString?: string
  retries?: number
  onRetry?: (error: Error, attempt: number) => void
}

const cache = new Map<
  string,
  {
    pool: pg.Pool
    maxConnections: number | null
    reservedConnections: number | null
    openedConnections: number | null
    openedConnectionsLastUpdate: number | null
  }
>()

const createPoolKey = (connectionString: string) => connectionString

const getOrCreatePoolCache = (connectionString: string, config: pg.PoolConfig) => {
  const key = createPoolKey(connectionString)

  if (!cache.has(key)) {
    cache.set(key, {
      pool: new pg.Pool(config),
      maxConnections: null,
      reservedConnections: null,
      openedConnections: null,
      openedConnectionsLastUpdate: null,
    })
  }

  return cache.get(key)!
}

export async function getDBClient(options: GetDBClientOptions = {}): Promise<PoolClient> {
  const { pool, connectionString, retries = 8 } = options

  if (!pool && !connectionString) {
    throw new Error('Either pool or connectionString must be provided')
  }

  let client: PoolClient | null = null

  try {
    client = await tryToGetNewClientFromPool(pool, connectionString, retries)
    return client
  } catch (error) {
    console.error(`Failed to get DB client:`, error)
    throw error
  }
}

async function tryToGetNewClientFromPool(
  providedPool: Pool | undefined,
  connectionString: string | undefined,
  retries: number
): Promise<PoolClient> {
  const { default: retry } = await import('async-retry')
  const clientFromPool = await retry(
    async () => {
      if (providedPool) {
        const client = await providedPool.connect()
        return client
      }

      if (!connectionString) {
        throw new Error('No connection string provided')
      }

      const configurations: pg.PoolConfig = {
        connectionString,
        connectionTimeoutMillis: 5_000,
        // idle_session_timeout set to 35s on server, client timeout at 30s
        // fix via https://github.com/brianc/node-postgres/issues/2718#issuecomment-2094885323
        idleTimeoutMillis: 30_000,
        allowExitOnIdle: true,
      }

      const poolCache = getOrCreatePoolCache(connectionString, configurations)

      const client = await poolCache.pool.connect()
      return client
    },
    {
      retries,
      minTimeout: 300,
      factor: 2,
      maxTimeout: 8000,
    }
  )

  return clientFromPool
}

export async function queryDb(
  queryText: string,
  params?: any[],
  options: GetDBClientOptions = {}
): Promise<pg.QueryResult<any>> {
  let client: PoolClient | null = null

  try {
    client = await tryToGetNewClientFromPool(
      options.pool,
      options.connectionString,
      options.retries || 8
    )
    return await client.query(queryText, params)
  } catch (error) {
    console.error(`Database query failed:`, {
      query: queryText,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    if (client && options.connectionString) {
      const tooManyConnections = await checkForTooManyConnections(
        client,
        options.connectionString
      )

      if (tooManyConnections) {
        const poolCache = cache.get(createPoolKey(options.connectionString))
        client.release()
        await poolCache?.pool.end()
        if (poolCache) {
          cache.delete(createPoolKey(options.connectionString))
        }
      } else {
        client.release()
      }
    } else if (client) {
      client.release()
    }
  }
}

async function checkForTooManyConnections(
  client: PoolClient,
  connectionString: string
): Promise<boolean> {
  const poolCache = cache.get(createPoolKey(connectionString))
  if (!poolCache) return false

  const currentTime = Date.now()
  const openedConnectionsMaxAge = 10000
  const maxConnectionsTolerance = 0.9

  if (poolCache.maxConnections === null || poolCache.reservedConnections === null) {
    const [maxConnections, reservedConnections] = await getConnectionLimits(client)
    poolCache.maxConnections = maxConnections
    poolCache.reservedConnections = reservedConnections
  }

  if (
    poolCache.openedConnections === null ||
    poolCache.openedConnectionsLastUpdate === null ||
    currentTime - poolCache.openedConnectionsLastUpdate > openedConnectionsMaxAge
  ) {
    const openedConnections = await getOpenedConnections(client, connectionString)
    poolCache.openedConnections = openedConnections
    poolCache.openedConnectionsLastUpdate = currentTime
  }

  if (
    poolCache.openedConnections >
    (poolCache.maxConnections - poolCache.reservedConnections) * maxConnectionsTolerance
  ) {
    console.warn(
      `Too many connections detected: ${poolCache.openedConnections}/${poolCache.maxConnections - poolCache.reservedConnections}`
    )
    return true
  }

  return false
}

async function getConnectionLimits(client: PoolClient): Promise<[number, number]> {
  const maxConnectionsResult = await client.query('SHOW max_connections')
  const reservedConnectionResult = await client.query(
    'SHOW superuser_reserved_connections'
  )

  return [
    Number.parseInt(maxConnectionsResult.rows[0].max_connections, 10),
    Number.parseInt(reservedConnectionResult.rows[0].superuser_reserved_connections, 10),
  ]
}

async function getOpenedConnections(
  client: PoolClient,
  connectionString: string
): Promise<number> {
  // For Aurora/RDS, we need to get the database name from connection string
  const dbName = new URL(connectionString).pathname.slice(1)
  const openConnectionsResult = await client.query(
    'SELECT numbackends as opened_connections FROM pg_stat_database WHERE datname = $1',
    [dbName]
  )
  const result = Number.parseInt(
    openConnectionsResult.rows[0]?.opened_connections || 0,
    10
  )
  return result
}

export async function getNewClient(options: GetDBClientOptions = {}): Promise<pg.Client> {
  const { connectionString } = options

  if (!connectionString) {
    throw new Error('connectionString is required for getNewClient')
  }

  try {
    const client = await tryToGetNewClient(connectionString)
    return client
  } catch (error) {
    console.error(`Failed to get new client:`, error)
    throw error
  }
}

async function tryToGetNewClient(connectionString: string): Promise<pg.Client> {
  const configurations: pg.PoolConfig = {
    connectionString,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    allowExitOnIdle: true,
  }

  const { default: retry } = await import('async-retry')
  const client = await retry(
    async () => {
      const newClient = new pg.Client(configurations)
      await newClient.connect()
      return newClient
    },
    {
      retries: 10,
      minTimeout: 100,
      factor: 2,
      maxTimeout: 5000,
    }
  )

  return client
}
