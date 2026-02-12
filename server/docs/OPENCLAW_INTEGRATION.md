# OpenClaw ↔ Nexus Integration

This integration allows OpenClaw conversations to be stored in and displayed by Nexus.

## 🚀 Quick Start

### 1. Deploy the Migrations
After deploying the new migrations (112 and 113), Nexus will:
- Add `source` and `external_id` columns to conversation/message tables
- Create helper functions for OpenClaw conversation management
- Add API endpoints at `/api/openclaw/*`
- Create a system user for OpenClaw (`openclaw-system-user`)

### 2. Configure Environment Variables
Add to your Nexus `.env` file:
```bash
# OpenClaw Integration
OPENCLAW_API_KEY=openclaw-default-key
OPENCLAW_WEBHOOK_URL=http://localhost:18789
```

### 3. Restart Nexus Backend
The new routes will be available at:
- `GET /api/openclaw/health` - Health check
- `POST /api/openclaw/conversations/sync` - Sync a conversation
- `GET /api/openclaw/conversations` - List conversations
- `GET /api/openclaw/conversations/stream` - Real-time stream (SSE)
- `GET /api/openclaw/tools/catalog` - Nexus tool catalog for OpenClaw
- `POST /api/openclaw/tools/execute` - Execute Nexus integration tool action

## 🔌 API Usage

### Discover Nexus Tool Catalog
```bash
curl -X GET "https://napi.marcoby.net/api/openclaw/tools/catalog" \
  -H "X-OpenClaw-Api-Key: openclaw-default-key"
```

### Execute a Nexus Tool
```bash
curl -X POST "https://napi.marcoby.net/api/openclaw/tools/execute" \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Api-Key: openclaw-default-key" \
  -H "X-Nexus-User-Id: f85c26f2893f3221bf0beff64fd40c503340a1c14380b25138a43d69b32f7f57" \
  -d '{
    "tool": "nexus_get_integration_status",
    "args": {}
  }'
```

Available tool names:
- `nexus_get_integration_status`
- `nexus_resolve_email_provider`
- `nexus_start_email_connection`
- `nexus_connect_imap`
- `nexus_test_integration_connection`
- `nexus_disconnect_integration`

### Sync a Conversation from OpenClaw
```bash
curl -X POST https://napi.marcoby.net/api/openclaw/conversations/sync \
  -H "Content-Type: application/json" \
  -H "X-OpenClaw-Api-Key: openclaw-default-key" \
  -d '{
    "userId": "openclaw-system-user",
    "conversationId": "claw-123",
    "title": "Database Fix Discussion",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "I need help fixing the nexus database",
        "created_at": "2026-02-04T23:57:00Z"
      },
      {
        "id": "msg-2", 
        "role": "assistant",
        "content": "I can help! Let me check the database...",
        "created_at": "2026-02-04T23:57:05Z"
      }
    ],
    "model": "openclaw",
    "metadata": {
      "platform": "openclaw",
      "session_id": "session-abc"
    }
  }'
```

### List OpenClaw Conversations
```bash
curl -X GET "https://napi.marcoby.net/api/openclaw/conversations?userId=openclaw-system-user" \
  -H "X-OpenClaw-Api-Key: openclaw-default-key"
```

## 🛠️ Integration Script

Use the included sync script to manually sync conversations:

```bash
# Test connection
node server/scripts/sync-openclaw.js test

# Sync conversations from a JSON file
node server/scripts/sync-openclaw.js sync conversations.json

# List existing conversations
node server/scripts/sync-openclaw.js list

# Stream real-time updates
node server/scripts/sync-openclaw.js stream
```

### Conversation JSON Format
```json
[
  {
    "id": "claw-123",
    "title": "Database Discussion",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "Hello",
        "created_at": "2026-02-04T10:00:00Z"
      },
      {
        "id": "msg-2",
        "role": "assistant", 
        "content": "Hi there!",
        "created_at": "2026-02-04T10:00:05Z"
      }
    ],
    "model": "openclaw",
    "metadata": {}
  }
]
```

## 📊 Database Functions

### SQL Functions Available:
- `create_openclaw_conversation()` - Create a new OpenClaw conversation
- `add_openclaw_message()` - Add a message to an OpenClaw conversation
- `sync_openclaw_conversation()` - Sync an entire conversation with messages
- `get_conversation_stats_by_source()` - Get statistics by source
- `cleanup_old_openclaw_conversations()` - Cleanup old conversations

### Views:
- `openclaw_conversations` - All OpenClaw conversations with messages
- `openclaw_integration_health` - Integration health metrics

## 🔒 Security

### API Key Authentication
All OpenClaw API endpoints require the `X-OpenClaw-Api-Key` header. Configure the key in:
- Nexus: `OPENCLAW_API_KEY` environment variable
- OpenClaw: Use this key when making requests

### User Isolation
- Conversations are tied to `userId`
- System user: `openclaw-system-user` (created by migration 113)
- Can specify different users for multi-tenant scenarios

## 🎯 Real-time Updates

### Server-Sent Events (SSE)
```javascript
// Subscribe to real-time updates
const eventSource = new EventSource('/api/openclaw/conversations/stream?userId=openclaw-system-user');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New conversation update:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
};
```

### Socket.IO (Alternative)
Nexus already has Socket.IO support. OpenClaw can:
1. Connect to Nexus Socket.IO server
2. Join room: `user:openclaw-system-user`
3. Listen for events: `conversation-updated`, `new-message`

## 📈 Monitoring

### Database Views for Monitoring
```sql
-- Check integration health
SELECT * FROM openclaw_integration_health;

-- Get conversation statistics
SELECT * FROM get_conversation_stats_by_source(
  NOW() - INTERVAL '7 days',
  NOW()
);

-- List recent OpenClaw conversations
SELECT * FROM openclaw_conversations 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🚨 Troubleshooting

### Common Issues:

1. **Missing API Key**
   ```
   Error: API key required
   ```
   **Fix**: Set `OPENCLAW_API_KEY` environment variable in Nexus

2. **User Not Found**
   ```
   Error: Foreign key violation - user_id not found
   ```
   **Fix**: Migration 113 creates the system user. Ensure it ran successfully.

3. **Duplicate Conversations**
   - The `sync_openclaw_conversation()` function handles duplicates
   - Uses `external_id` to prevent duplicate conversations
   - Messages are only inserted if they don't exist

4. **Real-time Not Working**
   - Check SSE endpoint: `/api/openclaw/conversations/stream`
   - Verify CORS settings in Nexus server configuration
   - Check browser console for errors

## 🔮 Future Enhancements

### Planned Features:
1. **Bidirectional sync** - Nexus → OpenClaw conversations
2. **Webhook support** - OpenClaw can send webhooks to Nexus
3. **Conversation linking** - Link OpenClaw conversations to Nexus entities
4. **Advanced filtering** - Filter by metadata, date ranges, etc.
5. **Bulk operations** - Import/export conversation archives

### Performance Optimizations:
- Connection pooling for high-volume sync
- Batch message insertion
- Async processing queue
- Redis caching for frequent queries

## 📋 Migration Summary

### Migration 112: `112_add_openclaw_integration.sql`
- Adds `source`, `external_id`, `platform_metadata` columns
- Creates helper functions for OpenClaw operations
- Adds indexes for performance
- Creates `openclaw_conversations` view

### Migration 113: `113_ensure_openclaw_system_user.sql`
- Creates OpenClaw system user (`openclaw-system-user`)
- Adds combined indexes for source+user queries
- Creates health monitoring views
- Adds cleanup function for old conversations

## 🆘 Support

For issues with the integration:
1. Check Nexus server logs for errors
2. Verify migrations ran successfully
3. Test API connectivity with `sync-openclaw.js test`
4. Check database views for data consistency

---

**Last Updated**: 2026-02-05  
**Version**: 1.0.0  
**Status**: Ready for Deployment
