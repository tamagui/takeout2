import type { PoolClient } from 'pg'
import sql from './0095_bright_cloak.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
