# In-Progress vs Production Code Structure

To keep `main` always deployable while enabling early collaboration, the repo now supports two explicit states for application code inside both the client and server.

## Folder Layout

Client:
```
client/src/in-progress/
client/src/production/   (optional short-lived staging)
```

Server:
```
server/src/in-progress/
server/src/production/   (optional short-lived staging)
```

You may still (prefer to) place production‑ready code directly into its domain path (e.g. `client/src/pages/...`, `client/src/services/...`, `server/src/routes/...`, `server/src/services/...`). The `production` folders are purely transitional.

## CI / Tooling Behavior
- TypeScript: `src/in-progress` is excluded from type checking & build (see updated tsconfig files).
- ESLint: `src/in-progress` is ignored, so WIP code does not fail CI.
- Tests: Do not add or rely on tests under `in-progress`; add tests once code is promoted.
- Bundles: Vite / runtime will not include `in-progress` code unless you manually import it elsewhere (avoid doing that until promotion).

## Promotion Checklist (Client & Server)
Before moving a module from `in-progress` to its real destination (preferred) or the temporary `production` folder:
1. API / component / service contract is stable.
2. Proper typing (no temporary `any` left without justification).
3. Validation / guards in place at trust boundaries (server: zod or equivalent; client: schema for form inputs if applicable).
4. Logging (server) via `logger` util; no stray `console.log` / debug noise.
5. Error handling follows central patterns (throw domain errors; rely on middleware on server).
6. Realtime events (if any) follow persist → derive payload → emit lifecycle.
7. Tests: minimum happy path + one failure mode (server: supertest; client: vitest + RTL) added post‑promotion.
8. Docs / comments for non-obvious behavior.

## Anti-Patterns
- Leaving code indefinitely in `in-progress` (review weekly and prune).
- Importing from `in-progress` into production code—treat it as an isolated sandbox.
- Duplicating logic (refactor or extract shared modules when promoting).

## Migrating Existing WIP Code
If you currently have partially finished branches, you can land skeletal versions into `in-progress` early to collaborate without breaking builds. When ready, move files and fix any resulting lint/type errors, then add tests.

## Maintenance
A lightweight script could later enforce that no file lingers in `in-progress` > N days; not implemented yet.

## FAQ
**Q: Can I put tests in `in-progress`?** Not recommended. They will be ignored and may give a false sense of coverage.

**Q: Why have a `production` folder at all?** Useful as a brief staging lane during refactors where final domain placement is undecided. If it stays empty, we can remove it.

**Q: How do I promote code?** `git mv client/src/in-progress/myFeature.ts client/src/services/feature/myFeature.ts` (adjust path) and update imports. Run lint + type checks and add tests.

---
Last updated: 2025-10-07
