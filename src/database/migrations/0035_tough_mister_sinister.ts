import type { PoolClient } from 'pg'
import sql from './0035_tough_mister_sinister.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
