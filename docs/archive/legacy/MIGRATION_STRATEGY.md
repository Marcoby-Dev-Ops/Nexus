# Database Migration Strategy

## 🎯 **Goal**
Maintain perfect synchronization between local and remote Supabase databases to prevent schema drift and migration conflicts.

## 📋 **Current Problems**
- Local and remote databases get out of sync
- Migrations fail due to existing tables/policies
- Manual fixes required to resolve conflicts
- Inconsistent development experience

## ✅ **Permanent Solution**

### **1. Single Source of Truth**
**Remote database is the source of truth for production schema.**

### **2. Development Workflow**

#### **Starting Development**
```bash
# Always start by syncing from remote
pnpm db:sync:from-remote

# Start local development
pnpm supabase:start
pnpm dev
```

#### **Creating New Migrations**
```bash
# 1. Ensure you're synced with remote
pnpm db:sync:from-remote

# 2. Create new migration
pnpm db:sync:create-migration add_new_feature

# 3. Edit the migration file
# Edit: supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql

# 4. Test locally
pnpm supabase:db:reset
pnpm supabase:start

# 5. Push to remote
pnpm db:sync:to-remote
```

#### **When Things Get Out of Sync**
```bash
# Option 1: Reset local to match remote (recommended)
pnpm db:sync:from-remote

# Option 2: Force push local to remote (use with caution)
pnpm db:sync:to-remote

# Option 3: Check what's different
pnpm supabase:db:diff
```

### **3. Migration Best Practices**

#### **✅ Do's**
- Always pull from remote before creating new migrations
- Test migrations locally before pushing to remote
- Use descriptive migration names
- Keep migrations small and focused
- Use `IF NOT EXISTS` and `IF EXISTS` clauses
- Drop policies before recreating them

#### **❌ Don'ts**
- Don't manually edit remote database schema
- Don't skip testing migrations locally
- Don't create migrations without pulling latest from remote
- Don't use generic migration names
- Don't create large, complex migrations

### **4. Migration Template**
```sql
-- Migration: descriptive_name
-- Date: YYYY-MM-DD
-- Description: What this migration does

-- Always use IF NOT EXISTS for CREATE statements
CREATE TABLE IF NOT EXISTS public.new_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Always use IF EXISTS for DROP statements
DROP POLICY IF EXISTS "policy_name" ON public.table_name;

-- Enable RLS if needed
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Create policies with proper naming
CREATE POLICY "Users can view own data" ON public.new_table
    FOR SELECT USING (auth.uid() = user_id);
```

### **5. Emergency Recovery**

#### **If Local is Broken**
```bash
# Complete reset
pnpm supabase:stop
pnpm supabase:db:reset
pnpm db:sync:from-remote
pnpm supabase:start
```

#### **If Remote is Broken**
```bash
# Check what's different
pnpm supabase:db:diff

# Create a migration to fix remote
pnpm db:sync:create-migration fix_remote_schema

# Apply the fix
pnpm db:sync:to-remote
```

### **6. Automated Scripts**

#### **Quick Sync Commands**
```bash
# Sync from remote to local
pnpm db:sync:from-remote

# Sync from local to remote
pnpm db:sync:to-remote

# Create new migration
pnpm db:sync:create-migration <name>

# Check sync status
pnpm db:sync:status

# Get help
pnpm db:sync:help
```

### **7. Team Workflow**

#### **Before Starting Work**
```bash
# Always sync with remote first
pnpm db:sync:from-remote
```

#### **After Making Changes**
```bash
# Test locally
pnpm supabase:db:reset
pnpm supabase:start

# If tests pass, push to remote
pnpm db:sync:to-remote
```

#### **When Pulling from Git**
```bash
# After git pull, sync database
pnpm db:sync:from-remote
```

### **8. Troubleshooting**

#### **Common Issues**

**Migration Fails: "relation already exists"**
```bash
# Use IF NOT EXISTS in your migration
CREATE TABLE IF NOT EXISTS public.table_name (...);
```

**Migration Fails: "policy already exists"**
```bash
# Drop policy first, then recreate
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
CREATE POLICY "policy_name" ON public.table_name (...);
```

**Local and Remote are Different**
```bash
# Check differences
pnpm supabase:db:diff

# Reset local to match remote
pnpm db:sync:from-remote
```

**Can't Connect to Local Database**
```bash
# Complete restart
pnpm supabase:stop
pnpm supabase:start
```

### **9. Monitoring**

#### **Regular Checks**
```bash
# Check sync status weekly
pnpm db:sync:status

# Check for drift
pnpm supabase:db:diff
```

#### **Before Deployments**
```bash
# Ensure local matches remote
pnpm db:sync:from-remote

# Test all migrations
pnpm supabase:db:reset
```

## 🎯 **Success Metrics**
- ✅ No more "relation already exists" errors
- ✅ No more manual schema fixes
- ✅ Consistent development experience
- ✅ Reliable deployments
- ✅ Team can work without conflicts

## 📚 **Additional Resources**
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Database Migration Best Practices](https://supabase.com/docs/guides/database/migrations)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security) 