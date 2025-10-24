import type { PoolClient } from 'pg'
import sql from './0013_dapper_jazinda.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
