# 🔐 Integration Authentication Patterns

## Overview

Nexus supports multiple authentication patterns for integrations, allowing you to connect to any API regardless of their authentication method. This document explains how to implement both **OAuth 2.0** and **API Key** authentication patterns.

## 🎯 Authentication Types

### **1. OAuth 2.0 (Recommended)**
- **Use for**: Google, Microsoft, Slack, PayPal, HubSpot, etc.
- **Flow**: Authorization Code with PKCE
- **Storage**: Encrypted refresh tokens in database
- **Refresh**: Automatic token refresh in service layer

### **2. API Key**
- **Use for**: Simple APIs, internal tools, custom services
- **Validation**: Test connection during setup
- **Storage**: Encrypted API keys in database
- **Security**: Rate limiting and key rotation support

### **3. Basic Auth**
- **Use for**: Legacy systems, simple username/password
- **Storage**: Encrypted credentials in database
- **Security**: HTTPS required, consider migration to OAuth

### **4. Custom Authentication**
- **Use for**: Proprietary systems, unique auth flows
- **Implementation**: Custom validation in service layer
- **Flexibility**: Supports any authentication pattern

## 🏗️ Architecture

### **Unified Authentication Service**
```typescript
// src/domains/integrations/lib/unifiedAuthService.ts
export class UnifiedAuthService implements AuthService, ApiClientFactory, AuthValidation {
  // Handles all authentication types
  async getCredentials(integrationId: string, userId: string): Promise<IntegrationCredentials | null>
  async storeCredentials(integrationId: string, userId: string, credentials: IntegrationCredentials): Promise<void>
  async testConnection(integrationId: string, userId: string): Promise<boolean>
  async refreshTokens(integrationId: string, userId: string): Promise<OAuthCredentials | null>
  async removeCredentials(integrationId: string, userId: string): Promise<void>
}
```

### **Base Integration Class**
```typescript
// src/domains/integrations/lib/baseIntegration.ts
export abstract class BaseIntegration implements NexusIntegration {
  abstract authType: AuthType; // 'oauth' | 'api_key' | 'basic_auth' | 'custom'
  
  // Unified credential management
  protected async getCredentials(userId: string): Promise<IntegrationCredentials | null>
  protected async storeCredentials(userId: string, credentials: IntegrationCredentials): Promise<void>
  protected async testConnection(userId: string): Promise<boolean>
  protected async createApiClient(userId: string, baseUrl: string)
}
```

## 📝 Implementation Patterns

### **OAuth 2.0 Integration Example**

```typescript
export class Microsoft365Integration extends BaseIntegration {
  id = 'microsoft365';
  name = 'Microsoft 365';
  dataFields = ['emails', 'calendar', 'files', 'teams'];
  authType: AuthType = 'oauth';

  private async getAccessToken(userId: string): Promise<string> {
    const token = await OAuthTokenService.getTokens('microsoft365');
    if (!token?.access_token) {
      throw new Error('No valid Microsoft 365 access token found.');
    }
    return token.access_token;
  }

  private async makeMicrosoftRequest<T>(endpoint: string, accessToken: string): Promise<T> {
    const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status}`);
    }

    return await response.json();
  }

  async fetchProviderData({ userId, fullSync = false }): Promise<Record<string, any[]>> {
    const accessToken = await this.getAccessToken(userId);
    
    // Fetch data in parallel
    const [emails, calendar, files, teams] = await Promise.all([
      this.fetchEmails(accessToken, fullSync),
      this.fetchCalendar(accessToken, fullSync),
      this.fetchFiles(accessToken, fullSync),
      this.fetchTeams(accessToken, fullSync)
    ]);

    return { emails, calendar, files, teams };
  }
}
```

### **API Key Integration Example**

```typescript
export class ExampleApiKeyIntegration extends BaseIntegration {
  id = 'example-api-key';
  name = 'Example API Key Integration';
  dataFields = ['items', 'metrics', 'reports'];
  authType: AuthType = 'api_key';

  private async getAccessToken(userId: string): Promise<string> {
    const credentials = await this.getCredentials(userId);
    if (!credentials || credentials.type !== 'api_key') {
      throw new Error('No valid API key found.');
    }
    return credentials.api_key;
  }

  private async makeApiRequest<T>(endpoint: string, apiKey: string, params?: Record<string, any>): Promise<T> {
    const baseUrl = 'https://api.example.com';
    const url = new URL(`${baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': apiKey, // API key in header
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  }

  async fetchProviderData({ userId, fullSync = false }): Promise<Record<string, any[]>> {
    const apiKey = await this.getAccessToken(userId);
    
    // Fetch data in parallel
    const [items, metrics, reports] = await Promise.all([
      this.fetchItems(apiKey, fullSync),
      this.fetchMetrics(apiKey, fullSync),
      this.fetchReports(apiKey, fullSync)
    ]);

    return { items, metrics, reports };
  }

  // Override for API key specific validation
  protected async testConnection(userId: string): Promise<boolean> {
    try {
      const apiKey = await this.getAccessToken(userId);
      const response = await this.makeApiRequest('/v1/health', apiKey);
      return !!response.status;
    } catch (error) {
      return false;
    }
  }
}
```

## 🔧 Setup Components

### **OAuth Setup Component**

```typescript
// src/domains/integrations/components/OAuthSetup.tsx
const OAuthSetup: React.FC<{ integration: Integration }> = ({ integration }) => {
  const handleOAuthConnect = async () => {
    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // Store code verifier for token exchange
    sessionStorage.setItem(`${integration.id}_code_verifier`, codeVerifier);
    
    // Redirect to OAuth authorization URL
    const authUrl = `${integration.authConfig.oauth.auth_url}?` +
      `client_id=${integration.authConfig.oauth.client_id}&` +
      `redirect_uri=${integration.authConfig.oauth.redirect_uri}&` +
      `response_type=code&` +
      `scope=${integration.authConfig.oauth.scope}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`;
    
    window.location.href = authUrl;
  };

  return (
    <Button onClick={handleOAuthConnect}>
      Connect with {integration.name}
    </Button>
  );
};
```

### **API Key Setup Component**

```typescript
// src/domains/integrations/components/ApiKeySetup.tsx
const ApiKeySetup: React.FC<{ integration: Integration }> = ({ integration }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleApiKeyTest = async () => {
    setIsValidating(true);
    try {
      const isValid = await unifiedAuthService.validateApiKey(
        apiKey,
        integration.authConfig.api_key.validation_endpoint,
        integration.authConfig.api_key.key_name,
        integration.authConfig.api_key.key_location
      );

      if (isValid) {
        // Store API key credentials
        await unifiedAuthService.storeCredentials(integration.id, userId, {
          type: 'api_key',
          api_key: apiKey,
          key_name: integration.authConfig.api_key.key_name,
          key_location: integration.authConfig.api_key.key_location
        });

        toast.success('API key validated and stored successfully!');
      } else {
        toast.error('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      toast.error('Failed to validate API key.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>API Key</Label>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
        />
      </div>
      <Button onClick={handleApiKeyTest} disabled={isValidating}>
        {isValidating ? 'Validating...' : 'Test & Save API Key'}
      </Button>
    </div>
  );
};
```

## 🗄️ Database Schema

### **User Integrations Table**
```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id TEXT NOT NULL,
  integration_name TEXT NOT NULL,
  integration_type TEXT NOT NULL, -- 'oauth', 'api_key', 'basic_auth', 'custom'
  credentials JSONB, -- Encrypted credentials
  config JSONB, -- Non-sensitive configuration
  status TEXT DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, integration_id)
);
```

### **Integrations Table**
```sql
CREATE TABLE integrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  auth_type TEXT NOT NULL, -- 'oauth', 'api_key', 'basic_auth', 'custom'
  auth_config JSONB, -- OAuth URLs, API key validation endpoints, etc.
  capabilities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔒 Security Considerations

### **Credential Storage**
- All credentials are encrypted before storage
- API keys are never logged or exposed in client-side code
- OAuth refresh tokens are stored securely with encryption

### **Token Refresh**
- OAuth tokens are automatically refreshed when expired
- Failed refresh attempts trigger re-authentication
- Token refresh happens server-side for security

### **API Key Validation**
- API keys are validated during setup
- Invalid keys are rejected immediately
- Rate limiting prevents brute force attacks

### **Error Handling**
- Authentication errors are logged securely
- User-friendly error messages don't expose sensitive data
- Failed connections trigger appropriate retry logic

## 🚀 Best Practices

### **For OAuth Integrations**
1. **Use PKCE** for public clients (SPAs)
2. **Store refresh tokens** securely
3. **Implement automatic token refresh**
4. **Handle token expiration gracefully**
5. **Log authentication events** for security

### **For API Key Integrations**
1. **Validate keys** during setup
2. **Use HTTPS** for all API calls
3. **Implement rate limiting**
4. **Rotate keys** regularly
5. **Monitor usage** for anomalies

### **For All Integrations**
1. **Test connections** before storing credentials
2. **Handle network errors** gracefully
3. **Implement retry logic** with exponential backoff
4. **Log integration events** for debugging
5. **Provide clear error messages** to users

## 📊 Integration Status

### **Current OAuth Integrations**
- ✅ Microsoft 365 (Teams, Outlook, OneDrive, SharePoint)
- ✅ PayPal (Transactions, Payouts, Balance)
- ✅ Google Analytics (Reports, Real-time Data)
- ✅ Slack (Messages, Channels, Users)
- ✅ HubSpot (Contacts, Companies, Deals)

### **Current API Key Integrations**
- 🔄 Example API Key Integration (Template)

### **Planned Integrations**
- 🔄 Google Workspace (Gmail, Calendar, Drive)
- 🔄 GitHub (Repositories, Issues, Pull Requests)
- 🔄 Zendesk (Tickets, Users, Organizations)
- 🔄 Notion (Pages, Databases, Blocks)

## 🎯 Next Steps

1. **Implement Google Workspace** using OAuth 2.0
2. **Add GitHub integration** using OAuth 2.0
3. **Create more API key integrations** for custom services
4. **Enhance security** with additional validation
5. **Add monitoring** for integration health

This unified authentication system provides a flexible, secure foundation for connecting to any API while maintaining consistent patterns across all integrations. 