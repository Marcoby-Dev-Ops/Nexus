# Development Setup Guide

## 🚀 Quick Start

### 1. Environment Setup
Your `.env` file is already configured with the remote Supabase project.

### 2. Database Commands

```bash
# Check remote database connection
echo "Remote database is active"

# Reset database (WARNING: Deletes all data)
pnpm dev:reset

# Setup database schema
pnpm db:setup

# Pull latest schema from remote
pnpm supabase:db:pull

# Push local changes to remote
pnpm supabase:db:push

# Generate diff of local vs remote
pnpm supabase:db:diff

# Dump database schema
pnpm supabase:db:dump
```

### 3. Development Workflow

```bash
# Start development server (connects to remote Supabase)
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix
```

## 🔧 Database Management

### Reset Database
```bash
# Complete reset (drops all tables and recreates)
pnpm dev:reset
```

### Update Schema
```bash
# Apply schema changes
pnpm db:setup
```

### Sync with Remote
```bash
# Pull latest schema
pnpm supabase:db:pull

# Push local changes
pnpm supabase:db:push
```

## 📊 Core Services Database Tables

| Service | Table | Purpose |
|---------|-------|---------|
| AnalyticsService | `activities` | Event tracking |
| BillingService | `user_licenses`, `chat_usage_tracking` | Billing data |
| DashboardService | `user_profiles` | User data |
| ProfileContextService | `user_profiles` | User profiles |
| SlashCommandService | `ai_action_card_templates` | Command templates |
| UserService | `audit_log_events` | Audit logs |
| UserDataService | `recents`, `pins`, `tasks`, `notifications` | User data |
| CommunicationAnalyticsService | `communication_events` | Communication tracking |
| CompanyStatusService | `company_status` | Company health |
| SupabaseDebugService | `debug_logs` | Debug logging |

## 🔒 Security

All tables have Row Level Security (RLS) enabled with appropriate policies:
- Users can only access their own data
- Company data is isolated by company_id
- Admin-only tables require admin role

## 🐛 Debugging

### Check Database Connection
```bash
# Test connection to remote database
psql "$DATABASE_URL" -c "SELECT version();" || echo "Database connection failed"
```

### View Debug Logs
```typescript
import { supabaseDebugService } from '@/core/services/supabaseDebugService';

// Log debug info
await supabaseDebugService.logDebug('info', 'Test message', { data: 'test' });

// Get debug logs
const logs = await supabaseDebugService.getDebugLogs();
```

### Database Health Check
```typescript
import { supabaseDebugService } from '@/core/services/supabaseDebugService';

const health = await supabaseDebugService.getSystemHealth();
console.log('System Health:', health);
```

## 📝 Environment Variables

Key environment variables in `.env`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://kqclbpimkraenvbffnpk.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=postgresql://postgres.kqclbpimkraenvbffnpk:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres

# External APIs
VITE_OPENROUTER_API_KEY=your_openrouter_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## 🚨 Troubleshooting

### Database Connection Issues
1. Check if remote database is accessible: `psql "$DATABASE_URL" -c "SELECT version();"`
2. Verify environment variables are set
3. Check network connectivity

### Schema Sync Issues
1. Pull latest schema: `pnpm supabase:db:pull`
2. Reset if needed: `pnpm dev:reset`
3. Check for migration conflicts

### Development Server Issues
1. Clear cache: `rm -rf node_modules/.vite`
2. Reinstall dependencies: `pnpm install`
3. Restart dev server: `pnpm dev`

## 📚 Useful Commands

```bash
# Database operations
pnpm db:reset          # Reset database completely
pnpm db:setup          # Setup schema
pnpm supabase:db:pull  # Pull remote schema
pnpm supabase:db:push  # Push local changes

# Development
pnpm dev               # Start dev server
pnpm test              # Run tests
pnpm type-check        # Type checking
pnpm lint              # Linting

# Database CLI
psql "$DATABASE_URL" -c "SELECT version();"   # Test remote connection
``` 