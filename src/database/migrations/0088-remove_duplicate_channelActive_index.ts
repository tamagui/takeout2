import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // remove the duplicate channelActive index from migration 0084
  await client.query(`
    DROP INDEX IF EXISTS idx_channelActive_channel_user
  `)

  // remove all indexes from migration 0086 that should be in drizzle schema instead
  await client.query(`DROP INDEX IF EXISTS idx_privateChatsStats_users_score`)
  await client.query(`DROP INDEX IF EXISTS idx_serverMember_server_user`)
  await client.query(`DROP INDEX IF EXISTS idx_notification_user_unseen`)
  await client.query(`DROP INDEX IF EXISTS idx_meeting_channel_active`)
  await client.query(`DROP INDEX IF EXISTS idx_channelTopic_created`)
}
