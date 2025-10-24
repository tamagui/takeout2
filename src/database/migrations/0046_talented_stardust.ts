import type { PoolClient } from 'pg'
import sql from './0046_talented_stardust.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
