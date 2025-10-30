import type { PoolClient } from 'pg'
import sql from './0001_shiny_ares.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
