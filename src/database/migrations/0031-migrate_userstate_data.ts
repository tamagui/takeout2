import type { PoolClient } from 'pg'
import { randomId } from '@vxrn/helpers'

export async function up(client: PoolClient) {
  console.info('Starting userState data migration...')

  // Check if columns exist before attempting migration
  const dataColumnExists = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'userPublic' AND column_name = 'data'
  `)

  const topReactionsColumnExists = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'userPublic' AND column_name = 'topReactions'
  `)

  if (dataColumnExists.rows.length === 0 && topReactionsColumnExists.rows.length === 0) {
    console.info(
      'No data or topReactions columns found, skipping migration - likely already completed'
    )
    return
  }

  // Build dynamic query based on existing columns
  let selectColumns = 'id'
  if (dataColumnExists.rows.length > 0) {
    selectColumns += ', data'
  }
  if (topReactionsColumnExists.rows.length > 0) {
    selectColumns += ', "topReactions"'
  }

  const users = await client.query(`SELECT ${selectColumns} FROM "userPublic"`)

  console.info(`Found ${users.rows.length} users to migrate`)

  for (const user of users.rows) {
    const userId = user.id
    const userData = user.data || {}
    const topReactions = user.topReactions || []

    // Generate a unique ID for the userState record
    const userStateId = randomId()

    // Create a single userState entry per user with individual columns
    await client.query(
      `
      INSERT INTO "userState" (
        id, 
        "userId", 
        "serversSort", 
        "activeServer", 
        "lastPathname", 
        "lastActiveChannel", 
        "channelState", 
        "threadState", 
        "messageEdits", 
        "topReactions", 
        "createdAt", 
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    `,
      [
        userStateId, // Unique ID for the userState record
        userId, // Reference to the user
        userData.serversSort ? JSON.stringify(userData.serversSort) : null,
        userData.activeServer || null,
        userData.lastPathname || null,
        userData.lastActiveChannel
          ? JSON.stringify(userData.lastActiveChannel)
          : JSON.stringify({}),
        userData.channelState ? JSON.stringify(userData.channelState) : null,
        userData.threadState ? JSON.stringify(userData.threadState) : null,
        userData.messageEdits ? JSON.stringify(userData.messageEdits) : null,
        topReactions.length > 0 ? JSON.stringify(topReactions) : JSON.stringify([]),
      ]
    )
  }

  console.info('userState data migration completed')
}
