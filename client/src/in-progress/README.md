# In-Progress (Client)

Code placed here is experimental, incomplete, or not yet ready for CI/CD.

CI Rules (intended):
- Type-check & lint: skipped (folder will be excluded in tsconfig + eslint ignores)
- Builds: not bundled
- Tests: avoid colocated tests here; move to production before adding tests

Promotion Checklist (move to `client/src/production` or appropriate domain folder under `src/pages`, `src/services`, etc.):
1. Architecture reviewed / aligns with project conventions.
2. Types solid (no implicit any / temporary hacks removed).
3. Adequate test coverage (≥ minimal happy + failure path) once moved.
4. Naming & file placement follow domain boundaries.
5. No secrets or debug logs.

After promotion, delete stale files from here.
