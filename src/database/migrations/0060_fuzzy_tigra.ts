import type { PoolClient } from 'pg'
import sql from './0060_fuzzy_tigra.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
