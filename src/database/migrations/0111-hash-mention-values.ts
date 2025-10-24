import type { PoolClient } from 'pg'
import { hashString } from '@vxrn/helpers'
import { updateInChunks } from '../helpers/chunkedQuery'

export async function up(client: PoolClient) {
  // update all messages with mentions using chunked processing
  const updatedCount = await updateInChunks(
    client,
    'message',
    `SELECT id, content FROM message WHERE content LIKE '%<@{%}%'`,
    async (row) => {
      let updatedContent = row.content

      // match all mentions in the format <@{type%label%id}>
      const mentionRegex = /<@\{([^%]+)%([^%]+)%([^}]+)\}(\d*)>/g

      updatedContent = updatedContent.replace(
        mentionRegex,
        (match: string, type: string, label: string, id: string, priority: string) => {
          // hash the label and id
          const hashedLabel = hashString(label)
          const hashedId = hashString(id)

          return `<@{${type}%${hashedLabel}%${hashedId}}${priority}>`
        }
      )

      // only return update if content changed
      if (updatedContent !== row.content) {
        return { content: updatedContent }
      }
      return null
    },
    {
      chunkSize: 500,
      onProgress: (processed, total) => {
        console.info(`Processed ${processed}/${total} messages`)
      },
    }
  )

  console.info(`Updated ${updatedCount} messages with hashed mentions`)
}

export async function down(client: PoolClient) {
  // this migration cannot be reversed since hashing is one-way
  console.warn(
    'Migration 0111-hash-mention-values cannot be reversed - hashing is one-way'
  )
}
