# Google Integration Creation Template

## Template Variables for Google Integrations
```
INTEGRATION_NAME: [REPLACE_WITH_INTEGRATION_NAME] (e.g., google-analytics, google-workspace)
INTEGRATION_DISPLAY_NAME: [REPLACE_WITH_DISPLAY_NAME] (e.g., Google Analytics, Google Workspace)
API_BASE_URL: [REPLACE_WITH_API_BASE_URL] (e.g., https://analyticsdata.googleapis.com)
API_VERSION: [REPLACE_WITH_API_VERSION] (e.g., v1beta, v3)
REQUIRED_SCOPES: [REPLACE_WITH_REQUIRED_SCOPES] (e.g., ["https://www.googleapis.com/auth/analytics.readonly"])
DATA_TYPES: [REPLACE_WITH_DATA_TYPES] (e.g., analytics_data, gmail_emails)
GOOGLE_SERVICE_TYPE: [REPLACE_WITH_SERVICE_TYPE] (e.g., analytics, gmail, calendar, drive)
```

## Generated Files Structure

### 1. Service Class
**File**: `src/services/integrations/{{INTEGRATION_NAME}}/{{INTEGRATION_NAME}}Service.ts`

```typescript
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger';
import { retryFetch } from '@/shared/utils/retry';
import { refreshGoogleToken } from '../google/shared-oauth';

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
      const clientId = import.meta.env.VITE_{{INTEGRATION_NAME.toUpperCase()}}_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_{{INTEGRATION_NAME.toUpperCase()}}_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return this.createErrorResponse('Google OAuth credentials not configured');
      }

      const tokenData = await refreshGoogleToken(refreshToken, clientId, clientSecret);
      
      const { error: updateError } = await this.supabase
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

### 2. Utils File (Using Shared Google OAuth)
**File**: `src/services/integrations/{{INTEGRATION_NAME}}/utils.ts`

```typescript
/**
 * {{INTEGRATION_DISPLAY_NAME}} Integration Utilities
 * Uses shared Google OAuth utilities
 */

import { createGoogleAuthUrl, validateGoogleCallback } from '../google/shared-oauth';

interface {{INTEGRATION_NAME}}AuthUrlParams {
  clientId: string;
  redirectUri: string;
  requiredScopes: string[];
  state?: string;
}

/**
 * Creates {{INTEGRATION_DISPLAY_NAME}} OAuth authorization URL
 * Uses shared Google OAuth utilities
 */
export function create{{INTEGRATION_NAME}}AuthUrl(params: {{INTEGRATION_NAME}}AuthUrlParams): string {
  return createGoogleAuthUrl(params);
}

/**
 * Validates {{INTEGRATION_DISPLAY_NAME}} OAuth callback parameters
 * Uses shared Google OAuth utilities
 */
export function validate{{INTEGRATION_NAME}}Callback(params: URLSearchParams) {
  return validateGoogleCallback(params);
}

/**
 * {{INTEGRATION_DISPLAY_NAME}} specific API endpoints
 */
export const {{INTEGRATION_NAME.toUpperCase()}}_API = {
  // Add {{INTEGRATION_DISPLAY_NAME}} specific endpoints here
  BASE_URL: '{{API_BASE_URL}}',
  VERSION: '{{API_VERSION}}',
  // [DEFINE_SPECIFIC_ENDPOINTS]
};

/**
 * {{INTEGRATION_DISPLAY_NAME}} specific scopes
 */
export const {{INTEGRATION_NAME.toUpperCase()}}_SCOPES = {
  // [DEFINE_SPECIFIC_SCOPES]
  READONLY: '{{REQUIRED_SCOPES}}',
};

/**
 * {{INTEGRATION_DISPLAY_NAME}} data transformation utilities
 */
export function transform{{INTEGRATION_NAME}}Data(data: any) {
  // [IMPLEMENT_DATA_TRANSFORMATION]
  return data;
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

## Required Environment Variables
Add to your `.env` file:
```
{{INTEGRATION_NAME.toUpperCase()}}_CLIENT_ID=your_google_client_id_here
{{INTEGRATION_NAME.toUpperCase()}}_CLIENT_SECRET=your_google_client_secret_here
```

## Google Integration Examples

### Google Analytics Template Variables:
```
INTEGRATION_NAME: google-analytics
INTEGRATION_DISPLAY_NAME: Google Analytics
API_BASE_URL: https://analyticsdata.googleapis.com
API_VERSION: v1beta
REQUIRED_SCOPES: ["https://www.googleapis.com/auth/analytics.readonly"]
DATA_TYPES: analytics_data
GOOGLE_SERVICE_TYPE: analytics
```

### Google Workspace Template Variables:
```
INTEGRATION_NAME: google-workspace
INTEGRATION_DISPLAY_NAME: Google Workspace
API_BASE_URL: https://www.googleapis.com
API_VERSION: v3
REQUIRED_SCOPES: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/calendar.readonly"]
DATA_TYPES: gmail_emails,calendar_events
GOOGLE_SERVICE_TYPE: gmail,calendar
```

## Benefits of This Approach

1. **Shared OAuth Logic**: All Google integrations use the same OAuth flow
2. **Consistent Structure**: Same service pattern across all Google integrations
3. **Easy Extension**: Add new Google services quickly
4. **Maintainable**: Centralized Google OAuth utilities
5. **Template-Driven**: Generate new Google integrations automatically

## Usage Instructions
1. Replace template variables with Google service-specific values
2. Customize the data structure for the specific Google service
3. Update API endpoints for the specific Google service
4. Use shared Google OAuth utilities
5. Test the integration thoroughly
6. Add to Google integrations dashboard

## Validation Checklist
- [ ] All template variables replaced
- [ ] Google OAuth credentials configured
- [ ] API endpoints configured correctly
- [ ] Data transformation implemented
- [ ] Environment variables set
- [ ] Build passes without errors
- [ ] Integration tested end-to-end
