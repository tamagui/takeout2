import type { PoolClient } from 'pg'

export const migration_0078_fix_search_foreign_key = {
  version: 78,
  description: 'Remove foreign key constraint on search_documents.server_id',

  async run(client: PoolClient) {
    // drop the foreign key constraint if it exists
    await client.query(`
      ALTER TABLE search_documents 
      DROP CONSTRAINT IF EXISTS search_documents_server_id_fkey
    `)

    // also update channel_id column to TEXT if it wasn't already
    await client.query(`
      ALTER TABLE search_documents 
      ALTER COLUMN channel_id TYPE TEXT
    `)
  },
}
