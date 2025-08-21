import { Client } from "pg"; import 'dotenv/config';
const url = process.env.DATABASE_URL!;
const dim = Number(process.env.PGVECTOR_DIM || "1536");
const sql = `
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS ckb_documents (
  file_id TEXT PRIMARY KEY, drive_id TEXT NOT NULL, provider TEXT NOT NULL, title TEXT NOT NULL, mime TEXT NOT NULL,
  web_url TEXT NOT NULL, last_modified TIMESTAMPTZ NOT NULL, acl_hash TEXT NOT NULL, domain TEXT[] NOT NULL, doc_type TEXT NOT NULL, taxonomy TEXT[] NOT NULL
);
CREATE TABLE IF NOT EXISTS ckb_chunks (
  id TEXT PRIMARY KEY, file_id TEXT NOT NULL REFERENCES ckb_documents(file_id) ON DELETE CASCADE,
  heading_path TEXT, page_from INT, page_to INT, text TEXT NOT NULL, embedding vector(${dim}) NOT NULL, acl_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ckb_chunks_embedding ON ckb_chunks USING hnsw (embedding vector_l2_ops);
`;
async function main(){ const client = new Client({ connectionString: url }); await client.connect(); await client.query(sql); await client.end(); console.log("pgvector schema ready."); }
main().catch(e=>{ console.error(e); process.exit(1); });
