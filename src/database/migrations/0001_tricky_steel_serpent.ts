import type { PoolClient } from 'pg'
import sql from './0001_tricky_steel_serpent.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
