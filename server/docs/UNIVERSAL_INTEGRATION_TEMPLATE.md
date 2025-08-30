# Universal Integration Creation Template

## Minimum Requirements for Standardization

### **OAuth 2.0 Providers**
- ✅ OAuth 2.0 Authorization Code Flow
- ✅ Refresh Token Support
- ✅ Standard OAuth endpoints (auth, token, userinfo)
- ✅ JSON response format
- ✅ Standard error responses

### **API Services**
- ✅ RESTful API with JSON responses
- ✅ Bearer token authentication
- ✅ Standard HTTP status codes
- ✅ Pagination support (optional but preferred)
- ✅ Rate limiting headers

### **Data Requirements**
- ✅ Unique resource identifiers
- ✅ Timestamp fields (created_at, updated_at)
- ✅ Consistent data structure
- ✅ Error handling patterns

---

## Template Variables for Any Integration

```
INTEGRATION_NAME: [REPLACE_WITH_INTEGRATION_NAME] (e.g., slack, stripe, github)
INTEGRATION_DISPLAY_NAME: [REPLACE_WITH_DISPLAY_NAME] (e.g., Slack, Stripe, GitHub)
PROVIDER_TYPE: [REPLACE_WITH_PROVIDER_TYPE] (e.g., oauth2, api_key, custom)
API_BASE_URL: [REPLACE_WITH_API_BASE_URL] (e.g., https://api.slack.com)
API_VERSION: [REPLACE_WITH_API_VERSION] (e.g., v1, v2, 2020-08-27)
AUTH_TYPE: [REPLACE_WITH_AUTH_TYPE] (e.g., oauth2, bearer, api_key)
OAUTH_ENDPOINTS: [REPLACE_WITH_OAUTH_ENDPOINTS] (e.g., {"auth": "...", "token": "...", "userinfo": "..."})
REQUIRED_SCOPES: [REPLACE_WITH_REQUIRED_SCOPES] (e.g., ["channels:read", "users:read"])
DATA_TYPES: [REPLACE_WITH_DATA_TYPES] (e.g., channels,users,messages)
API_ENDPOINTS: [REPLACE_WITH_API_ENDPOINTS] (e.g., {"users": "/users", "channels": "/channels"})
RATE_LIMIT_HEADERS: [REPLACE_WITH_RATE_LIMIT_HEADERS] (e.g., ["X-RateLimit-Remaining", "X-RateLimit-Reset"])
PAGINATION_TYPE: [REPLACE_WITH_PAGINATION_TYPE] (e.g., cursor, offset, page)
```

---

## Generated Files Structure

### 1. Service Class
**File**: `src/services/integrations/{{INTEGRATION_NAME}}/{{INTEGRATION_NAME}}Service.ts`

```typescript
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { logger } from '@/shared/utils/logger';
import { retryFetch } from '@/shared/utils/retry';
{{#if (eq AUTH_TYPE "oauth2")}}
import { refreshOAuthToken } from '../shared/oauth-utils';
{{/if}}

// {{INTEGRATION_DISPLAY_NAME}} data types
export interface {{INTEGRATION_NAME}}Tokens {
  access_token: string;
  {{#if (eq AUTH_TYPE "oauth2")}}
  refresh_token: string;
  expires_at: string;
  {{/if}}
  scope: string;
}

export interface {{INTEGRATION_NAME}}Data {
  id: string;
  // [DEFINE_SPECIFIC_DATA_STRUCTURE]
  created_at: string;
  updated_at: string;
}

export interface {{INTEGRATION_NAME}}IntegrationData {
  data: {{INTEGRATION_NAME}}Data[];
  lastSync: string;
}

export class {{INTEGRATION_NAME}}Service extends BaseService {
  private readonly apiBaseUrl = '{{API_BASE_URL}}';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;
  {{#if (eq AUTH_TYPE "oauth2")}}
  private readonly oauthEndpoints = {{OAUTH_ENDPOINTS}};
  {{/if}}

  /**
   * Get valid {{INTEGRATION_DISPLAY_NAME}} tokens for a user
   * {{#if (eq AUTH_TYPE "oauth2")}}Automatically refreshes tokens if they're expired{{/if}}
   */
  async getValidTokens(userId: string): Promise<ServiceResponse<{{INTEGRATION_NAME}}Tokens>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: userIntegration, error: integrationError } = await this.database
          .from('user_integrations')
          .select('config, status')
          .eq('user_id', userId)
          .eq('integration_name', '{{INTEGRATION_DISPLAY_NAME}}')
          .single();

        if (integrationError || !userIntegration) {
          return { data: null, error: '{{INTEGRATION_DISPLAY_NAME}} integration not found' };
        }

        if (userIntegration.status !== 'connected') {
          return { data: null, error: '{{INTEGRATION_DISPLAY_NAME}} integration is not connected' };
        }

        const config = userIntegration.config as any;
        
        {{#if (eq AUTH_TYPE "oauth2")}}
        const expiresAt = new Date(config.expires_at);
        const now = new Date();

        if (expiresAt.getTime() > now.getTime() + 300000) {
          return {
            data: {
              access_token: config.access_token,
              refresh_token: config.refresh_token,
              expires_at: config.expires_at,
              scope: config.scope,
            },
            error: null
          };
        }

        this.logger.info('{{INTEGRATION_DISPLAY_NAME}} token expired, refreshing...', { userId, expiresAt });
        
        const refreshResult = await this.refreshTokens(userId, config.refresh_token);
        
        if (!refreshResult.success) {
          return { data: null, error: refreshResult.error || 'Failed to refresh tokens' };
        }

        return { data: refreshResult.data!, error: null };
        {{else}}
        return {
          data: {
            access_token: config.access_token,
            scope: config.scope,
          },
          error: null
        };
        {{/if}}
      } catch (error) {
        this.logger.error('Error getting valid {{INTEGRATION_DISPLAY_NAME}} tokens', { error, userId });
        return { data: null, error: 'Failed to get valid tokens' };
      }
    }, `get valid {{INTEGRATION_DISPLAY_NAME}} tokens for user ${userId}`);
  }

  {{#if (eq AUTH_TYPE "oauth2")}}
  /**
   * Refresh {{INTEGRATION_DISPLAY_NAME}} tokens using the refresh token
   */
  async refreshTokens(userId: string, refreshToken: string): Promise<ServiceResponse<{{INTEGRATION_NAME}}Tokens>> {
    try {
      const clientId = import.meta.env.VITE_{{INTEGRATION_NAME.toUpperCase()}}_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_{{INTEGRATION_NAME.toUpperCase()}}_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return this.createErrorResponse('{{INTEGRATION_DISPLAY_NAME}} OAuth credentials not configured');
      }

      const tokenData = await refreshOAuthToken(
        refreshToken, 
        clientId, 
        clientSecret, 
        this.oauthEndpoints.token
      );
      
              const { error: updateError } = await this.database
        .from('user_integrations')
        .update({
          config: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || refreshToken,
            expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            scope: tokenData.scope,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('integration_name', '{{INTEGRATION_DISPLAY_NAME}}');

      if (updateError) {
        this.logger.error('Failed to update refreshed tokens', { error: updateError, userId });
        return this.createErrorResponse('Failed to update refreshed tokens');
      }

      return this.createSuccessResponse({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        scope: tokenData.scope,
      });
    } catch (error) {
      return this.handleError(error, 'refresh {{INTEGRATION_DISPLAY_NAME}} tokens');
    }
  }
  {{/if}}

  /**
   * Check if user has a valid {{INTEGRATION_DISPLAY_NAME}} connection
   */
  async hasValidConnection(userId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: userIntegration, error } = await this.database
          .from('user_integrations')
          .select('status, config')
          .eq('user_id', userId)
          .eq('integration_name', '{{INTEGRATION_DISPLAY_NAME}}')
          .single();

        if (error || !userIntegration) {
          return { data: false, error: null };
        }

        if (userIntegration.status !== 'connected') {
          return { data: false, error: null };
        }

        {{#if (eq AUTH_TYPE "oauth2")}}
        const config = userIntegration.config as any;
        if (!config.expires_at) {
          return { data: false, error: null };
        }

        const expiresAt = new Date(config.expires_at);
        const now = new Date();
        const isValid = expiresAt.getTime() > now.getTime() + 300000;

        return { data: isValid, error: null };
        {{else}}
        return { data: true, error: null };
        {{/if}}
      } catch (error) {
        this.logger.error('Error checking {{INTEGRATION_DISPLAY_NAME}} connection', { error, userId });
        return { data: false, error: null };
      }
    }, `check {{INTEGRATION_DISPLAY_NAME}} connection for user ${userId}`);
  }

  /**
   * Get connection status for {{INTEGRATION_DISPLAY_NAME}} integration
   */
  async getConnectionStatus(userId: string): Promise<ServiceResponse<{
    connected: boolean;
    status: string;
    lastSync?: string;
    expiresAt?: string;
  }>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: userIntegration, error } = await this.database
          .from('user_integrations')
          .select('status, config, last_sync')
          .eq('user_id', userId)
          .eq('integration_name', '{{INTEGRATION_DISPLAY_NAME}}')
          .single();

        if (error || !userIntegration) {
          return {
            data: {
              connected: false,
              status: 'not_connected',
            },
            error: null
          };
        }

        {{#if (eq AUTH_TYPE "oauth2")}}
        const config = userIntegration.config as any;
        const expiresAt = config?.expires_at ? new Date(config.expires_at) : null;
        const now = new Date();
        const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() + 300000 : true;

        return {
          data: {
            connected: userIntegration.status === 'connected' && !isExpired,
            status: userIntegration.status,
            lastSync: userIntegration.last_sync,
            expiresAt: config?.expires_at,
          },
          error: null
        };
        {{else}}
        return {
          data: {
            connected: userIntegration.status === 'connected',
            status: userIntegration.status,
            lastSync: userIntegration.last_sync,
          },
          error: null
        };
        {{/if}}
      } catch (error) {
        this.logger.error('Error getting {{INTEGRATION_DISPLAY_NAME}} connection status', { error, userId });
        return { data: null, error: 'Failed to get connection status' };
      }
    }, `get {{INTEGRATION_DISPLAY_NAME}} connection status for user ${userId}`);
  }

  /**
   * Sync {{INTEGRATION_DISPLAY_NAME}} data with intelligence
   */
  async sync{{INTEGRATION_NAME}}DataWithIntelligence(userId: string): Promise<ServiceResponse<{
    dataSynced: number;
    lastSync: string;
  }>> {
    try {
      const tokenResult = await this.getValidTokens(userId);
      if (!tokenResult.success || !tokenResult.data) {
        return this.createErrorResponse('Failed to get valid access token');
      }

      const accessToken = tokenResult.data.access_token;
      const data = await this.fetch{{INTEGRATION_NAME}}Data(accessToken);
      const dataSynced = await this.store{{INTEGRATION_NAME}}Data(data, userId);

      await this.updateIntegrationStatus(userId, {
        last_sync: new Date().toISOString(),
        status: 'connected',
      });

      const lastSync = new Date().toISOString();

      this.logger.info('{{INTEGRATION_DISPLAY_NAME}} data sync completed', {
        userId,
        dataSynced,
        lastSync,
      });

      return this.createSuccessResponse({
        dataSynced,
        lastSync,
      });
    } catch (error) {
      return this.handleError(error, 'sync {{INTEGRATION_DISPLAY_NAME}} data');
    }
  }

  /**
   * Fetch {{INTEGRATION_DISPLAY_NAME}} data with pagination support
   */
  private async fetch{{INTEGRATION_NAME}}Data(accessToken: string): Promise<{{INTEGRATION_NAME}}Data[]> {
    try {
      const allData: {{INTEGRATION_NAME}}Data[] = [];
      let hasMore = true;
      let cursor: string | null = null;
      let page = 1;

      while (hasMore) {
        const endpoint = this.buildApiEndpoint(cursor, page);
        const response = await retryFetch(endpoint, {
          headers: {
            'Authorization': `{{#if (eq AUTH_TYPE "oauth2")}}Bearer {{/if}}{{#if (eq AUTH_TYPE "api_key")}}{{INTEGRATION_NAME.toUpperCase()}}_API_KEY {{/if}}${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        const items = data.items || data.data || data.results || [];
        
        allData.push(...items);

        // Handle pagination
        {{#if (eq PAGINATION_TYPE "cursor")}}
        cursor = data.next_cursor || data.cursor || null;
        hasMore = !!cursor;
        {{else if (eq PAGINATION_TYPE "offset")}}
        page++;
        hasMore = items.length > 0 && page <= 10; // Limit to 10 pages
        {{else if (eq PAGINATION_TYPE "page")}}
        page++;
        hasMore = data.has_more || items.length > 0;
        {{else}}
        hasMore = false; // No pagination
        {{/if}}

        // Rate limiting
        {{#if RATE_LIMIT_HEADERS}}
        const remaining = response.headers.get('{{RATE_LIMIT_HEADERS.[0]}}');
        if (remaining && parseInt(remaining) <= 1) {
          const resetTime = response.headers.get('{{RATE_LIMIT_HEADERS.[1]}}');
          if (resetTime) {
            const waitTime = parseInt(resetTime) * 1000 - Date.now();
            if (waitTime > 0) {
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        {{/if}}
      }

      return allData;
    } catch (error) {
      this.logger.error('Error fetching {{INTEGRATION_DISPLAY_NAME}} data', { error });
      return [];
    }
  }

  /**
   * Build API endpoint with pagination parameters
   */
  private buildApiEndpoint(cursor?: string | null, page?: number): string {
    const baseEndpoint = `${this.apiBaseUrl}/{{API_VERSION}}/{{API_ENDPOINTS.[0]}}`;
    const params = new URLSearchParams();

    {{#if (eq PAGINATION_TYPE "cursor")}}
    if (cursor) {
      params.append('cursor', cursor);
    }
    {{else if (eq PAGINATION_TYPE "offset")}}
    if (page) {
      params.append('offset', (page * 100).toString());
      params.append('limit', '100');
    }
    {{else if (eq PAGINATION_TYPE "page")}}
    if (page) {
      params.append('page', page.toString());
      params.append('per_page', '100');
    }
    {{/if}}

    const queryString = params.toString();
    return queryString ? `${baseEndpoint}?${queryString}` : baseEndpoint;
  }

  /**
   * Store {{INTEGRATION_DISPLAY_NAME}} data in database
   */
  private async store{{INTEGRATION_NAME}}Data(data: {{INTEGRATION_NAME}}Data[], userId: string): Promise<number> {
    try {
      const dataToStore = data.map(item => ({
        user_id: userId,
        integration_name: '{{INTEGRATION_DISPLAY_NAME}}',
        data_type: '{{DATA_TYPES}}',
        external_id: item.id,
        data: item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error } = await this.database
        .from('integration_data')
        .upsert(dataToStore, { onConflict: 'user_id,integration_name,data_type,external_id' });

      if (error) {
        this.logger.error('Error storing {{INTEGRATION_DISPLAY_NAME}} data', { error });
        return 0;
      }

      return data.length;
    } catch (error) {
      this.logger.error('Error storing {{INTEGRATION_DISPLAY_NAME}} data', { error });
      return 0;
    }
  }

  /**
   * Update integration status
   */
  private async updateIntegrationStatus(userId: string, status: any): Promise<void> {
    try {
      const { error } = await this.database
        .from('user_integrations')
        .update({
          status: status.status,
          last_sync: status.last_sync,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('integration_name', '{{INTEGRATION_DISPLAY_NAME}}');

      if (error) {
        this.logger.error('Error updating {{INTEGRATION_DISPLAY_NAME}} integration status', { error });
      }
    } catch (error) {
      this.logger.error('Error updating {{INTEGRATION_DISPLAY_NAME}} integration status', { error });
    }
  }

  /**
   * Get {{INTEGRATION_DISPLAY_NAME}} integration data
   */
  async get{{INTEGRATION_NAME}}Data(userId: string): Promise<ServiceResponse<{{INTEGRATION_NAME}}IntegrationData>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: integrationData, error } = await this.database
          .from('integration_data')
          .select('*')
          .eq('user_id', userId)
          .eq('integration_name', '{{INTEGRATION_DISPLAY_NAME}}');

        if (error) {
          return { data: null, error: 'Failed to fetch integration data' };
        }

        const data = integrationData
          .filter(item => item.data_type === '{{DATA_TYPES}}')
          .map(item => item.data as {{INTEGRATION_NAME}}Data);

        const lastSync = integrationData.length > 0 
          ? Math.max(...integrationData.map(item => new Date(item.updated_at).getTime()))
          : new Date().toISOString();

        return {
          data: {
            data,
            lastSync: new Date(lastSync).toISOString(),
          },
          error: null
        };
      } catch (error) {
        this.logger.error('Error getting {{INTEGRATION_DISPLAY_NAME}} data', { error, userId });
        return { data: null, error: 'Failed to get integration data' };
      }
    }, `get {{INTEGRATION_DISPLAY_NAME}} data for user ${userId}`);
  }
}
```

### 2. Utils File (Universal OAuth/API Support)
**File**: `src/services/integrations/{{INTEGRATION_NAME}}/utils.ts`

```typescript
/**
 * {{INTEGRATION_DISPLAY_NAME}} Integration Utilities
 * Universal OAuth and API utilities
 */

{{#if (eq AUTH_TYPE "oauth2")}}
import { createOAuthUrl, validateOAuthCallback } from '../shared/oauth-utils';

interface {{INTEGRATION_NAME}}AuthUrlParams {
  clientId: string;
  redirectUri: string;
  requiredScopes: string[];
  state?: string;
}

/**
 * Creates {{INTEGRATION_DISPLAY_NAME}} OAuth authorization URL
 */
export function create{{INTEGRATION_NAME}}AuthUrl(params: {{INTEGRATION_NAME}}AuthUrlParams): string {
  return createOAuthUrl({
    ...params,
    authEndpoint: '{{OAUTH_ENDPOINTS.auth}}',
    responseType: 'code',
    accessType: 'offline',
    prompt: 'consent'
  });
}

/**
 * Validates {{INTEGRATION_DISPLAY_NAME}} OAuth callback parameters
 */
export function validate{{INTEGRATION_NAME}}Callback(params: URLSearchParams) {
  return validateOAuthCallback(params);
}
{{/if}}

/**
 * {{INTEGRATION_DISPLAY_NAME}} specific API endpoints
 */
export const {{INTEGRATION_NAME.toUpperCase()}}_API = {
  BASE_URL: '{{API_BASE_URL}}',
  VERSION: '{{API_VERSION}}',
  ENDPOINTS: {{API_ENDPOINTS}},
  {{#if RATE_LIMIT_HEADERS}}
  RATE_LIMIT_HEADERS: {{RATE_LIMIT_HEADERS}},
  {{/if}}
  {{#if PAGINATION_TYPE}}
  PAGINATION_TYPE: '{{PAGINATION_TYPE}}',
  {{/if}}
};

{{#if (eq AUTH_TYPE "oauth2")}}
/**
 * {{INTEGRATION_DISPLAY_NAME}} specific scopes
 */
export const {{INTEGRATION_NAME.toUpperCase()}}_SCOPES = {
  {{#each REQUIRED_SCOPES}}
  {{@key}}: '{{this}}',
  {{/each}}
};
{{/if}}

/**
 * {{INTEGRATION_DISPLAY_NAME}} data transformation utilities
 */
export function transform{{INTEGRATION_NAME}}Data(data: any) {
  // [IMPLEMENT_DATA_TRANSFORMATION]
  return data;
}

/**
 * Validate {{INTEGRATION_DISPLAY_NAME}} API response
 */
export function validate{{INTEGRATION_NAME}}Response(response: Response): boolean {
  return response.ok && response.headers.get('content-type')?.includes('application/json');
}
```

### 3. Shared OAuth Utilities
**File**: `src/services/integrations/shared/oauth-utils.ts`

```typescript
/**
 * Universal OAuth Utilities
 * Works with any OAuth 2.0 provider
 */

interface OAuthUrlParams {
  clientId: string;
  redirectUri: string;
  requiredScopes: string[];
  state?: string;
  authEndpoint: string;
  responseType?: string;
  accessType?: string;
  prompt?: string;
}

/**
 * Creates OAuth authorization URL for any provider
 */
export function createOAuthUrl({
  clientId,
  redirectUri,
  requiredScopes,
  state,
  authEndpoint,
  responseType = 'code',
  accessType = 'offline',
  prompt = 'consent'
}: OAuthUrlParams): string {
  const scopes = requiredScopes.join(' ');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: responseType,
    access_type: accessType,
    prompt: prompt
  });

  if (state) {
    params.append('state', state);
  }

  return `${authEndpoint}?${params.toString()}`;
}

/**
 * Validates OAuth callback parameters for any provider
 */
export function validateOAuthCallback(params: URLSearchParams): {
  success: boolean;
  code?: string;
  state?: string;
  error?: string;
} {
  const error = params.get('error');
  const errorDescription = params.get('error_description');
  
  if (error) {
    return {
      success: false,
      error: errorDescription || error
    };
  }

  const code = params.get('code');
  const state = params.get('state');

  if (!code) {
    return {
      success: false,
      error: 'Authorization code not found in callback'
    };
  }

  return {
    success: true,
    code,
    state
  };
}

/**
 * Universal OAuth token refresh
 */
export async function refreshOAuthToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  tokenEndpoint: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Token refresh failed');
  }

  return response.json();
}
```

### 4. Index File
**File**: `src/services/integrations/{{INTEGRATION_NAME}}/index.ts`

```typescript
export { {{INTEGRATION_NAME}}Service } from './{{INTEGRATION_NAME}}Service';
export type {
  {{INTEGRATION_NAME}}Tokens,
  {{INTEGRATION_NAME}}Data,
  {{INTEGRATION_NAME}}IntegrationData,
} from './{{INTEGRATION_NAME}}Service';
{{#if (eq AUTH_TYPE "oauth2")}}
export { create{{INTEGRATION_NAME}}AuthUrl, validate{{INTEGRATION_NAME}}Callback } from './utils';
{{/if}}
export { {{INTEGRATION_NAME.toUpperCase()}}_API } from './utils';
```

### 5. UI Component
**File**: `src/components/integrations/{{INTEGRATION_NAME}}Insights.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { {{INTEGRATION_NAME}}Service, type {{INTEGRATION_NAME}}IntegrationData } from '@/services/integrations/{{INTEGRATION_NAME}}';

export function {{INTEGRATION_NAME}}Insights() {
  const { user } = useAuth();
  const [data, setData] = useState<{{INTEGRATION_NAME}}IntegrationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  const {{INTEGRATION_NAME}}Service = new {{INTEGRATION_NAME}}Service();

  useEffect(() => {
    if (user?.id) {
      load{{INTEGRATION_NAME}}Data();
    }
  }, [user?.id]);

  const load{{INTEGRATION_NAME}}Data = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await {{INTEGRATION_NAME}}Service.get{{INTEGRATION_NAME}}Data(user.id);
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load {{INTEGRATION_DISPLAY_NAME}} data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading {{INTEGRATION_DISPLAY_NAME}} data:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    setSyncProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const result = await {{INTEGRATION_NAME}}Service.sync{{INTEGRATION_NAME}}DataWithIntelligence(user.id);
      
      clearInterval(progressInterval);
      setSyncProgress(100);

      if (result.success && result.data) {
        await load{{INTEGRATION_NAME}}Data();
      } else {
        setError(result.error || 'Failed to sync {{INTEGRATION_DISPLAY_NAME}} data');
      }
    } catch (err) {
      setError('An unexpected error occurred during sync');
      console.error('Error syncing {{INTEGRATION_DISPLAY_NAME}} data:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setSyncProgress(0), 1000);
    }
  };

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{{INTEGRATION_DISPLAY_NAME}} Insights</CardTitle>
          <CardDescription>Loading your {{INTEGRATION_DISPLAY_NAME}} data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={syncProgress} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{{INTEGRATION_DISPLAY_NAME}} Insights</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={load{{INTEGRATION_NAME}}Data} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{{INTEGRATION_DISPLAY_NAME}} Insights</CardTitle>
            <CardDescription>
              Your {{INTEGRATION_DISPLAY_NAME}} integration data and analytics
              {data?.lastSync && (
                <span className="block text-sm text-muted-foreground mt-1">
                  Last synced: {new Date(data.lastSync).toLocaleString()}
                </span>
              )}
            </CardDescription>
          </div>
          <Button 
            onClick={syncData} 
            disabled={loading}
            className="ml-4"
          >
            {loading ? 'Syncing...' : 'Sync Data'}
          </Button>
        </div>
        {loading && syncProgress > 0 && (
          <Progress value={syncProgress} className="w-full mt-4" />
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{data?.data.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {data?.data.length > 0 ? 'Connected' : 'Not Connected'}
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              {data?.data.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Item {item.id}</div>
                    <div className="text-sm text-muted-foreground">
                      Updated: {new Date(item.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="space-y-4">
              {data?.data.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Item {item.id}</div>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">Data</Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

---

## Integration Examples

### **Slack Integration**
```
INTEGRATION_NAME: slack
INTEGRATION_DISPLAY_NAME: Slack
PROVIDER_TYPE: oauth2
API_BASE_URL: https://slack.com/api
API_VERSION: v1
AUTH_TYPE: oauth2
OAUTH_ENDPOINTS: {"auth": "https://slack.com/oauth/v2/authorize", "token": "https://slack.com/api/oauth.v2.access", "userinfo": "https://slack.com/api/users.info"}
REQUIRED_SCOPES: ["channels:read", "users:read", "chat:write"]
DATA_TYPES: channels,users,messages
API_ENDPOINTS: {"channels": "/conversations.list", "users": "/users.list", "messages": "/conversations.history"}
RATE_LIMIT_HEADERS: ["X-RateLimit-Remaining", "X-RateLimit-Reset"]
PAGINATION_TYPE: cursor
```

### **Stripe Integration**
```
INTEGRATION_NAME: stripe
INTEGRATION_DISPLAY_NAME: Stripe
PROVIDER_TYPE: api_key
API_BASE_URL: https://api.stripe.com
API_VERSION: 2020-08-27
AUTH_TYPE: api_key
REQUIRED_SCOPES: []
DATA_TYPES: payments,customers,subscriptions
API_ENDPOINTS: {"payments": "/v1/payment_intents", "customers": "/v1/customers", "subscriptions": "/v1/subscriptions"}
RATE_LIMIT_HEADERS: ["Stripe-RateLimit-Remaining", "Stripe-RateLimit-Reset"]
PAGINATION_TYPE: cursor
```

### **GitHub Integration**
```
INTEGRATION_NAME: github
INTEGRATION_DISPLAY_NAME: GitHub
PROVIDER_TYPE: oauth2
API_BASE_URL: https://api.github.com
API_VERSION: v3
AUTH_TYPE: oauth2
OAUTH_ENDPOINTS: {"auth": "https://github.com/login/oauth/authorize", "token": "https://github.com/login/oauth/access_token", "userinfo": "https://api.github.com/user"}
REQUIRED_SCOPES: ["repo", "user", "read:org"]
DATA_TYPES: repositories,issues,pull_requests
API_ENDPOINTS: {"repos": "/user/repos", "issues": "/repos/{owner}/{repo}/issues", "pulls": "/repos/{owner}/{repo}/pulls"}
RATE_LIMIT_HEADERS: ["X-RateLimit-Remaining", "X-RateLimit-Reset"]
PAGINATION_TYPE: page
```

---

## Required Environment Variables
Add to your `.env` file:
```
{{#if (eq AUTH_TYPE "oauth2")}}
{{INTEGRATION_NAME.toUpperCase()}}_CLIENT_ID=your_client_id_here
{{INTEGRATION_NAME.toUpperCase()}}_CLIENT_SECRET=your_client_secret_here
{{else if (eq AUTH_TYPE "api_key")}}
{{INTEGRATION_NAME.toUpperCase()}}_API_KEY=your_api_key_here
{{/if}}
```

---

## Benefits of Universal Template

1. **Any OAuth Provider**: Works with Slack, GitHub, Discord, etc.
2. **API Key Services**: Works with Stripe, SendGrid, etc.
3. **Flexible Pagination**: Supports cursor, offset, and page-based pagination
4. **Rate Limiting**: Built-in rate limit handling
5. **Standardized Structure**: Consistent across all integrations
6. **Template-Driven**: Generate integrations automatically
7. **API Learning Compatible**: Works with API Learning system

---

## Usage Instructions
1. Replace template variables with service-specific values
2. Customize data structure for the specific service
3. Configure OAuth endpoints or API key authentication
4. Set up pagination and rate limiting
5. Test the integration thoroughly
6. Add to integrations dashboard

---

## Validation Checklist
- [ ] All template variables replaced
- [ ] Authentication configured (OAuth or API key)
- [ ] API endpoints configured correctly
- [ ] Pagination implemented
- [ ] Rate limiting handled
- [ ] Data transformation implemented
- [ ] Environment variables set
- [ ] Build passes without errors
- [ ] Integration tested end-to-end
