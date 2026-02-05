# OpenClaw Integration Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Check Current Database State
```sql
-- Verify current migration version
SELECT MAX(version) as latest_migration FROM schema_migrations;
-- Should be 111

-- Check if OpenClaw columns already exist
SELECT column_name FROM information_schema.columns 
WHERE table_name IN ('ai_conversations', 'ai_messages') 
AND column_name IN ('source', 'external_id', 'platform_metadata');
```

### 2. Verify Migration Files Exist
```bash
# In Nexus server directory
ls -la migrations/112_*.sql migrations/113_*.sql
ls -la routes/openclaw-integration.js
ls -la scripts/sync-openclaw.js scripts/test-openclaw-integration.js
```

### 3. Check Server Configuration
```bash
# Verify server.js includes OpenClaw routes
grep -n "openclaw" server/server.js
# Should show import and app.use lines
```

## 🚀 Deployment Steps

### Step 1: Run Migrations
```bash
cd /root/openclaw-workspace/Nexus/server
npm run migrate
```

### Step 2: Verify Migrations Applied
```bash
npm run migrate:status
# Should show versions 112 and 113 as applied
```

### Step 3: Restart Nexus Backend
```bash
# In Coolify, restart the Nexus Backend application
# Or if using command line:
cd /root/openclaw-workspace/Nexus/server
npm start
```

### Step 4: Test Integration
```bash
# Run the integration test
cd /root/openclaw-workspace/Nexus/server
node scripts/test-openclaw-integration.js
```

### Step 5: Verify API Endpoints
```bash
# Test health endpoint
curl -X GET "https://napi.marcoby.net/api/openclaw/health" \
  -H "X-OpenClaw-Api-Key: openclaw-default-key"

# Should return: {"success":true,"status":"healthy",...}
```

## 🔧 Post-Deployment Configuration

### 1. Configure OpenClaw Environment Variables
Add to OpenClaw's environment:
```bash
NEXUS_API_URL="https://napi.marcoby.net"
OPENCLAW_API_KEY="openclaw-default-key"  # Must match Nexus .env
NEXUS_USER_ID="openclaw-system-user"
```

### 2. Modify OpenClaw to Sync Conversations
In OpenClaw code, add conversation syncing:
```javascript
// When a conversation starts/ends in OpenClaw:
const conversationData = {
  userId: process.env.NEXUS_USER_ID,
  conversationId: openclawConversationId,
  title: conversationTitle,
  messages: conversationMessages,
  model: 'openclaw',
  metadata: { /* additional context */ }
};

// Sync to Nexus
await fetch(`${process.env.NEXUS_API_URL}/api/openclaw/conversations/sync`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-OpenClaw-Api-Key': process.env.OPENCLAW_API_KEY
  },
  body: JSON.stringify(conversationData)
});
```

### 3. Set Up Real-time Updates (Optional)
For real-time conversation streaming:
```javascript
// In Nexus frontend, subscribe to OpenClaw conversations
const eventSource = new EventSource(
  `/api/openclaw/conversations/stream?userId=openclaw-system-user`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update UI with new conversation/message
};
```

## 📊 Monitoring

### Database Health Checks
```sql
-- Check OpenClaw integration health
SELECT * FROM openclaw_integration_health;

-- Get conversation statistics
SELECT * FROM get_conversation_stats_by_source();

-- List recent OpenClaw conversations
SELECT * FROM openclaw_conversations 
ORDER BY created_at DESC 
LIMIT 5;
```

### Log Monitoring
Check Nexus server logs for:
- `[INFO] OpenClaw conversation synced` - Successful syncs
- `[ERROR] Failed to sync OpenClaw conversation` - Sync failures
- `[INFO] OpenClaw SSE connection established` - Real-time connections

## 🚨 Troubleshooting

### Common Issues:

1. **Migrations Not Running**
   ```
   Error: migration file not found
   ```
   **Fix**: Ensure migration files are in `/server/migrations/` directory

2. **API Key Rejected**
   ```
   Error: Invalid API key
   ```
   **Fix**: Set `OPENCLAW_API_KEY` in Nexus `.env` file

3. **User Not Found**
   ```
   Error: Foreign key violation
   ```
   **Fix**: Migration 113 should create the system user automatically

4. **Duplicate Conversations**
   - The sync function handles duplicates using `external_id`
   - No action needed - it's idempotent

5. **Real-time Not Working**
   - Check browser console for CORS errors
   - Verify SSE endpoint: `/api/openclaw/conversations/stream`
   - Check Nexus logs for connection attempts

## 🔄 Rollback Procedure

If needed, rollback migrations:
```sql
-- Remove OpenClaw system user (if created)
DELETE FROM user_profiles WHERE user_id = 'openclaw-system-user';

-- Drop OpenClaw-specific functions and views
DROP VIEW IF EXISTS openclaw_integration_health;
DROP VIEW IF EXISTS openclaw_conversations;
DROP FUNCTION IF EXISTS get_conversation_stats_by_source;
DROP FUNCTION IF EXISTS cleanup_old_openclaw_conversations;
DROP FUNCTION IF EXISTS sync_openclaw_conversation;
DROP FUNCTION IF EXISTS add_openclaw_message;
DROP FUNCTION IF EXISTS create_openclaw_conversation;

-- Remove OpenClaw columns
ALTER TABLE ai_messages 
DROP COLUMN IF EXISTS platform_metadata,
DROP COLUMN IF EXISTS external_id,
DROP COLUMN IF EXISTS source;

ALTER TABLE ai_conversations 
DROP COLUMN IF EXISTS platform_metadata,
DROP COLUMN IF EXISTS external_id,
DROP COLUMN IF EXISTS source;

-- Remove migration records
DELETE FROM schema_migrations WHERE version IN ('112', '113');
```

## 📞 Support

For deployment issues:
1. Check migration logs: `npm run migrate:status`
2. Test API connectivity: `node scripts/test-openclaw-integration.js`
3. Check database: `SELECT * FROM schema_migrations ORDER BY version DESC;`
4. Review Nexus server logs for errors

---

**Deployment Status**: Ready  
**Estimated Time**: 5-10 minutes  
**Risk Level**: Low (migrations are idempotent)  
**Backup Recommended**: Always backup database before migrations