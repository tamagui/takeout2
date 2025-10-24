import type { PoolClient } from 'pg'
import sql from './0097_thankful_star_brand.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
