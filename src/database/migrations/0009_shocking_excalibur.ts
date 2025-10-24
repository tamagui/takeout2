import type { PoolClient } from 'pg'
import sql from './0009_shocking_excalibur.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
