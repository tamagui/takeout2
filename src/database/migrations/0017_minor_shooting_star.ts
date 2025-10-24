import type { PoolClient } from 'pg'
import sql from './0017_minor_shooting_star.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
