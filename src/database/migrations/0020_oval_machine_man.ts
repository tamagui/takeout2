import type { PoolClient } from 'pg'
import sql from './0020_oval_machine_man.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
