# In-Progress (Server)

Experimental or partial backend logic lives here until it is production ready.

CI Rules (intended):
- Excluded from type-check & lint
- Not imported by route handlers committed to main

Promotion Checklist (move to `server/src/production` or proper folder like `routes`, `services`, `middleware`):
1. Input validation (zod or manual) in place.
2. Logging uses `logger` util (no console.log).
3. Error handling aligned with central error patterns.
4. Realtime events (if any) follow persistence-first lifecycle.
5. Tests (supertest + one failure mode) added after moving.

Purge stale code regularly.
