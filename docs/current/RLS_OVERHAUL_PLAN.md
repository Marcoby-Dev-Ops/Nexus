# RLS (Row Level Security) Overhaul Plan

## Current State Analysis

### Critical Issues Identified:
1. **52 tables have RLS enabled but NO policies** - Complete access denial
2. **Only 3 tables have proper policies** - Massive security gap
3. **Missing organization-based access control** - No multi-tenant isolation
4. **No role-based access patterns** - Missing admin/superuser access
5. **Inconsistent user isolation** - Tables with user_id lack proper policies

### Tables with RLS Enabled but No Policies:
- ai_client_intelligence_alerts
- ai_client_interactions
- ai_insights
- ai_interactions
- ai_messages
- ai_success_outcomes
- ai_unified_client_profiles
- audit_logs
- business_health
- calendar_events
- client_health_scores
- companies
- contacts
- conversations
- cross_platform_correlations
- data_point_definitions
- deals
- demo_data
- department_metrics_view
- integration_data
- integration_data_records
- interactions
- personal_automations
- personal_thoughts
- security_audit_log
- unified_client_profiles
- user_contexts
- user_preferences
- user_quotas

## RLS Policy Categories

### 1. User-Owned Data (Personal)
**Pattern**: `user_id = auth.uid()`
- personal_automations
- personal_thoughts
- user_contexts
- user_preferences
- user_quotas

### 2. Organization-Based Data (Multi-tenant)
**Pattern**: `org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())`
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

### 3. System-Wide Data (Admin Access)
**Pattern**: `auth.uid() IN (SELECT user_id FROM user_organizations WHERE role = 'admin')`
- audit_logs
- security_audit_log
- demo_data
- department_metrics_view

### 4. Public Read-Only Data
**Pattern**: `true` for SELECT, `false` for INSERT/UPDATE/DELETE
- ai_models (read-only)

## Implementation Strategy

### Phase 1: Critical Security Fixes
1. **Disable RLS on tables that should be public**
2. **Add basic user isolation policies**
3. **Fix immediate access issues**

### Phase 2: Organization-Based Access
1. **Implement organization membership checks**
2. **Add role-based access control**
3. **Create admin access patterns**

### Phase 3: Advanced Security
1. **Add audit logging policies**
2. **Implement data sharing policies**
3. **Add cross-organization access patterns**

## Policy Templates

### User-Owned Data Template
```sql
-- Users can manage their own data
CREATE POLICY "Users can manage own data" ON table_name
    FOR ALL USING (user_id = auth.uid());
```

### Organization-Based Template
```sql
-- Users can access data from their organizations
CREATE POLICY "Users can access organization data" ON table_name
    FOR ALL USING (
        org_id IN (
            SELECT org_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );
```

### Admin Access Template
```sql
-- Admins can access all data
CREATE POLICY "Admins can access all data" ON table_name
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE role = 'admin'
        )
    );
```

### Read-Only Template
```sql
-- Anyone can read, no one can modify
CREATE POLICY "Public read access" ON table_name
    FOR SELECT USING (true);
    
CREATE POLICY "No modifications" ON table_name
    FOR ALL USING (false);
```

## Migration Plan

### Step 1: Backup Current State
```sql
-- Export current RLS configuration
SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public';
```

### Step 2: Disable RLS on Public Tables
```sql
ALTER TABLE ai_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics DISABLE ROW LEVEL SECURITY;
-- ... other public tables
```

### Step 3: Add User Isolation Policies
```sql
-- Add policies for user-owned data
CREATE POLICY "Users can manage own personal_automations" ON personal_automations
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own personal_thoughts" ON personal_thoughts
    FOR ALL USING (user_id = auth.uid());
-- ... continue for all user-owned tables
```

### Step 4: Add Organization-Based Policies
```sql
-- Add policies for organization-based data
CREATE POLICY "Users can access organization companies" ON companies
    FOR ALL USING (
        owner_id = auth.uid() OR
        id IN (
            SELECT org_id 
            FROM user_organizations 
            WHERE user_id = auth.uid()
        )
    );
-- ... continue for all organization-based tables
```

### Step 5: Add Admin Access Policies
```sql
-- Add admin access policies
CREATE POLICY "Admins can access all audit_logs" ON audit_logs
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id 
            FROM user_organizations 
            WHERE role = 'admin'
        )
    );
-- ... continue for all admin-access tables
```

## Testing Strategy

### 1. Policy Validation
- Test each policy with different user roles
- Verify organization isolation works correctly
- Test admin access patterns

### 2. Performance Testing
- Measure query performance with RLS enabled
- Optimize policies if needed
- Add appropriate indexes

### 3. Security Testing
- Attempt unauthorized access
- Verify data isolation
- Test edge cases

## Rollback Plan

### Emergency Rollback
```sql
-- Disable RLS on all tables if needed
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true)
    LOOP
        EXECUTE 'ALTER TABLE ' || r.tablename || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;
```

### Selective Rollback
```sql
-- Remove specific policies
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

## Success Criteria

1. **All tables with RLS have appropriate policies**
2. **Users can access their own data**
3. **Organization isolation works correctly**
4. **Admin access functions properly**
5. **No performance degradation**
6. **All existing functionality preserved**

## Timeline

- **Phase 1**: 1-2 days (Critical security fixes)
- **Phase 2**: 3-5 days (Organization-based access)
- **Phase 3**: 2-3 days (Advanced security)
- **Testing**: 2-3 days
- **Total**: 8-13 days

## Risk Mitigation

1. **Backup before each phase**
2. **Test in staging environment first**
3. **Implement changes during low-traffic periods**
4. **Have rollback procedures ready**
5. **Monitor application logs for errors**
