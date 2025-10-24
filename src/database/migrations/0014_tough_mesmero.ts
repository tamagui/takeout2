import type { PoolClient } from 'pg'
import sql from './0014_tough_mesmero.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
