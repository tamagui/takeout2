import type { PoolClient } from 'pg'
import * as unicodeEmoji from 'unicode-emoji'
import { randomId } from '@vxrn/helpers'

export async function up(client: PoolClient) {
  const emojis = unicodeEmoji.getEmojis()
  console.info(`Inserting ${emojis.length} emojis...`)
  const insertText = `
      INSERT INTO reaction(id, value, keyword, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, DEFAULT, DEFAULT)
        ON CONFLICT DO NOTHING;
      `
  for (let emoji of emojis) {
    const values = [randomId(), emoji.emoji, toKeyword(emoji.description)]
    await client.query(insertText, values)
  }
}

const toKeyword = (description: string) => description.split(' ').join('_')
