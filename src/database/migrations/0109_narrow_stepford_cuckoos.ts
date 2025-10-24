import type { PoolClient } from 'pg'
import sql from './0109_narrow_stepford_cuckoos.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
