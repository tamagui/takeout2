import type { PoolClient, QueryResultRow } from 'pg'

interface ChunkedQueryOptions {
  chunkSize?: number
  onProgress?: (processed: number, total: number) => void
}

/**
 * Process database records in chunks to avoid memory issues with large datasets
 */
export async function processInChunks<T extends QueryResultRow = QueryResultRow>(
  client: PoolClient,
  query: string,
  processor: (rows: T[]) => Promise<void>,
  options: ChunkedQueryOptions = {}
): Promise<void> {
  const { chunkSize = 1000, onProgress } = options
  let offset = 0
  let hasMore = true
  let totalProcessed = 0

  // first get total count for progress reporting
  const countQuery = query
    .replace(/SELECT .+ FROM/, 'SELECT COUNT(*) FROM')
    .replace(/ORDER BY .+/, '')
  const countResult = await client.query(countQuery)
  const totalCount = Number.parseInt(countResult.rows[0].count, 10)

  while (hasMore) {
    const paginatedQuery = `${query} LIMIT ${chunkSize} OFFSET ${offset}`
    const result = await client.query<T>(paginatedQuery)

    if (result.rows.length === 0) {
      hasMore = false
      break
    }

    await processor(result.rows)

    totalProcessed += result.rows.length
    offset += chunkSize

    if (onProgress) {
      onProgress(totalProcessed, totalCount)
    }

    // check if we've processed all records
    if (result.rows.length < chunkSize) {
      hasMore = false
    }
  }
}

/**
 * Update records in chunks with a transformer function
 */
export async function updateInChunks<T extends QueryResultRow & { id: string }>(
  client: PoolClient,
  tableName: string,
  selectQuery: string,
  transformer: (row: T) => Promise<Partial<T> | null>,
  options: ChunkedQueryOptions = {}
): Promise<number> {
  let totalUpdated = 0

  await processInChunks<T>(
    client,
    selectQuery,
    async (rows) => {
      for (const row of rows) {
        const updates = await transformer(row)

        if (updates && Object.keys(updates).length > 0) {
          // build update query dynamically
          const setClause = Object.keys(updates)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ')

          const values = [row.id, ...Object.values(updates)]

          await client.query(`UPDATE ${tableName} SET ${setClause} WHERE id = $1`, values)

          totalUpdated++
        }
      }
    },
    options
  )

  return totalUpdated
}
