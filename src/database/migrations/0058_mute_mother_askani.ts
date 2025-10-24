import type { PoolClient } from 'pg'
import sql from './0058_mute_mother_askani.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
