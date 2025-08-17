# Nexus Database Migration to pgvector 17

## ✅ Migration Completed Successfully

### Database Instance
- **Container Name:** `pgvector-17`
- **Image:** `pgvector/pgvector:pg17`
- **Port:** `5433` (external) → `5432` (internal)
- **Database:** `vector_db`
- **Status:** ✅ Running and Healthy

### Schema Migration Summary

#### Extensions Installed
- ✅ `vector` (v0.8.0) - Vector similarity search
- ✅ `pgcrypto` - Encryption functions
- ✅ `uuid-ossp` - UUID generation

#### Core Tables Created (15 tables)
- ✅ `auth.users` - User authentication
- ✅ `public.user_profiles` - User profiles
- ✅ `public.companies` - Company management
- ✅ `public.company_members` - Company membership
- ✅ `public.integrations` - Integration definitions
- ✅ `public.user_integrations` - User integration instances
- ✅ `public.tasks` - Task management
- ✅ `public.thoughts` - Thoughts with vector embeddings
- ✅ `public.documents` - Documents with vector embeddings
- ✅ `public.ai_models` - AI model configurations
- ✅ `public.user_ai_model_preferences` - User AI preferences
- ✅ `public.analytics_events` - Analytics tracking
- ✅ `public.callback_events` - Webhook callbacks
- ✅ `public.oauth_tokens` - OAuth token storage
- ✅ `public.environment_config` - Environment configuration

#### Vector Features
- ✅ Vector embeddings (1536 dimensions)
- ✅ IVFFlat indexes for similarity search
- ✅ Cosine similarity functions
- ✅ `match_documents()` function
- ✅ `match_thoughts()` function

#### Performance Optimizations
- ✅ Indexes on foreign keys
- ✅ Indexes on frequently queried columns
- ✅ Vector indexes for similarity search
- ✅ Updated_at triggers for all tables

#### Default Data
- ✅ Default integrations (OpenAI, Anthropic, HubSpot, Slack)
- ✅ Default AI models (GPT-4, GPT-3.5, Claude-3)
- ✅ Admin user (admin@nexus.local / admin123)
- ✅ Default company (Nexus Development)

## 🔧 Connection Details

### Database Connection
```bash
# Direct connection
psql -h localhost -p 5433 -U postgres -d vector_db

# Connection string
postgresql://postgres:postgres@localhost:5433/vector_db
```

### Environment Variables
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/vector_db
DB_HOST=localhost
DB_PORT=5433
DB_NAME=vector_db
DB_USER=postgres
DB_PASSWORD=postgres
```

## 🚀 Next Steps

### 1. Update Application Configuration
- Update your application's database connection to use the new pgvector instance
- Modify environment variables to point to localhost:5433
- Update any Supabase-specific code to work with the new schema

### 2. Test Vector Functionality
```sql
-- Test vector similarity search
SELECT * FROM match_documents('[0.1, 0.2, 0.3, ...]'::vector(1536), 5);

-- Test thoughts similarity search
SELECT * FROM match_thoughts('[0.1, 0.2, 0.3, ...]'::vector(1536), 5);
```

### 3. Data Migration (if needed)
- Export data from Supabase if you want to migrate existing data
- Use the migration script as a template for data import
- Test with a subset of data first

### 4. Application Updates
- Update authentication logic to work with the new auth.users table
- Modify any Supabase-specific queries to work with the new schema
- Update vector search implementations to use the new functions

### 5. Production Deployment
- Set up similar pgvector instance in Coolify
- Use the same migration script for production
- Configure proper security and backups

## 🔍 Verification Commands

### Check Database Status
```bash
docker ps --filter name=pgvector-17
```

### Verify Schema
```bash
docker exec pgvector-17 psql -U postgres -d vector_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

### Test Vector Extension
```bash
docker exec pgvector-17 psql -U postgres -d vector_db -c "SELECT '[0.1, 0.2, 0.3]'::vector(3);"
```

### Check Extensions
```bash
docker exec pgvector-17 psql -U postgres -d vector_db -c "SELECT * FROM pg_extension;"
```

## 📊 Schema Comparison

| Feature | Supabase | pgvector 17 | Status |
|---------|----------|-------------|---------|
| Vector Search | ✅ | ✅ | ✅ Migrated |
| Authentication | ✅ | ✅ | ✅ Simplified |
| RLS Policies | ✅ | ❌ | 🔄 Not needed for local dev |
| Real-time | ✅ | ❌ | 🔄 Can be added if needed |
| Storage | ✅ | ❌ | 🔄 Can be added if needed |
| Edge Functions | ✅ | ❌ | 🔄 Can be added if needed |

## 🛠️ Troubleshooting

### Container Issues
```bash
# Restart container
docker restart pgvector-17

# Check logs
docker logs pgvector-17

# Recreate container
docker rm -f pgvector-17
docker run -d --name pgvector-17 --network supabase_network_kqclbpimkraenvbffnpk -e POSTGRES_DB=vector_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 pgvector/pgvector:pg17
```

### Database Issues
```bash
# Connect and check
docker exec -it pgvector-17 psql -U postgres -d vector_db

# Reset database
docker exec pgvector-17 psql -U postgres -d vector_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## 📝 Notes

- This migration creates a simplified version of your Supabase schema
- RLS (Row Level Security) policies are not included as they're not needed for local development
- The auth schema is simplified but functional for development
- Vector functionality is fully preserved and enhanced
- All core business logic tables are included
- The migration is reversible - you can always go back to Supabase

## 🎯 Success Criteria

- ✅ Database is running and accessible
- ✅ All core tables are created
- ✅ Vector extensions are working
- ✅ Default data is populated
- ✅ Indexes are created for performance
- ✅ Functions and triggers are working
- ✅ Connection details are documented

Your local development environment is now ready with pgvector 17! 🎉
