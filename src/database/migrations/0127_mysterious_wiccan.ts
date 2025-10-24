import type { PoolClient } from 'pg'
import sql from './0127_mysterious_wiccan.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
