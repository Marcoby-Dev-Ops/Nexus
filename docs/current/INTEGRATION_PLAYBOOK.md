# 🔗 Integration Playbook - OAuth Integration Template

**Last Updated**: August 10, 2025  
**Version**: 1.0  
**Status**: Active Template  
**Pattern**: OAuth 2.0 Integration Flow

## 🎯 **Overview**

This playbook provides a standardized approach for building OAuth integrations in Nexus, following the proven pattern established by HubSpot and Microsoft integrations. Use this template to rapidly deploy new integrations with consistent architecture, security, and user experience.

## 📋 **Integration Checklist**

### **Phase 1: Planning & Setup (Day 1)**

#### **1.1 Service Analysis**
- [ ] **Identify OAuth Endpoints**
  - Authorization URL: `https://provider.com/oauth/authorize`
  - Token URL: `https://provider.com/oauth/token`
  - User Info URL: `https://provider.com/userinfo`

- [ ] **Define Required Scopes**
  ```typescript
  const REQUIRED_SCOPES = [
    'https://api.provider.com/scope1',
    'https://api.provider.com/scope2',
    'https://api.provider.com/scope3'
  ];
  ```

- [ ] **Map API Endpoints**
  - Data retrieval endpoints
  - Account/property discovery endpoints
  - Rate limiting requirements
  - Error handling patterns

#### **1.2 Environment Configuration**
- [ ] **Add Environment Variables**
  ```bash
  # .env.local
  VITE_PROVIDER_CLIENT_ID=your_client_id
  VITE_PROVIDER_CLIENT_SECRET=your_client_secret
  
  # Supabase Edge Functions
  PROVIDER_CLIENT_ID=your_client_id
  PROVIDER_CLIENT_SECRET=your_client_secret
  ```

- [ ] **Update Supabase Secrets**
  ```bash
  supabase secrets set PROVIDER_CLIENT_ID=your_client_id
  supabase secrets set PROVIDER_CLIENT_SECRET=your_client_secret
  ```

### **Phase 2: Frontend Implementation (Day 2)**

#### **2.1 Setup Component**
**File**: `src/components/integrations/ProviderSetup.tsx`

```typescript
// Template Structure
export function ProviderSetup({ onComplete, onCancel }: ProviderSetupProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateOAuth = async () => {
    // 1. Validate session
    // 2. Check environment variables
    // 3. Create OAuth URL with state
    // 4. Redirect to provider
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      {/* Service benefits */}
      {/* Action buttons */}
    </Card>
  );
}
```

#### **2.2 Callback Page**
**File**: `src/pages/integrations/ProviderCallbackPage.tsx`

```typescript
const ProviderCallbackPage: React.FC = () => {
  const handleCallback = async () => {
    // 1. Parse OAuth parameters
    // 2. Validate state parameter
    // 3. Exchange code for tokens via edge function
    // 4. Store integration data
    // 5. Redirect to integrations page
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Loading, success, error states */}
    </div>
  );
};
```

#### **2.3 Utility Functions**
**File**: `src/services/integrations/provider/utils.ts`

```typescript
// OAuth URL generation
export function createProviderAuthUrl({
  clientId,
  redirectUri,
  requiredScopes,
  state
}: ProviderAuthUrlParams): string {
  const baseUrl = 'https://provider.com/oauth/authorize';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: requiredScopes.join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  if (state) params.append('state', state);
  return `${baseUrl}?${params.toString()}`;
}

// API endpoints and constants
export const PROVIDER_API = {
  AUTH_URL: 'https://provider.com/oauth/authorize',
  TOKEN_URL: 'https://provider.com/oauth/token',
  USER_INFO: 'https://provider.com/userinfo',
  DATA_ENDPOINT: 'https://api.provider.com/data'
};
```

### **Phase 3: Backend Implementation (Day 3)**

#### **3.1 Token Exchange Edge Function**
**File**: `supabase/functions/provider-exchange-tokens/index.ts`

```typescript
serve(async (req) => {
  // 1. Handle CORS
  // 2. Authenticate request
  // 3. Parse request body
  // 4. Exchange code for tokens
  // 5. Fetch account/property info
  // 6. Return tokens and metadata
});
```

#### **3.2 Data Sync Edge Function**
**File**: `supabase/functions/provider-sync/index.ts`

```typescript
serve(async (req) => {
  // 1. Get user tokens
  // 2. Check token expiration
  // 3. Refresh if needed
  // 4. Fetch provider data
  // 5. Transform and store data
  // 6. Update sync timestamp
});
```

### **Phase 4: Database Integration (Day 4)**

#### **4.1 Integration Storage**
```sql
-- Store in user_integrations table
INSERT INTO user_integrations (
  user_id,
  integration_id,
  integration_name,
  status,
  config,
  last_sync_at
) VALUES (
  'user-uuid',
  'provider-integration-uuid',
  'Provider Name',
  'connected',
  '{"access_token": "...", "refresh_token": "...", "expires_at": "...", "account_info": {...}}',
  NOW()
);
```

#### **4.2 Token Storage**
```sql
-- Store in oauth_tokens table
INSERT INTO oauth_tokens (
  user_id,
  provider,
  access_token,
  refresh_token,
  expires_at,
  scope
) VALUES (
  'user-uuid',
  'provider-name',
  'access_token_here',
  'refresh_token_here',
  '2025-08-11T00:00:00Z',
  'scope1 scope2 scope3'
);
```

### **Phase 5: Testing & Deployment (Day 5)**

#### **5.1 Local Testing**
```bash
# Test OAuth flow
1. Start local development server
2. Navigate to /integrations/provider
3. Click "Connect Provider"
4. Complete OAuth flow
5. Verify callback handling
6. Check database storage

# Test edge functions
supabase functions serve provider-exchange-tokens
supabase functions serve provider-sync
```

#### **5.2 Production Deployment**
```bash
# Deploy edge functions
supabase functions deploy provider-exchange-tokens
supabase functions deploy provider-sync

# Update environment variables
# Test production OAuth flow
```

## 🔧 **Implementation Templates**

### **Template 1: Basic OAuth Integration**
```typescript
// Minimum required files for any OAuth integration
1. ProviderSetup.tsx          // OAuth initiation
2. ProviderCallbackPage.tsx   // OAuth callback handling
3. provider/utils.ts          // OAuth utilities
4. provider-exchange-tokens/  // Token exchange
5. provider-sync/            // Data synchronization
```

### **Template 2: Advanced Integration**
```typescript
// Additional files for complex integrations
6. ProviderService.ts        // Service layer
7. useProviderData.ts        // React hook
8. ProviderDashboard.tsx     // Data display
9. provider-webhooks/        // Webhook handling
```

## 🛡️ **Security Checklist**

### **OAuth Security**
- [ ] **State Parameter**: Include user ID and timestamp
- [ ] **PKCE Flow**: Use for public clients if required
- [ ] **Scope Validation**: Verify requested scopes
- [ ] **Token Storage**: Encrypt sensitive data
- [ ] **Token Refresh**: Handle expiration gracefully

### **Data Security**
- [ ] **RLS Policies**: Implement row-level security
- [ ] **Input Validation**: Validate all OAuth parameters
- [ ] **Error Handling**: Don't expose sensitive information
- [ ] **Rate Limiting**: Implement API rate limits
- [ ] **Audit Logging**: Log all integration events

## 📊 **Monitoring & Analytics**

### **Integration Metrics**
```typescript
// Track these metrics for each integration
const metrics = {
  oauth_success_rate: number,      // % of successful OAuth flows
  token_refresh_rate: number,      // % of tokens refreshed successfully
  data_sync_success: number,       // % of successful data syncs
  user_adoption_rate: number,      // % of users who connect
  error_rate: number,              // % of errors encountered
  avg_sync_duration: number        // Average sync time in seconds
};
```

### **Error Tracking**
```typescript
// Log these events for debugging
const events = [
  'oauth_initiated',
  'oauth_completed',
  'oauth_failed',
  'token_exchanged',
  'token_refreshed',
  'data_synced',
  'sync_failed'
];
```

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] **Environment Variables**: All secrets configured
- [ ] **OAuth App Setup**: Provider app configured
- [ ] **Redirect URIs**: All callback URLs registered
- [ ] **Scopes**: Required permissions verified
- [ ] **Rate Limits**: API limits understood

### **Post-Deployment**
- [ ] **OAuth Flow**: End-to-end testing completed
- [ ] **Data Sync**: Initial sync successful
- [ ] **Error Handling**: Error scenarios tested
- [ ] **User Experience**: Flow is intuitive
- [ ] **Documentation**: Integration documented

## 📈 **Success Metrics**

### **Technical Success**
- ✅ OAuth flow completes successfully
- ✅ Tokens are stored securely
- ✅ Data syncs without errors
- ✅ Error handling works properly
- ✅ Rate limits are respected

### **User Success**
- ✅ Integration setup is intuitive
- ✅ Users can connect successfully
- ✅ Data appears in dashboard
- ✅ Users return to use integration
- ✅ Support tickets are minimal

## 🔄 **Maintenance & Updates**

### **Regular Maintenance**
- [ ] **Token Refresh**: Monitor token expiration
- [ ] **API Changes**: Watch for provider API updates
- [ ] **Error Monitoring**: Track integration errors
- [ ] **Performance**: Monitor sync performance
- [ ] **User Feedback**: Collect user experience data

### **Update Procedures**
```bash
# When provider updates their API
1. Update API endpoints in utils.ts
2. Test OAuth flow with new endpoints
3. Update data transformation logic
4. Deploy updated edge functions
5. Monitor for any issues
```

## 📚 **Examples & References**

### **Working Examples**
- **HubSpot Integration**: `src/components/integrations/HubSpotSetup.tsx`
- **Microsoft Integration**: `src/components/integrations/MicrosoftSetup.tsx`
- **Google Analytics**: `src/components/integrations/GoogleAnalyticsSetup.tsx`
- **Google Workspace**: `src/components/integrations/GoogleWorkspaceSetup.tsx`

### **Edge Function Examples**
- **Token Exchange**: `supabase/functions/hubspot-exchange-tokens/`
- **Data Sync**: `supabase/functions/hubspot-sync/`

## 🎯 **Quick Start Guide**

### **For New Integrations**
1. **Copy Template**: Use existing integration as template
2. **Update Names**: Replace "Provider" with actual service name
3. **Configure OAuth**: Set up OAuth app with provider
4. **Implement APIs**: Add specific API calls
5. **Test & Deploy**: Follow testing checklist
6. **Monitor**: Track success metrics

### **Estimated Timeline**
- **Simple Integration**: 3-5 days
- **Complex Integration**: 7-10 days
- **Enterprise Integration**: 10-15 days

---

**Next Steps**: Use this playbook to build your next integration following the proven Nexus pattern!
