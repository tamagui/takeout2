import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // add composite index for OR queries on userAId/userBId with score ordering
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_privateChatsStats_users_score 
    ON "privateChatsStats" ("userAId", "userBId", "score" DESC)
  `)

  // add index for serverMember lookups with both serverId and userId
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_serverMember_server_user 
    ON "serverMember" ("serverId", "userId")
  `)

  // add index for notification lookups
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_notification_user_unseen 
    ON "notification" ("userId", "channelId") 
    WHERE "seenAt" IS NULL
  `)

  // add index for meeting active lookups
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_meeting_channel_active 
    ON "meeting" ("channelId", "id") 
    WHERE "active" = true
  `)

  // add index for channelTopic date filtering
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_channelTopic_created 
    ON "channelTopic" ("channelId", "createdAt")
  `)
}
