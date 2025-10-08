-- Ensure pgvector extension is available before any migration that uses the `vector` type
-- This file runs during container initialization (docker-entrypoint-initdb.d)
CREATE EXTENSION IF NOT EXISTS vector;
