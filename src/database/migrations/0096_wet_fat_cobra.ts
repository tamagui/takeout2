import type { PoolClient } from 'pg'
import sql from './0096_wet_fat_cobra.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
