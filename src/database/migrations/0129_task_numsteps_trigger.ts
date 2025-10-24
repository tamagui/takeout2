import type { PoolClient } from 'pg'
import sql from './0129_task_numsteps_trigger.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
