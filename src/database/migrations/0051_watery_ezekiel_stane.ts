import type { PoolClient } from 'pg'
import sql from './0051_watery_ezekiel_stane.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
