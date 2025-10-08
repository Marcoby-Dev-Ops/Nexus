## Nexus AI Coding Agent Instructions

Concise, project-specific rules so an AI agent can ship correct changes fast. Focus on what is unique here—avoid generic boilerplate.

### 1. Core Architecture Mental Model
- Monorepo: `client/` (React 19 + Vite + Vitest) and `server/` (Express + Socket.IO + PostgreSQL + pgvector). Root `package.json` only proxies scripts.
- Frontend domains live under `client/src/pages/<domain>` and supporting logic in `client/src/services`, `client/src/core` (value objects, event patterns), `client/src/shared` (design system & hooks).
- Backend routes are thin adapters in `server/src/routes/*` calling services in `server/services` or `server/src/*` (db, middleware, utils). Prefer adding logic in a service layer, not directly in route handlers.
- Realtime: Socket.IO established in `server/server.js`; UI subscribes via hooks (naming pattern `use<X>...`). Emit events through `io.to(room).emit()` after persisting changes.
- Data layering: Single source of truth often JSONB (see `DATA_ARCHITECTURE.md`), UI derives focused views—do not denormalize unless measured.

### 2. Conventions & Patterns
- No cross‑domain direct imports between page folders; use a service or shared abstraction if reuse is needed.
- Prefer functional, typed React components with lightweight Zustand or React Query handling server state; colocate domain hooks under the domain folder or `/hooks` if cross‑cutting.
- Validation: Use `zod` schemas where data crosses trust boundaries (API request parsing, form submit transformations).
- Logging (server): use `logger` from `server/src/utils/logger`. Never `console.log` in backend code.
- Rate limiting: Attach new endpoints to an existing limiter group in `server/src/middleware/rateLimit.js`; cost‑sensitive AI routes use `aiLimiter`.
- Optional modules (e.g. `factsRoutes`) are required defensively; follow the try/catch pattern if adding another optional route.

### 3. When Adding / Modifying Backend APIs
1. Create or extend route in `server/src/routes/<feature>.js` (keep handler minimal).
2. Put business logic in a service (check existing naming in `server/services/` first—reuse if aligned).
3. Validate input (zod or manual) before DB calls.
4. Emit realtime events only after successful commit.
5. Add a supertest case in `server/__tests__/` mirroring existing style (look for similar route tests) covering success + one failure mode.

### 4. Frontend Data Access & State
- Use React Query for server state (cache keys: `[domain, entityId, qualifier]`). Update optimistic flows only if latency > 250ms or user action disruptive.
- Keep complex derived UI logic in memoized selectors or dedicated hooks (e.g. `useNavigatorMetrics`).
- For new realtime streams: create a hook `use<Domain>Channel` that sets up Socket.IO subscription and normalizes payloads before updating state stores.

### 5. Database & Migrations
- Migrations live under `server/migrations/` or scripted runners invoked by `MigrationRunner` (see `server/server.js`). On startup, migrations run; failures log warn but do not block. Maintain idempotency.
- If adding JSONB fields used in UI lenses, document extraction pattern in a short comment referencing `DATA_ARCHITECTURE.md`.

### 6. Performance & Safety Defaults
- Do not introduce N+1 DB loops—batch queries or push processing server-side.
- Large payload endpoints must set explicit `limit` and pagination params; mirror existing query param naming (`limit`, `offset` or `cursor`).
- Keep request bodies <10mb (enforced). For larger data (files) use existing upload endpoints or add one with `multer` config.
- All new external calls must have timeouts & error handling; reuse existing axios instance pattern if present (search before creating).

### 7. Security & Access
- Authentication via JWT (Socket.IO & routes). Do not trust userId passed from client—always derive from token middleware if available.
- Add RBAC / permission logic via existing guards (search `rbac.guard.ts` style before inventing). UI gating uses `usePermission` hook.
- Sensitive endpoints: ensure correct limiter and avoid verbose error leakage (return generic messages, log detail server-side).

### 8. Tooling & Commands (For Tests / CI parity)
- Lint (full): `pnpm -w lint` (server is linted via client workspace tooling).
- Client tests: `pnpm --filter nexus-client test` (Vitest). Coverage threshold 90% enforced in custom scripts—match structure when adding suites.
- Server tests: `pnpm test:api` if script exists; otherwise add `test` entries in `server/package.json` (Jest + supertest).
- Type checks: `pnpm client:type-check` and `pnpm --filter nexus-client run type-check`; server: `pnpm --filter nexus-api-server run type-check` (or script `type-check`).

### 9. Realtime Event Lifecycle (Additions)
1. Persist change (DB / service).
2. Derive minimal event payload (avoid leaking raw internal objects).
3. Emit to targeted room(s): `user:<id>` or logical rooms (e.g. `insights`).
4. Frontend hook normalizes → updates state store / query cache.
5. Components subscribe through hook—never directly through Socket.IO in component bodies.

### 10. Adding a New Domain (UI)
1. Scaffold folder under `client/src/pages/<domain>` (page entry + index barrel).
2. Add service in `client/src/services/<Domain>Service.ts` for API calls.
3. Add types in `client/src/types/<domain>.ts` or colocate if small.
4. Provide integration test (Vitest) for primary hook + one component snapshot/behavior test.
5. Register route in app router (check existing config under `client/src/app`).

### 11. Coding Style Highlights
- Prefer narrow, composable functions; avoid exporting large objects with mutable state.
- Use explicit return types on exported functions & hooks.
- Avoid magic strings: centralize constants (`/shared/constants` or local `constants.ts`).
- Keep imports clean; run `pnpm -w lint` before committing.

### 12. What NOT To Do
- Don’t duplicate business logic in both client & server—derive on server, send structured payload.
- Don’t bypass service layer in routes.
- Don’t introduce cross‑domain coupling via deep relative imports across `pages/*` domains.
- Don’t store derived view state permanently in DB unless justified (document reasoning).

### 13. Fast Triage Checklist (Agent Self-Check Before PR)
- Linted (zero errors) & type‑clean.
- Tests added/updated for new logic (happy + one failure path).
- Realtime events (if added) follow 5‑step lifecycle.
- Security: inputs validated, no sensitive data in logs, correct limiter.
- Docs: updated any referenced architectural doc if contract changed.

---
If something here seems outdated or missing (e.g. a new domain pattern emerged), highlight it in the PR summary so maintainers can evolve these instructions.

---

### Appendix: Domain & Advanced System Notes

#### Domain Quick Map
AI (`ai`), Analytics (`analytics`), Automation (`automation`), Business (`business`), Dashboard (`dashboard`), Integrations (`integrations`), Navigator (`navigator`), Help-Center (`help-center`), Auth (`auth`) under `client/src/pages/*` mirror server route groups. Never import across domains directly—go through `client/src/services/*`.

#### AI Agent & Memory Stack
Executive → Specialist → Tool agents. Memory layers: facts + dialogue + thoughts feed embedding retrieval (pgvector) before tool routing. AI routes under `/api/ai` & `/api/ai-insights`. Add new tool logic in a service; keep prompt assembly deterministic & log-safe (no PII). Re-embed only if content hash changed.

#### Knowledge Vault Flow
Upload → chunk → embed (pgvector) → hybrid similarity × FTS search. Store a content hash; skip re-embedding if unchanged. Do not denormalize embeddings; derive views client-side.

#### Automation / Workflows
Domain event → queue/webhook (n8n/BullMQ) → downstream processing → Socket.IO broadcast (room `insights` or domain-specific). Never invoke automation engine directly from React; always via server service.

#### Analytics & Navigator Streaming
KPI snapshot/derivation happens server-side; broadcast minimal delta payload `{ id, v, at }`. Client hooks (e.g. `useNavigatorMetrics`) recompute aggregates—do not send pre-aggregated expansions.

#### RBAC & RLS Nuance
RLS at DB enforces baseline; server adds contextual filters only (pagination/date). Derive `userId`, `orgId` from token/middleware; never trust request body. Reject mismatched IDs early with 403 + generic message.

#### Devtools CLI (Preferred over Manual)
`pnpm devtools scaffold --type=page --name=Foo` (new domain/page skeleton + test stub). `devtools validate staged` (lint + type + custom rules). `devtools migrate --up` (apply DB migrations). Avoid hand-crafting directory trees that scaffolder supports.

#### Observability
Custom metrics (prom-client) must reuse existing label sets—avoid high-cardinality (no per-user labels). Log via `logger`; include `feature`, `entityId`, not raw payloads.

#### Error Handling Pattern
Throw domain/service errors → centralized `errorHandler` shapes response. Do not partially write response then throw. Realtime errors: log; never emit partial failure payloads.

#### Socket.IO Event Example
```js
// Server (after successful DB commit)
io.to(`user:${userId}`).emit('kpi:update', { id: metricId, v: newValue, at: Date.now() });
```
Client hook normalizes & updates query cache; components subscribe through that hook only.

#### Test Patterns
Server (Jest + supertest) place under `server/__tests__`: happy path + one failure (validation / auth). Client (Vitest) colocate or in `client/tests`; maintain 90% coverage—new public logic requires at least minimal test.

#### Embedding Recompute Rule
```ts
if (sha256(content) !== existing.hash) await reembed(content);
```
Skip otherwise; record hash alongside embedding metadata.

