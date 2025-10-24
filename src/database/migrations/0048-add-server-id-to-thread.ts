import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  console.info('Starting thread serverId migration...')

  // Update all threads with serverId based on their channelId
  const result = await client.query(`
    UPDATE thread 
    SET "serverId" = channel."serverId"
    FROM channel 
    WHERE thread."channelId" = channel.id 
    AND thread."serverId" IS NULL
  `)

  console.info(`Updated ${result.rowCount} threads with serverId`)
}
