import type { PoolClient } from 'pg'

export async function up(client: PoolClient) {
  // enable pgvector extension
  await client.query(`CREATE EXTENSION IF NOT EXISTS vector`)

  // enable pg_trgm for fuzzy text matching
  await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`)

  // create search_documents table
  await client.query(`
    CREATE TABLE IF NOT EXISTS search_documents (
      id TEXT PRIMARY KEY,
      source_table TEXT NOT NULL CHECK (source_table IN ('message', 'data')),
      source_id TEXT NOT NULL,
      
      -- text search columns
      title TEXT,
      content TEXT,
      search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B')
      ) STORED,
      
      -- vector search column (384 dimensions for all-MiniLM-L12-v2)
      embedding vector(384),
      
      -- metadata
      type TEXT NOT NULL,
      category TEXT,
      server_id TEXT REFERENCES server(id) ON DELETE CASCADE,
      app_install_id TEXT,
      reliability INTEGER DEFAULT 1 CHECK (reliability >= 1 AND reliability <= 5),
      
      -- timestamps
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- unique constraint on source
      UNIQUE(source_table, source_id)
    )
  `)

  // create indexes for performance
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_search_vector ON search_documents USING GIN(search_vector)`
  )
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_embedding ON search_documents USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100)`
  )
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_server_id ON search_documents(server_id)`
  )
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_source ON search_documents(source_table, source_id)`
  )
  await client.query(`CREATE INDEX IF NOT EXISTS idx_type ON search_documents(type)`)

  // create trigger function for syncing messages
  await client.query(`
    CREATE OR REPLACE FUNCTION sync_message_to_search() 
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        DELETE FROM search_documents 
        WHERE source_table = 'message' AND source_id = OLD.id;
        RETURN OLD;
      END IF;
      
      -- only index messages with content
      IF NEW.content IS NULL OR NEW.content = '' THEN
        DELETE FROM search_documents 
        WHERE source_table = 'message' AND source_id = NEW.id;
        RETURN NEW;
      END IF;
      
      INSERT INTO search_documents (
        id, source_table, source_id, title, content, 
        type, category, server_id, reliability
      ) VALUES (
        'message_' || NEW.id, 
        'message', 
        NEW.id, 
        NEW.id, 
        NEW.content,
        'chat', 
        'message', 
        NEW."serverId", 
        5
      )
      ON CONFLICT (source_table, source_id) DO UPDATE SET
        content = EXCLUDED.content,
        server_id = EXCLUDED.server_id,
        updated_at = NOW();
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // create trigger function for syncing data
  await client.query(`
    CREATE OR REPLACE FUNCTION sync_data_to_search() 
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        DELETE FROM search_documents 
        WHERE source_table = 'data' AND source_id = OLD.id;
        RETURN OLD;
      END IF;
      
      -- only index public data
      IF NEW.permissions = 'private' THEN
        DELETE FROM search_documents 
        WHERE source_table = 'data' AND source_id = NEW.id;
        RETURN NEW;
      END IF;
      
      -- only index data with value
      IF NEW.value IS NULL OR NEW.value = '' THEN
        DELETE FROM search_documents 
        WHERE source_table = 'data' AND source_id = NEW.id;
        RETURN NEW;
      END IF;
      
      INSERT INTO search_documents (
        id, source_table, source_id, title, content, 
        type, category, server_id, app_install_id, reliability
      ) VALUES (
        'data_' || NEW.id, 
        'data', 
        NEW.id, 
        NEW.key, 
        NEW.value,
        COALESCE(NEW.type, 'app'), 
        'data', 
        NEW."serverId",
        NEW."appInstallId",
        COALESCE(NEW.reliability, 1)
      )
      ON CONFLICT (source_table, source_id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        type = EXCLUDED.type,
        server_id = EXCLUDED.server_id,
        app_install_id = EXCLUDED.app_install_id,
        reliability = EXCLUDED.reliability,
        updated_at = NOW();
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `)

  // create triggers
  await client.query(`
    CREATE TRIGGER message_search_sync
    AFTER INSERT OR UPDATE OR DELETE ON message
    FOR EACH ROW EXECUTE FUNCTION sync_message_to_search()
  `)

  await client.query(`
    CREATE TRIGGER data_search_sync
    AFTER INSERT OR UPDATE OR DELETE ON data
    FOR EACH ROW EXECUTE FUNCTION sync_data_to_search()
  `)

  // populate search_documents with existing data
  await client.query(`
    INSERT INTO search_documents (
      id, source_table, source_id, title, content, 
      type, category, server_id, reliability
    )
    SELECT 
      'message_' || id,
      'message',
      id,
      id,
      content,
      'chat',
      'message',
      "serverId",
      5
    FROM message
    WHERE content IS NOT NULL AND content != ''
    ON CONFLICT DO NOTHING
  `)

  await client.query(`
    INSERT INTO search_documents (
      id, source_table, source_id, title, content, 
      type, category, server_id, app_install_id, reliability
    )
    SELECT 
      'data_' || id,
      'data',
      id,
      key,
      value,
      COALESCE(type, 'app'),
      'data',
      "serverId",
      "appInstallId",
      COALESCE(reliability, 1)
    FROM data
    WHERE permissions != 'private' 
      AND value IS NOT NULL 
      AND value != ''
    ON CONFLICT DO NOTHING
  `)
}
