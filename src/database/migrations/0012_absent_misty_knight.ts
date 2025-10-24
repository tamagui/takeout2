import type { PoolClient } from 'pg'
import sql from './0012_absent_misty_knight.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
