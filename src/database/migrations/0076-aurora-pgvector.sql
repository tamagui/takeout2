-- Enable pgvector extension for Aurora PostgreSQL
-- This SQL file ensures pgvector is available in production

-- Aurora requires the extension to be created from a specific user
-- The extension might already exist from our TypeScript migration
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verify extensions are installed
SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pg_trgm');