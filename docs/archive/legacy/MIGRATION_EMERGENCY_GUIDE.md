# Migration Emergency Guide

## 🚨 **When Migration History Gets Out of Sync**

### **Symptoms:**
- `supabase db pull` fails with "migration history does not match"
- Local and remote have different migration states
- Multiple migration repair commands needed

### **Quick Fix (Recommended)**

#### **Option 1: Quick Repair (Easiest)**
```bash
# This will backup your migrations and pull fresh from remote
pnpm db:quick-repair
```

#### **Option 2: Manual Repair (If Quick Repair Fails)**
```bash
# 1. Backup current migrations
cp -r supabase/migrations supabase/migrations.backup.$(date +%Y%m%d_%H%M%S)

# 2. Pull fresh schema from remote
supabase db pull

# 3. Reset local database
supabase db reset
```

### **Prevention Strategy**

#### **Daily Workflow**
```bash
# Morning: Always sync with remote first
pnpm db:sync:from-remote

# Evening: Push changes to remote
pnpm db:sync:to-remote
```

#### **Before Creating New Migrations**
```bash
# 1. Sync with remote
pnpm db:sync:from-remote

# 2. Create migration
pnpm db:sync:create-migration your_migration_name

# 3. Test locally
pnpm supabase:db:reset
pnpm supabase:start

# 4. Push to remote
pnpm db:sync:to-remote
```

### **Emergency Commands**

#### **Complete Reset (Nuclear Option)**
```bash
# Stop everything
pnpm supabase:stop

# Backup migrations
cp -r supabase/migrations supabase/migrations.backup.$(date +%Y%m%d_%H%M%S)

# Pull fresh from remote
supabase db pull

# Reset local
supabase db reset

# Start fresh
pnpm supabase:start
```

#### **Check What's Different**
```bash
# See differences between local and remote
pnpm supabase:db:diff
```

### **Common Error Messages & Solutions**

#### **"migration history does not match"**
```bash
# Use quick repair
pnpm db:quick-repair
```

#### **"relation already exists"**
```bash
# Use IF NOT EXISTS in your migrations
CREATE TABLE IF NOT EXISTS public.table_name (...);
```

#### **"policy already exists"**
```bash
# Drop policy first, then recreate
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
CREATE POLICY "policy_name" ON public.table_name (...);
```

#### **"No such container"**
```bash
# Local Supabase isn't running
pnpm supabase:start
```

### **Recovery Checklist**

After running any repair:

- [ ] Local database starts without errors
- [ ] All tables exist locally
- [ ] All policies are in place
- [ ] Development server starts
- [ ] No migration errors in logs
- [ ] Can create new migrations

### **When to Use Each Approach**

#### **Use Quick Repair When:**
- Migration history is out of sync
- Multiple repair commands needed
- You want to start fresh from remote

#### **Use Manual Repair When:**
- Quick repair fails
- You need to preserve specific local changes
- You want more control over the process

#### **Use Complete Reset When:**
- Everything is broken
- You want to start completely fresh
- Local database is corrupted

### **Best Practices Going Forward**

1. **Always sync with remote before making changes**
2. **Test migrations locally before pushing**
3. **Use descriptive migration names**
4. **Keep migrations small and focused**
5. **Use IF NOT EXISTS and IF EXISTS clauses**
6. **Drop policies before recreating them**

### **Team Communication**

When migration issues occur:

1. **Don't panic** - this is common and fixable
2. **Use the quick repair script** - it's designed for this
3. **Communicate with team** - let others know you're fixing migrations
4. **Document the issue** - note what caused it for future prevention

### **Success Metrics**

After repair:
- ✅ Local database matches remote
- ✅ No migration errors
- ✅ Development environment works
- ✅ Can create new migrations
- ✅ Team can continue development 