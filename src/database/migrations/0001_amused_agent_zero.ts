import type { PoolClient } from 'pg'
import sql from './0001_amused_agent_zero.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
