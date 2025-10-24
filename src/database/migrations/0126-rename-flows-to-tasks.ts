import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // Get all channels ending with -flows
  const flowsChannels = await client.query(`
    SELECT * FROM channel WHERE id LIKE '%-flows'
  `)

  if (flowsChannels.rows.length === 0) {
    console.info('No channels ending with -flows found, skipping migration')
    return
  }

  console.info(
    `Found ${flowsChannels.rows.length} channels ending with -flows to migrate`
  )

  for (const channel of flowsChannels.rows) {
    const oldId = channel.id
    const newId = oldId.substring(0, oldId.length - 6) + '-tasks'

    console.info(`Migrating channel: ${oldId} -> ${newId}`)

    // Delete the old channel (cascade deletes related data)
    await client.query(`DELETE FROM channel WHERE id = $1`, [oldId])
    console.info(`Deleted channel: ${oldId}`)

    // Recreate with new id
    await client.query(
      `
      INSERT INTO channel (
        id, "serverId", name, description, "oldestMessageId",
        private, "creatorId", "updatedAt", "createdAt",
        "chatPrompt", type, solo, deleted, "isPrivateChat",
        "friendId", "latestSearchIndexMessage", readonly, state
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
    `,
      [
        newId,
        channel.serverId,
        channel.name,
        channel.description,
        channel.oldestMessageId,
        channel.private,
        channel.creatorId,
        channel.updatedAt,
        channel.createdAt,
        channel.chatPrompt,
        channel.type,
        channel.solo,
        channel.deleted,
        channel.isPrivateChat,
        channel.friendId,
        channel.latestSearchIndexMessage,
        channel.readonly,
        channel.state,
      ]
    )

    console.info(`Created channel: ${newId}`)
  }

  console.info(
    `Successfully migrated ${flowsChannels.rows.length} channels from -flows to -tasks`
  )
}
