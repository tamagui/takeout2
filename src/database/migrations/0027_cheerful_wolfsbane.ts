import type { PoolClient } from 'pg'
import sql from './0027_cheerful_wolfsbane.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
