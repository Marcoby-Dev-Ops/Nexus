# Nexus CKB Starter (API Edition)

Express API for BYO storage + zero-retention document generation and retrieval. Endpoints:
- `POST /documents/generate` (DOCX merge → upload to SharePoint/OneDrive/Drive)
- `POST /rag/query` (search-only or customer_index via pgvector)

## Run
```bash
pnpm i
cp .env.example .env
pnpm run migrate
pnpm run dev:api
```

## Security
- Provide short-lived tokens (MS_ACCESS_TOKEN) or integrate MSAL in a gateway.
- No document bodies are persisted; processing is in memory.
- For customer_index, point `DATABASE_URL` to the **customer's** Postgres/pgvector.
