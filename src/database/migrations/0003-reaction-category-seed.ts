import type { PoolClient } from 'pg'
import * as unicodeEmoji from 'unicode-emoji'

export async function up(client: PoolClient) {
  const emojis = unicodeEmoji.getEmojis()
  console.info(`Updating ${emojis.length} emojis with keywords and categories...`)

  // Update existing reactions with keywords and category
  const updateText = `
    UPDATE reaction 
    SET keywords = $1,
        category = $2
    WHERE value = $3;
  `

  for (let emoji of emojis) {
    await client.query(updateText, [
      JSON.stringify(emoji.keywords),
      emoji.category,
      emoji.emoji,
    ])
  }
}
