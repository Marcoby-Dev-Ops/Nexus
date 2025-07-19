# Remote Database as Source of Truth

This guide ensures that the remote Supabase database is always the authoritative source of truth for your application.

## 🎯 Current Setup

- **Local Development**: Connected to remote Supabase instance
- **Remote Database**: `kqclbpimkraenvbffnpk.supabase.co`
- **Environment**: All variables point to remote instance

## 📋 Sync Commands

### Quick Sync
```bash
# Pull latest from remote (source of truth)
pnpm sync:from-remote

# Sync local changes to remote
pnpm sync:to-remote

# Check sync status
pnpm sync:status
```

### Manual Sync Steps
```bash
# 1. Create new migration (if needed)
pnpm supabase migration new your_migration_name

# 2. Apply to remote
pnpm supabase db push --project-ref kqclbpimkraenvbffnpk

# 3. Verify changes
pnpm supabase db diff --project-ref kqclbpimkraenvbffnpk --schema public
```

## 🔄 Development Workflow

### 1. **Start Development (Always Pull from Remote First)**
```bash
# Pull latest schema from remote (source of truth)
pnpm sync:from-remote

# Check current remote status
pnpm sync:status
```

### 2. **During Development**
- Make your local changes
- Test with remote database
- Create migrations as needed

### 3. **After Making Changes**
```bash
# Sync to remote
pnpm sync:to-remote

# Verify sync
pnpm sync:status
```

## 📊 Database Tables Status

✅ **All tables are synced to remote:**
- `billing_plans`
- `user_billing_plans` 
- `integration_status`
- `business_health`
- `ai_insights`
- `ai_action_card_templates`
- `service_health_logs`
- `user_profiles`

## 🚨 Important Notes

### Remote Database as Source of Truth
- **Remote database is the authoritative source**
- All environment variables point to remote instance
- No local Supabase instance running
- Clean development environment

### Migration Management
- Always pull from remote first: `pnpm sync:from-remote`
- All migrations are applied to remote
- Local and remote are in sync
- Use `pnpm sync:to-remote` for future changes

### Edge Functions
- Edge functions run on remote instance
- No local function deployment needed
- Functions are automatically available

## 🔧 Troubleshooting

### If Sync Fails
```bash
# Check remote status
pnpm supabase status --project-ref kqclbpimkraenvbffnpk

# Reset local migrations (if needed)
pnpm supabase db reset --project-ref kqclbpimkraenvbffnpk

# Pull latest from remote
pnpm supabase db pull --project-ref kqclbpimkraenvbffnpk
```

### If Environment Issues
```bash
# Verify environment variables
cat .env | grep SUPABASE

# Should show:
# VITE_SUPABASE_URL=https://kqclbpimkraenvbffnpk.supabase.co
# SUPABASE_URL=https://kqclbpimkraenvbffnpk.supabase.co
```

## ✅ Verification Checklist

Before committing changes:
- [ ] Pulled latest from remote: `pnpm sync:from-remote`
- [ ] Local changes work with remote database
- [ ] Migrations are applied to remote
- [ ] Edge functions are working
- [ ] Authentication flows correctly
- [ ] No local Supabase conflicts
- [ ] Remote database is source of truth

## 🎉 Benefits

- **Remote as Source of Truth**: Single authoritative database
- **Consistent Environment**: Same as production
- **Real Data**: Your actual user account and data
- **No Conflicts**: No local/remote confusion
- **Fast Development**: Direct remote connection
- **Reliable Sync**: Automated sync process
- **Data Integrity**: Always working with latest schema 