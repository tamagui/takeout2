import type { PoolClient } from 'pg'
import sql from './0001_fantastic_eternity.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
