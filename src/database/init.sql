-- initialize postgresql extensions
-- note: pgvector is already included in the pgvector/pgvector image
-- we just need to ensure pg_trgm is available for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- zero-cache databases (cvr + change tracking)
CREATE DATABASE zero_cvr;
CREATE DATABASE zero_cdb;