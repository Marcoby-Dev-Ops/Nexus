# Edge Functions Management Guide

## Overview
This guide covers how to manage your existing Supabase edge functions, including deployment, updates, monitoring, and troubleshooting.

## Current Edge Functions Status

Your project has the following edge functions deployed:
- `ai_chat` - AI chat functionality
- `ai_agent_router` - AI agent routing
- `company-enrichment` - Company data enrichment
- `ai_rag_chat` - RAG-based chat
- `ai_generate_thought_suggestions` - Thought generation
- `ai_embed_thought` - Thought embedding
- `ai_conversation_summariser` - Conversation summarization
- `ai_embed_document` - Document embedding
- `ai_execute_action` - Action execution
- `ai_generate_suggestions` - Suggestion generation
- `ai_ea_stream` - EA streaming
- `ai_metrics_daily` - Daily metrics
- `ai_email_sync` - Email synchronization
- `ai_generate_business_plan` - Business plan generation
- `ai_embed_company_profile` - Company profile embedding
- `ai_sync_cloud_storage` - Cloud storage sync
- `brain_analysis` - Brain analysis
- `merge-thoughts` - Thought merging
- `verify-domain` - Domain verification
- `health` - Health checks
- `assistant` - Assistant functionality
- `pipeline` - Pipeline processing
- `contacts` - Contact management
- `deals` - Deal management
- `google-oauth-callback` - Google OAuth
- `microsoft-graph-oauth-callback` - Microsoft OAuth
- `create_or_reset_test_user` - Test user management
- `credential-manager` - Credential management
- `update_user_role` - User role updates
- `get_users` - User retrieval
- `get_talking_points` - Talking points
- `generate_followup_email` - Follow-up email generation
- `get_finance_performance` - Finance performance
- `get_sales_performance` - Sales performance
- `integration-data-ingestor` - Data ingestion
- `trigger-n8n-workflow` - N8N workflow triggers
- `ai-rag-assessment-chat` - Assessment chat
- `submit-assessment-response` - Assessment responses
- `business_health` - Business health
- `ninjarmm-oauth-callback` - NinjaRMM OAuth
- `supabase` - Supabase utilities
- `stripe-customer-portal` - Stripe customer portal
- `stripe-subscription-webhook` - Stripe webhooks
- `stripe-checkout-session` - Stripe checkout
- `complete-founder-onboarding` - Founder onboarding
- `hubspot-callback` - HubSpot callbacks
- `hubspot-connect` - HubSpot connection
- `sync_user_profile` - User profile sync
- `ops_action_worker` - Operations worker
- `ops_metrics_ingest` - Metrics ingestion
- `paypal_refresh_token` - PayPal token refresh
- `paypal_oauth_callback` - PayPal OAuth
- `paypal_sync` - PayPal sync
- `upsert_kpis` - KPI management
- `passkey-register-challenge` - Passkey registration
- `passkey-auth-verify` - Passkey verification
- `passkey-auth-challenge` - Passkey challenges
- `passkey-register-verify` - Passkey registration verification
- `healthz` - Health checks
- `workspace-items` - Workspace management
- `stripe-billing` - Stripe billing
- `chat` - Chat functionality

## Quick Commands

### Check Function Status
```bash
# List all deployed functions
pnpm supabase functions list --project-ref kqclbpimkraenvbffnpk

# Check specific function logs
pnpm supabase functions logs ai_chat --project-ref kqclbpimkraenvbffnpk
```

### Deploy Individual Functions
```bash
# Deploy a single function
pnpm supabase functions deploy ai_chat --project-ref kqclbpimkraenvbffnpk

# Deploy multiple functions
pnpm supabase functions deploy ai_chat ai_agent_router --project-ref kqclbpimkraenvbffnpk
```

### Deploy All Functions
```bash
# Use the deployment script
chmod +x scripts/deploy-edge-functions.sh
./scripts/deploy-edge-functions.sh
```

## Environment Variables

Your edge functions need these environment variables set:

### Required Variables
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `OPENAI_API_KEY` - OpenAI API key for AI functions
- `OPENROUTER_API_KEY` - OpenRouter API key (alternative to OpenAI)

### Optional Variables
- `BRAVE_API_KEY` - Brave API key for search functions
- `STRIPE_SECRET_KEY` - Stripe secret key for billing functions
- `HUBSPOT_CLIENT_SECRET` - HubSpot client secret
- `MICROSOFT_CLIENT_SECRET` - Microsoft client secret
- `NINJARMM_CLIENT_SECRET` - NinjaRMM client secret

### Set Environment Variables
```bash
# Set a single variable
pnpm supabase secrets set OPENAI_API_KEY=your_key_here --project-ref kqclbpimkraenvbffnpk

# Set multiple variables
pnpm supabase secrets set --project-ref kqclbpimkraenvbffnpk \
  OPENAI_API_KEY=your_key_here \
  OPENROUTER_API_KEY=your_key_here
```

## Testing Edge Functions

### Test AI Chat Function
```bash
# Test with curl
curl -X POST "https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/ai_chat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

### Test Health Check
```bash
# Test health function
curl -X GET "https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/health"
```

## Troubleshooting

### Common Issues

1. **Function Not Responding**
   ```bash
   # Check function logs
   pnpm supabase functions logs FUNCTION_NAME --project-ref kqclbpimkraenvbffnpk
   
   # Check function status
   pnpm supabase functions list --project-ref kqclbpimkraenvbffnpk
   ```

2. **Environment Variable Issues**
   ```bash
   # List all secrets
   pnpm supabase secrets list --project-ref kqclbpimkraenvbffnpk
   
   # Update a secret
   pnpm supabase secrets set VARIABLE_NAME=new_value --project-ref kqclbpimkraenvbffnpk
   ```

3. **Deno Cache Issues**
   - Update import URLs to use cached versions
   - Use consistent versions across functions
   - Example: `https://deno.land/std@0.168.0/http/server.ts`

### Debugging Steps

1. **Check Function Logs**
   ```bash
   pnpm supabase functions logs ai_chat --project-ref kqclbpimkraenvbffnpk --follow
   ```

2. **Test Function Locally**
   ```bash
   # Start local Supabase
   pnpm supabase start
   
   # Test function locally
   curl -X POST "http://127.0.0.1:54321/functions/v1/ai_chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "test"}'
   ```

3. **Check Function Code**
   ```bash
   # View function code
   cat supabase/functions/ai_chat/index.ts
   ```

## Update Workflow

### When to Update Functions
- After making code changes
- When environment variables change
- When dependencies need updating
- When new features are added

### Update Process
1. **Make Code Changes**
   ```bash
   # Edit function code
   nano supabase/functions/ai_chat/index.ts
   ```

2. **Test Locally** (Optional)
   ```bash
   pnpm supabase start
   # Test your changes
   ```

3. **Deploy to Remote**
   ```bash
   pnpm supabase functions deploy ai_chat --project-ref kqclbpimkraenvbffnpk
   ```

4. **Verify Deployment**
   ```bash
   # Check function status
   pnpm supabase functions list --project-ref kqclbpimkraenvbffnpk
   
   # Test the function
   curl -X GET "https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/ai_chat"
   ```

## Monitoring

### Health Checks
```bash
# Check all functions health
curl -X GET "https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/health"

# Check specific function
curl -X GET "https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/ai_chat"
```

### Log Monitoring
```bash
# Follow logs in real-time
pnpm supabase functions logs ai_chat --project-ref kqclbpimkraenvbffnpk --follow

# Get recent logs
pnpm supabase functions logs ai_chat --project-ref kqclbpimkraenvbffnpk --limit 50
```

## Best Practices

1. **Version Control**
   - Keep function code in version control
   - Use consistent import versions
   - Document function changes

2. **Error Handling**
   - Always include proper error handling
   - Log errors for debugging
   - Return meaningful error messages

3. **Security**
   - Validate all inputs
   - Use proper authentication
   - Don't expose sensitive data

4. **Performance**
   - Cache expensive operations
   - Use streaming for large responses
   - Optimize database queries

## Quick Reference

### Project Information
- **Project ID**: `kqclbpimkraenvbffnpk`
- **Project URL**: `https://kqclbpimkraenvbffnpk.supabase.co`
- **Functions URL**: `https://kqclbpimkraenvbffnpk.supabase.co/functions/v1/`

### Key Functions
- **AI Chat**: `/ai_chat` - Main chat functionality
- **Health Check**: `/health` - System health monitoring
- **Agent Router**: `/ai_agent_router` - AI agent routing

### Common Commands
```bash
# Deploy all functions
./scripts/deploy-edge-functions.sh

# Deploy single function
pnpm supabase functions deploy FUNCTION_NAME --project-ref kqclbpimkraenvbffnpk

# Check logs
pnpm supabase functions logs FUNCTION_NAME --project-ref kqclbpimkraenvbffnpk

# List functions
pnpm supabase functions list --project-ref kqclbpimkraenvbffnpk
``` 