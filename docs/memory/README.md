# Memory / FactStore README

This document explains how to run the `facts` semantic memory loop locally for development and smoke testing.

## Overview

The FactStore uses Postgres + pgvector to store structured facts (policy, org facts, goals). The server exposes RPC and REST endpoints to query and upsert facts.

Key endpoints

- POST /api/facts/search
  - body: { query_text: string } or { query_embedding: number[] }
  - returns: ranked fact rows with `score` field

- POST /api/facts/upsert
  - body: { key, value, kind, metadata, org_id, user_id }
  - Upserts a fact and attempts to generate an embedding (server-side)

## Local setup

1. Ensure Postgres with `pgvector` is running. The repo includes a docker-compose file referencing pgvector.

2. Run migrations (server migrator will automatically run during server startup):

```bash
pnpm -C server run migrate
# OR start the server which triggers migrations automatically
pnpm -C server run dev
```

3. Seed example facts (after server + DB are ready):

```bash
node server/scripts/seedFacts.js
```

## Smoke test

Search by text (server will generate embedding for the query):

```bash
curl -X POST http://localhost:3001/api/facts/search \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query_text":"remote work policy", "match_count":5}'
```

You should receive a JSON response with `success: true` and `data: [...]` containing facts with `score`.

## Telemetry

The `match_facts` RPC logs the following fields: `userId`, `org_id`, `match_count`, `resultCount`, `avgScore`, and `durationMs`.

Client-side telemetry is also available. The client ships a small TelemetryService that buffers events and POSTs them to `/api/telemetry/batch`.

Telemetry events recorded by the client when performing FactStore lookups include:

- type: `factstore.search`
- payload: { query, matchCount, topSimilarity, durationMs, orgId }

Server telemetry endpoint (developer-only) is available at `/api/telemetry/batch` and will log incoming events with attached user context.

## Troubleshooting

- If `embedding` column insertion fails, ensure your Postgres image has `pgvector` installed and the extension enabled.
- If `ivfflat` index creation throws errors, it's safe for development; create index manually in a production-ready DB after loading enough vectors.

## Next steps

- Add more seed data and domain-specific policies for richer testing.
- Build MemoryInspector to visualize facts during agent interactions.

Added utilities in this repo for validation and developer observability:

- MemoryInspector (React component) — drop-in dev panel located at `client/src/components/MemoryInspector`.
  - Mount `MemoryInspectorWrapper` in a dev-only layout to see queries and returned facts.
- TelemetryService (client) — `client/src/lib/telemetry/TelemetryService.ts` records `factstore.search` events and flushes to `/api/telemetry/batch`.
- Validation script — `scripts/validateFacts.js` runs sample queries against `/api/rpc/match_facts` and prints matches.
- Unit test — a focused Jest test `client/tests/enhancedMemoryService.factstore.test.ts` mocks FactStore RPC results to prevent regressions.
