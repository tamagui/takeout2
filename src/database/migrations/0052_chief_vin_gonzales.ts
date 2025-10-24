import type { PoolClient } from 'pg'
import sql from './0052_chief_vin_gonzales.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
