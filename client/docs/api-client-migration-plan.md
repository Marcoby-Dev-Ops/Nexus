# API Client Migration Plan

Goal: Eliminate direct feature/service imports from `@/lib/api-client` in favor of the stable re-export surface `@/lib/database` (and eventual internalization of the low-level client).

## Current State

Direct usages still exist in service, core, and AI modules. A parity test (`databaseExports.test.ts`) assures re-export availability.

## Principles

1. Incremental: small PR-sized batches reduce risk.
2. Observable: run type-check + parity test each batch.
3. Reversible: no behavioral changes inside helpers until all callers migrated.
4. Traceable: commit messages prefixed `chore(db-migrate):`.

## Phases

| Phase | Scope | Notes |
|-------|-------|-------|
| 1 | Low-risk leaf modules (AI components & core utilities) | Completed initial sample (composer, enhancedChat, contextualRAG). |
| 2 | Remaining AI services & vector search | Swap imports; ensure no restricted-import lint regressions. |
| 3 | Business/services layer (thoughtsService, quotaService, attachment service, RAG services) | Adjust restricted import rule once all are moved. |
| 4 | Core auth & database wrappers (`queryWrapper`, `secureStorage`, `logger`) | Validate logging still works. |
| 5 | Pages & hooks (any residual direct import) | Mechanical updates. |
| 6 | Tests & mocks referencing `@/lib/api-client` | Update mocks to target `@/lib/database` or local stub. |
| 7 | Lockdown: Rename `api-client.ts` → `_internalApiClient.ts` and provide re-export only through `database` | Update internal imports accordingly. |
| 8 | Cleanup: Remove deprecation banner or convert to internal doc | Final tidy. |

## Acceptance Criteria per Phase

* No failing type checks or parity test.
* No new ESLint errors beyond existing warnings baseline.
* Application build (vite) passes.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Hidden circular deps after renaming file | Run dependency analyzer (future step) before Phase 7. |
| Tests relying on deep internal types | Expose explicit types via `database/index.ts` before rename. |
| Lint restricted-import rule blocks partial progress | Temporarily allow both during migration; tighten after Phase 5. |

## Tracking

Maintain checklist in this doc or project board; tick off file groups as migrated.

## Rollback Plan

If a regression surfaces, revert the latest batch commit; helpers remain identical so risk window is small.

---
Document owner: Platform / Infra.
Initial draft generated: (automated) – adjust as needed.
