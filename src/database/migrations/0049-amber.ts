import type { PoolClient } from 'pg'
import { generateThreadTitle } from '~/features/thread/actions/generateThreadTitle'

export async function up(client: PoolClient) {
  // Find all threads without titles
  const { rows: threadsWithoutTitles } = await client.query(`
    SELECT t.id, t."messageId", m.content
    FROM thread t
    JOIN message m ON t."messageId" = m.id
    WHERE t.title IS NULL OR t.title = ''
    AND m.content IS NOT NULL
    AND m.content != ''
    LIMIT 1000
  `)

  console.info(`Found ${threadsWithoutTitles.length} threads without titles`)

  // Generate titles for each thread
  for (const thread of threadsWithoutTitles) {
    try {
      const title = await generateThreadTitle(thread.content)

      // Update the thread with the new title
      await client.query('UPDATE thread SET title = $1 WHERE id = $2', [title, thread.id])

      console.info(`Updated thread ${thread.id} with title: ${title}`)
    } catch (error) {
      console.error(`Failed to generate title for thread ${thread.id}:`, error)
      // Continue with other threads even if one fails
    }
  }

  console.info('Finished generating thread titles')
}
