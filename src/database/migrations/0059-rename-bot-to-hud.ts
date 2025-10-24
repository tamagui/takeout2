import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // update existing bot users to have username 'hud' and name 'Hud'
  await client.query(`
    UPDATE "user" 
    SET 
      name = 'Hud'
    WHERE 
      username = 'bot'
  `)

  await client.query(`
    UPDATE "userPublic" 
    SET 
      name = 'Hud',
      username = 'hud'
    WHERE 
      username = 'bot'
  `)

  // update roles named 'Bot' to 'Hud'
  await client.query(`
    UPDATE "role" 
    SET 
      name = 'Hud'
    WHERE 
      name = 'Bot'
  `)
}
