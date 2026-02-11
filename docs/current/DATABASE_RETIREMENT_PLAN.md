# Database Retirement Plan

The following tables have been identified as technical debt during the February 2026 profile persistence investigation. They are currently empty on production and appear redundant or superseded by the `user_profiles` architecture.

## High Priority for Retirement

### `quantum_business_profiles`
- **Reason**: 0 rows on production. No foreign key constraints referencing it. 
- **Legacy Docs**: [QUANTUM_BUSINESS_MODEL_IMPLEMENTATION.md](../archive/legacy-database/QUANTUM_BUSINESS_MODEL_IMPLEMENTATION.md) describes this as a "universal schema" that is not currently active.

### `identities`
- **Reason**: 0 rows on production. Superseded by `user_profiles`.
- **Legacy Docs**: [FOUNDATION_FIELD_MAPPING.md](../archive/legacy-database/FOUNDATION_FIELD_MAPPING.md) maps this to the `CompanyFoundation` interface.
- **Dependencies**: `companies.identity_id` references this table.

## Lower Priority / Pending Review

### `organizations` & `user_organizations`
- **Reason**: 0 rows. 
- **Legacy Docs**: [ORGANIZATION_CONSOLIDATION.md](../archive/legacy-database/ORGANIZATION_CONSOLIDATION.md) (Jan 2025) claims this consolidation was completed, but the tables remain empty in favor of `user_profiles` and legacy `companies`.

---
*Note: Before dropping any tables, a full codebase search for references should be performed to ensure no legacy scripts or edge-case features are impacted.*
