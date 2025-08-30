## Onboarding Journeys — Q&A Guide

This guide captures the key questions and concise answers used while reviewing how onboarding journeys work in the codebase. It links to the exact implementation points for quick navigation.

### What stores onboarding progress?
- **Tables**:
  - `user_onboarding_steps`: individual step completions per user
  - `user_onboarding_completions`: historic completion records/metadata
  - `user_profiles.onboarding_completed`: canonical flag for completion
- **References**:
  - `supabase/migrations/20250102000000_create_onboarding_tables.sql`
  - `supabase/migrations/20250102000001_fix_onboarding_rls_policies.sql`

### What are the required steps to be considered complete?
- **Source**: RPC `get_required_onboarding_steps()` returns the canonical list.
- **Reference**: `supabase/migrations/20250807080000_create_get_required_onboarding_steps_function.sql`
- **Example result** (managed by migrations):
  - `welcome-introduction`
  - `basic-profile-creation`
  - `authentication-verification`
  - `account-activation`
  - `company-information`
  - `industry-selection`
  - `business-context`
  - `goal-definition`
  - `ai-capability-selection`
  - `success-confirmation`

### How is completion verified end-to-end?
- **Edge function**: `supabase/functions/verify-onboarding-completion/index.ts`
  - Checks `user_profiles.onboarding_completed`
  - Verifies linked company via `user_profiles.company_id` and `companies`
  - Compares `user_onboarding_steps.step_id` against `get_required_onboarding_steps()`
  - Optional signals: `user_integrations`, `analytics_events` (`onboarding_completed`)

### What writes completion on onboarding finish?
- **Edge function**: `supabase/functions/complete-founder-onboarding/index.ts`
  - Sets `user_profiles.onboarding_completed = true` and updates `preferences`
  - Ensures a `companies` record exists; links `user_profiles.company_id`
  - Seeds initial KPIs/insights; logs audit event

### How does the frontend track/show onboarding?
- **State**: Local, persisted UI state via Zustand store (`src/shared/stores/onboardingStore.ts`)
- **Coordination**: App wrapper determines showing flow based on config and auth (`src/shared/components/layout/AppWithOnboarding.tsx`, `src/shared/config/onboardingConfig.ts`)

### Minimal checks to query a specific user’s status
- **SQL (read-only)**:
```sql
-- 1) Canonical profile flag
select onboarding_completed
from user_profiles
where id = :user_id;

-- 2) Completed steps vs required
select array_agg(step_id order by step_id) as completed_step_ids
from user_onboarding_steps
where user_id = :user_id;

-- 3) Required steps (RPC)
select public.get_required_onboarding_steps();
```
- **Programmatic**: Call `verify-onboarding-completion` with body `{ "userId": "<uuid>", "triggerRemediation": false }` to get a result summary, checks, and recommendations.

### RLS and permissions notes
- Onboarding tables have RLS enabled and policies for `authenticated` and `service_role` to support the flow.
- **Reference**: `supabase/migrations/20250102000001_fix_onboarding_rls_policies.sql`

### Operational checklist to consider a user “onboarded”
- `user_profiles.onboarding_completed = true`
- All required steps present in `user_onboarding_steps`
- `user_profiles.company_id` set and `companies` record exists
- Optional: at least one integration connected
- Optional: analytics event `onboarding_completed` logged

---
This document should be updated when onboarding migrations or edge functions change.
