import type { PoolClient } from 'pg'
import sql from './0037_silent_professor_monster.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
