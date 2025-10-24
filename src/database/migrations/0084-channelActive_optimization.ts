import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // add index to optimize channelActive queries with userId ordering
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_channelActive_channel_user 
    ON "channelActive" ("channelId", "userId")
  `)
}
