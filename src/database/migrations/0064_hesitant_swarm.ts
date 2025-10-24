import type { PoolClient } from 'pg'
import sql from './0064_hesitant_swarm.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
