# Integration Creation Template

## Template Variables
```
INTEGRATION_NAME: [REPLACE_WITH_INTEGRATION_NAME]
INTEGRATION_DISPLAY_NAME: [REPLACE_WITH_DISPLAY_NAME]
API_BASE_URL: [REPLACE_WITH_API_BASE_URL]
API_VERSION: [REPLACE_WITH_API_VERSION]
REQUIRED_SCOPES: [REPLACE_WITH_REQUIRED_SCOPES]
DATA_TYPES: [REPLACE_WITH_DATA_TYPES]
```

## Generated Files Structure

### 1. Service Class
**File**: `src/services/integrations/{{INTEGRATION_NAME}}/{{INTEGRATION_NAME}}Service.ts`

```typescript
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger';
import { retryFetch } from '@/shared/utils/retry';

// {{INTEGRATION_DISPLAY_NAME}} data types
export interface {{INTEGRATION_NAME}}Tokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
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

  /**
   * Get valid {{INTEGRATION_DISPLAY_NAME}} tokens for a user
   * Automatically refreshes tokens if they're expired
   */
  async getValidTokens(userId: string): Promise<ServiceResponse<{{INTEGRATION_NAME}}Tokens>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: userIntegration, error: integrationError } = await this.supabase
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
      } catch (error) {
        this.logger.error('Error getting valid {{INTEGRATION_DISPLAY_NAME}} tokens', { error, userId });
        return { data: null, error: 'Failed to get valid tokens' };
      }
    }, `get valid {{INTEGRATION_DISPLAY_NAME}} tokens for user ${userId}`);
  }

  /**
   * Refresh {{INTEGRATION_DISPLAY_NAME}} tokens using the refresh token
   */
  async refreshTokens(userId: string, refreshToken: string): Promise<ServiceResponse<{{INTEGRATION_NAME}}Tokens>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return this.createErrorResponse('No valid session found');
      }

      const response = await retryFetch(`${import.meta.env.VITE_POSTGRES_URL}/functions/v1/{{INTEGRATION_NAME}}_refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return this.createErrorResponse(`Token refresh failed: ${errorData.error || response.statusText}`);
      }

      const tokenData = await response.json();
      
      const { error: updateError } = await this.supabase
        .from('user_integrations')
        .update({
          config: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || refreshToken,
            expires_at: tokenData.expires_at,
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
        expires_at: tokenData.expires_at,
        scope: tokenData.scope,
      });
    } catch (error) {
      return this.handleError(error, 'refresh {{INTEGRATION_DISPLAY_NAME}} tokens');
    }
  }

  /**
   * Check if user has a valid {{INTEGRATION_DISPLAY_NAME}} connection
   */
  async hasValidConnection(userId: string): Promise<ServiceResponse<boolean>> {
    return this.executeDbOperation(async () => {
      try {
        const { data: userIntegration, error } = await this.supabase
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

        const config = userIntegration.config as any;
        if (!config.expires_at) {
          return { data: false, error: null };
        }

        const expiresAt = new Date(config.expires_at);
        const now = new Date();
        const isValid = expiresAt.getTime() > now.getTime() + 300000;

        return { data: isValid, error: null };
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
        const { data: userIntegration, error } = await this.supabase
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
   * Fetch {{INTEGRATION_DISPLAY_NAME}} data
   */
  private async fetch{{INTEGRATION_NAME}}Data(accessToken: string): Promise<{{INTEGRATION_NAME}}Data[]> {
    try {
      const response = await retryFetch(`${this.apiBaseUrl}/{{API_VERSION}}/endpoint`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      this.logger.error('Error fetching {{INTEGRATION_DISPLAY_NAME}} data', { error });
      return [];
    }
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

      const { error } = await this.supabase
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
      const { error } = await this.supabase
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
        const { data: integrationData, error } = await this.supabase
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

### 2. Utils File
**File**: `src/services/integrations/{{INTEGRATION_NAME}}/utils.ts`

```typescript
/**
 * {{INTEGRATION_DISPLAY_NAME}} Integration Utilities
 */

interface {{INTEGRATION_NAME}}AuthUrlParams {
  clientId: string;
  redirectUri: string;
  requiredScopes: string[];
  state?: string;
}

/**
 * Creates {{INTEGRATION_DISPLAY_NAME}} OAuth authorization URL
 */
export function create{{INTEGRATION_NAME}}AuthUrl({
  clientId,
  redirectUri,
  requiredScopes,
  state
}: {{INTEGRATION_NAME}}AuthUrlParams): string {
  const baseUrl = '{{API_BASE_URL}}/oauth/authorize';
  const scopes = requiredScopes.join(' ');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });

  if (state) {
    params.append('state', state);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Validates {{INTEGRATION_DISPLAY_NAME}} OAuth callback parameters
 */
export function validate{{INTEGRATION_NAME}}Callback(params: URLSearchParams): {
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
```

### 3. Index File
**File**: `src/services/integrations/{{INTEGRATION_NAME}}/index.ts`

```typescript
export { {{INTEGRATION_NAME}}Service } from './{{INTEGRATION_NAME}}Service';
export type {
  {{INTEGRATION_NAME}}Tokens,
  {{INTEGRATION_NAME}}Data,
  {{INTEGRATION_NAME}}IntegrationData,
} from './{{INTEGRATION_NAME}}Service';
export { create{{INTEGRATION_NAME}}AuthUrl, validate{{INTEGRATION_NAME}}Callback } from './utils';
```

### 4. UI Component
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

### 5. Update Main Index
**File**: `src/services/integrations/index.ts` (Add to existing file)

```typescript
// Add this line to the existing exports
export { {{INTEGRATION_NAME}}Service } from './{{INTEGRATION_NAME}}';
```

### 6. Edge Function Template
**File**: `supabase/functions/{{INTEGRATION_NAME}}_refresh_token/index.ts`

```typescript
import { createEdgeFunction } from '@/shared/utils/edgeFunction';

export default createEdgeFunction(async (req) => {
  try {
    const { refresh_token } = await req.json();

    if (!refresh_token) {
      return new Response(JSON.stringify({ error: 'Refresh token is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Implement {{INTEGRATION_DISPLAY_NAME}} token refresh logic here
    // This will vary based on the specific OAuth provider
    
    const response = await fetch('{{API_BASE_URL}}/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: Deno.env.get('{{INTEGRATION_NAME}}_CLIENT_ID') || '',
        client_secret: Deno.env.get('{{INTEGRATION_NAME}}_CLIENT_SECRET') || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify({ error: errorData.error || 'Token refresh failed' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tokenData = await response.json();
    
    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      scope: tokenData.scope,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

## Required Environment Variables
Add to your `.env` file:
```
{{INTEGRATION_NAME}}_CLIENT_ID=your_client_id_here
{{INTEGRATION_NAME}}_CLIENT_SECRET=your_client_secret_here
```

## Required Database Setup
Ensure the following tables exist:
- `user_integrations` - for storing integration connections
- `integration_data` - for storing synced data

## Usage Instructions
1. Replace all template variables ({{VARIABLE_NAME}}) with actual values
2. Customize the data structure in {{INTEGRATION_NAME}}Data interface
3. Update the API endpoint in fetch{{INTEGRATION_NAME}}Data method
4. Implement the specific OAuth flow for your integration
5. Test the integration thoroughly
6. Add the component to your integration dashboard

## Validation Checklist
- [ ] All template variables replaced
- [ ] API endpoints configured correctly
- [ ] OAuth flow implemented
- [ ] Environment variables set
- [ ] Database tables exist
- [ ] Build passes without errors
- [ ] Integration tested end-to-end
