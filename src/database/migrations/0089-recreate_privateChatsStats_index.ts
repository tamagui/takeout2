import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // recreate the privateChatsStats index for OR queries optimization
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_privateChatsStats_users_score 
    ON "privateChatsStats" ("userAId", "userBId", "score" DESC)
  `)
}
