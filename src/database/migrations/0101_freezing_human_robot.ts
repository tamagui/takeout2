import type { PoolClient } from 'pg'
import sql from './0101_freezing_human_robot.sql?raw'

export async function up(client: PoolClient) {
  await client.query(sql)
}
