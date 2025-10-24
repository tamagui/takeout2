import type { PoolClient } from 'pg'
import sql from './0137_tranquil_dreadnoughts.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
