-- initialize postgresql extensions
-- note: pgvector is already included in the pgvector/pgvector image
-- we just need to ensure pg_trgm is available for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;