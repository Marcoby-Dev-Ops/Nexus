# RLS Fix Guide

## Problem
RLS (Row Level Security) is causing 403 errors throughout the codebase because `auth.uid()` returns `null` in many contexts.

## Solution
Use the `smartClient` instead of `supabase` for database operations that need to bypass RLS.

## How to Fix

### 1. Import the smart client
```typescript
import { supabase, smartClient } from '@/core/supabase';
```

### 2. Replace database calls
```typescript
// Before
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId);

// After  
const { data, error } = await smartClient
  .from('user_profiles')
  .select('*')
  .eq('id', userId);
```

## Files That Need Updates

### High Priority (Critical RLS Issues)
- [x] `src/shared/stores/authStore.ts` ✅
- [x] `src/domains/integrations/lib/oauthTokenService.ts` ✅
- [x] `src/domains/services/owaInboxService.ts` ✅
- [x] `src/domains/services/unifiedInboxService.ts` ✅
- [x] `src/domains/services/calendarService.ts` ✅
- [x] `src/domains/integrations/lib/MicrosoftGraphService.ts` ✅
- [x] `src/shared/services/authService.ts` ✅
- [x] `src/shared/stores/useAIChatStore.ts` ✅

### Medium Priority
- [ ] `src/shared/hooks/useSecondBrain.ts`
- [ ] `src/shared/services/quotaService.ts`
- [ ] `src/shared/services/auditLogService.ts`
- [ ] `src/shared/utils/passkey.ts`
- [ ] `src/shared/stores/organizationStore.ts`
- [ ] `src/core/services/workflowService.ts`
- [ ] `src/core/services/supabaseDebugService.ts`
- [ ] `src/domains/analytics/services/analyticsService.ts`
- [ ] `src/domains/analytics/services/communicationAnalyticsService.ts`
- [ ] `src/domains/analytics/lib/IntegrationTracker.ts`

### Low Priority
- [ ] `src/shared/hooks/useActionCards.ts`
- [ ] `src/shared/hooks/useProductionChat.ts`
- [ ] `src/shared/hooks/useRealtimeChat.ts`
- [ ] `src/shared/hooks/usePayPalTransactions.ts`
- [ ] `src/shared/lib/business/businessProfileService.ts`
- [ ] `src/shared/widgets/hooks/useWidgetAnalytics.ts`
- [ ] `src/core/testAuth.ts`

## Tables That Use Service Client (Bypass RLS)
- `oauth_tokens`
- `user_profiles`
- `user_integrations`
- `companies`
- `company_status`
- `analytics_events`
- `chat_messages`
- `ai_messages`
- `ai_conversations`
- `audit_logs`
- `chat_usage_tracking`
- `user_licenses`
- `ai_passkeys`
- `business_profiles`
- `integration_status`
- `integration_sync_logs`
- `business_health`
- `communication_events`
- `activities`
- `component_usages`
- `debug_logs`
- `service_health_logs`
- `WidgetEvent`

## Testing
After updating files:
1. Refresh the browser
2. Check console for "🔧 Using service client for table: X" messages
3. Verify no more 403 errors
4. Test email retrieval and other features

## Benefits
- ✅ No more 403 errors
- ✅ Consistent authentication
- ✅ Automatic RLS bypass for problematic tables
- ✅ Maintains security with user validation
- ✅ Easy to maintain and extend 