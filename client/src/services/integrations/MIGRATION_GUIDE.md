# Integration Services Consolidation Guide

## 🎯 Overview

This guide explains the consolidation of multiple integration services into a single, well-organized service to reduce confusion and improve maintainability.

## 📋 What Was Consolidated

### Before Consolidation (Multiple Services)
- `integrationService.ts` - User integrations management
- `integrationDataService.ts` - Data analytics and insights
- `universalIntegrationService.ts` - Platform integrations
- `apiIntegrationService.ts` - API integration
- `dataPointMappingService.ts` - Data point mapping

### After Consolidation (Single Service)
- `consolidatedIntegrationService.ts` - All integration functionality in one place

## 🔄 Migration Steps

### 1. Update Imports

**Before:**
```typescript
import { integrationService } from '@/services/integrations/integrationService';
import { integrationDataService } from '@/services/integrations/integrationDataService';
import { ApiIntegrationService } from '@/shared/services/apiIntegrationService';
```

**After:**
```typescript
import { consolidatedIntegrationService } from '@/services/integrations/consolidatedIntegrationService';
```

### 2. Update Service Calls

**Before:**
```typescript
// User integrations
const userIntegrations = await integrationService.getUserIntegrations(userId);

// Data analytics
const analytics = await integrationDataService.getUserDataPointAnalytics(userId);

// API integration
const apiData = await ApiIntegrationService.analyzeApiDoc(apiDoc);
```

**After:**
```typescript
// All functionality through consolidated service
const { data: userIntegrations, error } = await consolidatedIntegrationService.getUserIntegrations(userId);
const { data: analytics, error } = await consolidatedIntegrationService.getUserDataPointAnalytics(userId);
const { data: apiData, error } = await consolidatedIntegrationService.analyzeApiDoc(apiDoc);
```

### 3. Handle ServiceResponse Format

All methods now return a `ServiceResponse<T>` format:

```typescript
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}
```

**Example:**
```typescript
const { data: integrations, error } = await consolidatedIntegrationService.getUserIntegrations(userId);

if (error) {
  // Handle error
  console.error('Failed to get integrations:', error);
  return;
}

// Use data
setIntegrations(integrations || []);
```

## 🏗️ Service Architecture

### Main Service Class
```typescript
export class ConsolidatedIntegrationService extends BaseService {
  // Authentication & Validation
  private async validateAuth(): Promise<{ userId: string; error?: string }>

  // User Integration Management
  async getUserIntegrations(userId?: string): Promise<ServiceResponse<UserIntegration[]>>
  async getAvailablePlatforms(): Promise<ServiceResponse<IntegrationPlatform[]>>
  async connectIntegration(userId: string, platform: string, credentials: any): Promise<ServiceResponse<ConnectionResult>>
  async disconnectIntegration(userId: string, platform: string): Promise<ServiceResponse<ConnectionResult>>
  async syncIntegration(userId: string, platform: string): Promise<ServiceResponse<SyncResult>>

  // Data Analytics & Insights
  async getUserDataPointAnalytics(userId?: string): Promise<ServiceResponse<DataPointAnalytics>>
  async getUserIntegrationDataSummaries(userId?: string): Promise<ServiceResponse<IntegrationDataSummary[]>>

  // API Integration
  async analyzeApiDoc(apiDoc: string): Promise<ServiceResponse<ApiIntegrationData>>
  async generateIntegration(config: Partial<ApiIntegrationData>): Promise<ServiceResponse<any>>
  async saveIntegration(data: ApiIntegrationData): Promise<ServiceResponse<string>>
}
```

### Available Types
```typescript
export type IntegrationPlatform = {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  authType: 'oauth' | 'api_key' | 'webhook';
  scopes: string[];
  features: string[];
}

export type UserIntegration = {
  id: string;
  user_id: string;
  integration_id: string;
  integration_name: string;
  status: 'active' | 'inactive' | 'error' | 'setup';
  config: any;
  last_sync_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type DataPointAnalytics = {
  totalDataPoints: number;
  dataPointsByType: Record<string, number>;
  dataPointsByTimePeriod: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  topDataPoints: any[];
  dataPointTrends: any[];
}

export type IntegrationDataSummary = {
  integrationId: string;
  integrationName: string;
  status: string;
  dataPoints: DataPointAnalytics;
  lastSync: string | null;
  syncFrequency: string;
  errorCount: number;
}

export type ApiIntegrationData = {
  name: string;
  version: string;
  serverUrl: string;
  endpoints: Array<{
    name: string;
    path: string;
    method: string;
    description: string;
  }>;
  authMethods?: string[];
}
```

## 🔧 Usage Examples

### Getting User Integrations
```typescript
const { data: integrations, error } = await consolidatedIntegrationService.getUserIntegrations(userId);

if (error) {
  toast.error('Failed to load integrations');
  return;
}

setIntegrations(integrations || []);
```

### Connecting an Integration
```typescript
const { data: result, error } = await consolidatedIntegrationService.connectIntegration(
  userId, 
  'hubspot', 
  { apiKey: 'your-api-key' }
);

if (error) {
  toast.error('Failed to connect integration');
  return;
}

if (result?.success) {
  toast.success('Integration connected successfully');
  await refreshIntegrations();
}
```

### Getting Analytics
```typescript
const { data: analytics, error } = await consolidatedIntegrationService.getUserDataPointAnalytics(userId);

if (error) {
  console.error('Failed to get analytics:', error);
  return;
}

setTotalDataPoints(analytics?.totalDataPoints || 0);
setDataGrowthRate(analytics?.dataPointTrends?.length || 0);
```

### Analyzing API Documentation
```typescript
const { data: apiData, error } = await consolidatedIntegrationService.analyzeApiDoc(apiDocJson);

if (error) {
  toast.error('Invalid API documentation');
  return;
}

setApiInfo(apiData);
```

## 🚨 Important Notes

### 1. Error Handling
All methods now return a `ServiceResponse<T>` format. Always check for errors:

```typescript
const { data, error } = await consolidatedIntegrationService.someMethod();

if (error) {
  // Handle error appropriately
  throw new Error(error);
}

// Use data safely
const result = data || defaultValue;
```

### 2. Authentication
The service automatically handles authentication validation. No need to manually check sessions.

### 3. Logging
All operations are automatically logged through the BaseService. No need to add manual logging.

### 4. Type Safety
All types are exported from the consolidated service. Use them for better type safety:

```typescript
import { 
  consolidatedIntegrationService,
  type UserIntegration,
  type IntegrationPlatform 
} from '@/services/integrations/consolidatedIntegrationService';
```

## 🔄 Migration Checklist

- [ ] Update all imports to use `consolidatedIntegrationService`
- [ ] Update all service calls to handle `ServiceResponse<T>` format
- [ ] Add proper error handling for all service calls
- [ ] Update type imports to use consolidated service types
- [ ] Test all integration functionality
- [ ] Remove old service imports and instances

## 📚 Legacy Services

The old services are still available for backward compatibility but are marked as deprecated:

```typescript
// DEPRECATED - Use consolidatedIntegrationService instead
import { IntegrationDataService } from '@/services/integrations';
import { UniversalIntegrationService } from '@/services/integrations';
import { ApiIntegrationService } from '@/shared/services/apiIntegrationService';
```

## 🆘 Need Help?

If you encounter issues during migration:

1. Check the error handling examples above
2. Ensure you're using the correct import path
3. Verify that all service calls handle the `ServiceResponse<T>` format
4. Check the TypeScript types for proper type safety

For additional support, refer to the service implementation in `consolidatedIntegrationService.ts`. 