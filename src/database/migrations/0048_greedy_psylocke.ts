import type { PoolClient } from 'pg'
import sql from './0048_greedy_psylocke.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
