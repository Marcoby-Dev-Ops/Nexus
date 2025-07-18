# Nexus Test Organization & Best Practices

## Test Directory Structure

- `__tests__/` – All integration, security, and business logic tests (Jest/Vitest)
- `src/components/ComponentName.test.tsx` – Unit/component tests (close to source)
- `supabase/` – Database migrations and SQL-based tests (if any)

## Naming Conventions
- Use `.test.ts`, `.test.tsx`, or `.spec.ts` for test files
- Use clear, descriptive names (e.g., `rls.business.test.ts`, `AuthContext.test.tsx`)

## Best Practices
- **Integration/security tests:** Place in `__tests__/security/` or `__tests__/` root
- **Unit/component tests:** Place next to the component or in `src/components/`
- **Security tests:** Always cover RLS, permissions, and cross-tenant isolation
- **CI integration:** Run all tests in CI/CD; block deploys on failure

## Running Tests
- Use `pnpm test` or `pnpm run test` to run all Jest/Vitest tests
- Use `pnpm test -- --coverage` for coverage reports

## Security
- Security tests are critical for protecting business and customer data
- Review and update security tests after any schema or RLS policy change

---

*For questions, contact the Nexus platform engineering team.* 