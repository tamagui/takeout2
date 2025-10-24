import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // drop message_order column and add server_id and channel_id if not exists
  await client.query(`
    -- add server_id and channel_id columns if they don't exist
    ALTER TABLE search_documents 
    ADD COLUMN IF NOT EXISTS server_id TEXT,
    ADD COLUMN IF NOT EXISTS channel_id TEXT;
    
    -- drop message_order column if it exists
    ALTER TABLE search_documents
    DROP COLUMN IF EXISTS message_order;
    
    -- add indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_search_documents_server_id ON search_documents(server_id);
    CREATE INDEX IF NOT EXISTS idx_search_documents_channel_id ON search_documents(channel_id);
    CREATE INDEX IF NOT EXISTS idx_search_documents_source ON search_documents(source_table, source_id);
  `)

  // update the sync triggers to include server_id and channel_id
  await client.query(`
    -- drop existing trigger functions
    DROP FUNCTION IF EXISTS sync_message_to_search() CASCADE;
    DROP FUNCTION IF EXISTS sync_data_to_search() CASCADE;
    
    -- create updated sync function for messages
    CREATE OR REPLACE FUNCTION sync_message_to_search() RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        DELETE FROM search_documents WHERE source_table = 'message' AND source_id = OLD.id;
        RETURN OLD;
      END IF;
      
      -- only index non-draft, non-hidden messages with content
      -- messages with type 'draft' or 'hidden' should not be indexed
      IF NEW.type != 'draft' AND NEW.type != 'hidden' AND NEW.deleted = false AND NEW.content IS NOT NULL AND NEW.content != '' THEN
        INSERT INTO search_documents (
          id,
          source_table,
          source_id,
          title,
          content,
          type,
          server_id,
          channel_id,
          reliability,
          created_at,
          updated_at
        ) VALUES (
          'msg_' || NEW.id,
          'message',
          NEW.id,
          SUBSTRING(NEW.content, 1, 100),
          NEW.content,
          'chat',
          NEW."serverId",
          NEW."channelId",
          3,
          NEW."createdAt",
          NEW."updatedAt"
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          server_id = EXCLUDED.server_id,
          channel_id = EXCLUDED.channel_id,
          updated_at = EXCLUDED.updated_at;
      ELSE
        -- remove from search if message becomes draft, hidden, or deleted
        DELETE FROM search_documents WHERE source_table = 'message' AND source_id = NEW.id;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- create updated sync function for data
    CREATE OR REPLACE FUNCTION sync_data_to_search() RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        DELETE FROM search_documents WHERE source_table = 'data' AND source_id = OLD.id;
        RETURN OLD;
      END IF;
      
      -- index all data entries
      INSERT INTO search_documents (
        id,
        source_table,
        source_id,
        title,
        content,
        type,
        category,
        server_id,
        channel_id,
        app_install_id,
        reliability,
        created_at,
        updated_at
      ) VALUES (
        'data_' || NEW.id,
        'data',
        NEW.id,
        NEW.title,
        NEW.value::text,
        COALESCE(NEW.type, 'data'),
        NEW.category,
        NEW."serverId",
        NEW."channelId",
        NEW."appInstallId",
        COALESCE(NEW.reliability, 3),
        NEW."createdAt",
        NEW."updatedAt"
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        type = EXCLUDED.type,
        category = EXCLUDED.category,
        server_id = EXCLUDED.server_id,
        channel_id = EXCLUDED.channel_id,
        app_install_id = EXCLUDED.app_install_id,
        reliability = EXCLUDED.reliability,
        updated_at = EXCLUDED.updated_at;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- recreate triggers
    DROP TRIGGER IF EXISTS message_search_sync ON message;
    CREATE TRIGGER message_search_sync
      AFTER INSERT OR UPDATE OR DELETE ON message
      FOR EACH ROW
      EXECUTE FUNCTION sync_message_to_search();
    
    DROP TRIGGER IF EXISTS data_search_sync ON data;
    CREATE TRIGGER data_search_sync
      AFTER INSERT OR UPDATE OR DELETE ON data
      FOR EACH ROW
      EXECUTE FUNCTION sync_data_to_search();
  `)
}
