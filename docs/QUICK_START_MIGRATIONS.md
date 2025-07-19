# Quick Start: Database Migrations

## 🚀 **Immediate Actions**

### **1. Fix Current Sync Issues**
```bash
# Reset local to match remote (recommended)
pnpm db:sync:from-remote

# Start development
pnpm supabase:start
pnpm dev
```

### **2. Create New Migration (When Needed)**
```bash
# 1. Sync with remote first
pnpm db:sync:from-remote

# 2. Create migration
pnpm db:sync:create-migration your_migration_name

# 3. Edit the migration file
# File: supabase/migrations/YYYYMMDDHHMMSS_your_migration_name.sql

# 4. Test locally
pnpm supabase:db:reset
pnpm supabase:start

# 5. Push to remote
pnpm db:sync:to-remote
```

## 📋 **Daily Workflow**

### **Morning (Start of Day)**
```bash
# Pull latest changes
git pull

# Sync database with remote
pnpm db:sync:from-remote

# Start development
pnpm supabase:start
pnpm dev
```

### **Evening (End of Day)**
```bash
# If you made database changes
pnpm db:sync:to-remote

# Commit and push
git add .
git commit -m "Add database changes"
git push
```

## 🆘 **Emergency Commands**

### **If Something Breaks**
```bash
# Complete reset
pnpm supabase:stop
pnpm db:sync:from-remote
pnpm supabase:start
```

### **Check What's Different**
```bash
# See differences between local and remote
pnpm supabase:db:diff
```

## ✅ **Success Checklist**
- [ ] Local database matches remote
- [ ] No migration errors
- [ ] All tables exist locally
- [ ] All policies are in place
- [ ] Development server starts without errors

## 📞 **Need Help?**
```bash
# Get help with sync commands
pnpm db:sync:help

# Check sync status
pnpm db:sync:status
``` 