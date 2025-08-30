# RLS Overhaul: Authentik Integration Guide

## Overview

This guide explains how to properly integrate Row Level Security (RLS) with Authentik identity management, replacing the previous Supabase-based authentication system.

## Problem Statement

Your current RLS policies use `auth.uid()` which is Supabase-specific, but you've migrated to Authentik for identity management. This creates a security gap where RLS policies don't work properly.

## Solution Architecture

### Identity Flow
1. **Authentik** → Issues JWT tokens with user identity
2. **JWT Token** → Contains `sub` (user ID) and `is_superuser` claims
3. **Database** → Uses helper functions to map Authentik IDs to internal UUIDs
4. **RLS Policies** → Use helper functions instead of `auth.uid()`

### Key Components

#### 1. External User Mappings
```sql
-- Maps Authentik user IDs to internal UUIDs
external_user_mappings:
- external_user_id (Authentik user ID)
- internal_user_id (Internal UUID)
- provider ('authentik')
```

#### 2. Helper Functions
- `get_current_user_id()` - Gets internal UUID from JWT token
- `is_current_user_admin()` - Checks admin status from JWT
- `get_current_user_org_ids()` - Gets user's organization memberships
- `is_user_in_organization()` - Checks specific organization membership

#### 3. RLS Policy Patterns
```sql
-- User-owned data
CREATE POLICY "Users can manage own data" ON table_name
    FOR ALL USING (user_id = get_current_user_id());

-- Organization-based data
CREATE POLICY "Users can access organization data" ON table_name
    FOR ALL USING (
        user_id = get_current_user_id() OR
        user_id IN (
            SELECT user_id FROM user_organizations 
            WHERE org_id = ANY(get_current_user_org_ids())
        )
    );

-- Admin access
CREATE POLICY "Admins can access all data" ON table_name
    FOR ALL USING (is_current_user_admin());
```

## Implementation Steps

### Step 1: Prerequisites

1. **Authentik Setup Complete**
   - OAuth2 provider configured
   - JWT tokens contain required claims
   - User mappings exist in `external_user_mappings`

2. **Database Configuration**
   - JWT claims passed to PostgreSQL
   - `request.jwt.claims` setting available

### Step 2: Run the Migration Script

Execute the `rls_overhaul_authentik_final.sql` script:

```bash
# Connect to your database and run:
psql -d your_database -f scripts/db/rls_overhaul_authentik_final.sql
```

### Step 3: Verify Implementation

Run the verification query:
```sql
SELECT 
    t.table_name,
    t.rowsecurity,
    COUNT(p.policyname) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_policies p ON t.table_name = p.tablename AND p.schemaname = 'public'
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'information_schema%'
GROUP BY t.table_name, t.rowsecurity
ORDER BY t.table_name;
```

### Step 4: Test Helper Functions

With a valid JWT token, test the helper functions:
```sql
SELECT get_current_user_id();
SELECT is_current_user_admin();
SELECT get_current_user_org_ids();
SELECT is_user_in_organization('some-org-uuid');
```

## Policy Categories

### 1. User-Owned Data (Personal)
**Pattern**: `user_id = get_current_user_id()`
- personal_automations
- personal_thoughts
- user_contexts
- user_preferences
- user_quotas
- user_onboarding_completions
- user_onboarding_steps
- user_profiles

### 2. Organization-Based Data (Multi-tenant)
**Pattern**: Organization membership check
- companies
- contacts
- deals
- conversations
- interactions
- calendar_events
- business_health
- client_health_scores
- data_point_definitions
- unified_client_profiles
- ai_client_intelligence_alerts
- ai_client_interactions
- ai_insights
- ai_interactions
- ai_messages
- ai_success_outcomes
- ai_unified_client_profiles
- cross_platform_correlations
- integration_data
- integration_data_records
- department_metrics_view

### 3. System-Wide Data (Admin Access)
**Pattern**: `is_current_user_admin()`
- audit_logs
- security_audit_log
- demo_data
- department_metrics_view

### 4. Public Data (No RLS)
- ai_models
- analytics_events
- business_metrics
- callback_events
- company_members
- company_status
- documents
- environment_config
- external_user_mappings
- integrations
- oauth_tokens
- organizations
- schema_migrations
- tasks
- thoughts
- user_ai_model_preferences
- user_integrations
- user_mappings
- user_sessions

## JWT Token Requirements

Your Authentik JWT tokens must contain:

```json
{
  "sub": "authentik-user-id",
  "is_superuser": true/false,
  "email": "user@example.com",
  "groups": ["group1", "group2"]
}
```

## Database Connection Configuration

Ensure your database connection passes JWT claims:

```typescript
// In your database connection setup
const connection = {
  // ... other config
  options: {
    // Pass JWT claims to PostgreSQL
    jwt: {
      claims: 'request.jwt.claims'
    }
  }
};
```

## Security Considerations

### 1. JWT Token Validation
- Verify token signature
- Check expiration
- Validate issuer (Authentik)
- Validate audience (your application)

### 2. User Mapping Security
- Ensure `external_user_mappings` is properly secured
- Validate provider field
- Use `SECURITY DEFINER` for helper functions

### 3. Policy Testing
- Test with different user roles
- Verify organization isolation
- Test admin access patterns
- Validate edge cases

## Troubleshooting

### Common Issues

1. **`get_current_user_id()` returns NULL**
   - Check JWT token contains `sub` claim
   - Verify user mapping exists in `external_user_mappings`
   - Ensure `request.jwt.claims` setting is available

2. **Admin policies not working**
   - Check JWT token contains `is_superuser` claim
   - Verify claim is boolean value
   - Test `is_current_user_admin()` function

3. **Organization policies not working**
   - Verify user has organization memberships
   - Check `user_organizations` table
   - Test `get_current_user_org_ids()` function

### Debug Queries

```sql
-- Check JWT claims
SELECT current_setting('request.jwt.claims', true)::json;

-- Check user mappings
SELECT * FROM external_user_mappings WHERE provider = 'authentik';

-- Check organization memberships
SELECT * FROM user_organizations WHERE user_id = get_current_user_id();
```

## Migration Checklist

- [ ] Authentik OAuth2 provider configured
- [ ] JWT tokens contain required claims
- [ ] User mappings exist in `external_user_mappings`
- [ ] Database connection passes JWT claims
- [ ] Migration script executed successfully
- [ ] Helper functions tested
- [ ] RLS policies verified
- [ ] Application tested with different user roles
- [ ] Performance impact assessed
- [ ] Rollback plan prepared

## Rollback Plan

If issues arise, use the rollback script:
```bash
psql -d your_database -f scripts/db/rls_overhaul_rollback.sql
```

## Performance Considerations

1. **Helper Function Optimization**
   - Functions use `SECURITY DEFINER` for performance
   - Consider caching for frequently accessed data
   - Monitor query performance with RLS enabled

2. **Index Requirements**
   - Ensure indexes on `external_user_mappings.external_user_id`
   - Index `user_organizations.user_id` and `user_organizations.org_id`
   - Monitor slow queries after RLS implementation

3. **Connection Pooling**
   - JWT claims must be set per connection
   - Consider connection pool configuration
   - Monitor connection overhead

## Next Steps

1. **Phase 2**: Advanced organization-based policies
2. **Phase 3**: Cross-organization data sharing
3. **Phase 4**: Audit logging and compliance
4. **Phase 5**: Performance optimization

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review JWT token structure
3. Verify database configuration
4. Test helper functions individually
5. Monitor application logs for errors
