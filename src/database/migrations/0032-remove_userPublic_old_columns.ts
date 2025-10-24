import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  console.info('Removing old userPublic columns...')

  // Check if columns exist before attempting to drop them
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

  // Drop data column if it exists
  if (dataColumnExists.rows.length > 0) {
    await client.query(`ALTER TABLE "userPublic" DROP COLUMN "data"`)
    console.info('Dropped data column from userPublic')
  }

  // Drop topReactions column if it exists
  if (topReactionsColumnExists.rows.length > 0) {
    await client.query(`ALTER TABLE "userPublic" DROP COLUMN "topReactions"`)
    console.info('Dropped topReactions column from userPublic')
  }

  console.info('Old userPublic columns removal completed')
}
