# Integration Creation Playbook

## FIRE Framework: Create New Integration

### **F**oundation
**Objective**: Establish a standardized approach for creating new third-party integrations that follow Nexus architecture patterns and maintain consistency across all integration services.

**Context**: 
- All integrations must extend BaseService for consistent error handling, logging, and response patterns
- Integrations should follow the same patterns as Microsoft 365, HubSpot, and Google Workspace
- Must integrate with existing infrastructure (Supabase, Edge Functions, UI components)
- Should support token management, data sync, and intelligence features

**Success Criteria**:
- ✅ Integration extends BaseService with proper error handling
- ✅ Standardized ServiceResponse pattern for all methods
- ✅ Token refresh automation with 5-minute buffer
- ✅ Data sync capabilities with retry logic
- ✅ Type-safe interfaces and proper TypeScript types
- ✅ Integration with existing database schema
- ✅ UI components for data visualization
- ✅ Build passes without errors
- ✅ Follows project code conventions

---

### **I**mplementation

#### Phase 1: Service Layer Foundation

**Step 1: Create Service Directory Structure**
```bash
src/services/integrations/[integration-name]/
├── [IntegrationName]Service.ts    # Main service class
├── utils.ts                       # OAuth and utility functions
└── index.ts                       # Export file
```

**Step 2: Implement Base Service Extension**
```typescript
import { BaseService, type ServiceResponse } from '@/core/services/BaseService';
import { supabase } from '@/lib/supabase';
import { logger } from '@/shared/utils/logger';
import { retryFetch } from '@/shared/utils/retry';

export class [IntegrationName]Service extends BaseService {
  private readonly apiBaseUrl = 'https://api.example.com/v1';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  // Core methods follow BaseService patterns
}
```

**Step 3: Define Type Interfaces**
```typescript
export interface [IntegrationName]Tokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
}

export interface [IntegrationName]Data {
  // Define data structures specific to integration
}

export interface [IntegrationName]IntegrationData {
  // Consolidated data structure
  lastSync: string;
}
```

#### Phase 2: Core Service Methods

**Step 4: Implement Token Management**
```typescript
async getValidTokens(userId: string): Promise<ServiceResponse<[IntegrationName]Tokens>> {
  return this.executeDbOperation(async () => {
    // Check integration status
    // Validate token expiration (5-minute buffer)
    // Auto-refresh if expired
    // Return standardized response
  }, `get valid [IntegrationName] tokens for user ${userId}`);
}

async refreshTokens(userId: string, refreshToken: string): Promise<ServiceResponse<[IntegrationName]Tokens>> {
  // Call Edge Function for token refresh
  // Update database with new tokens
  // Handle errors with BaseService patterns
}
```

**Step 5: Connection Status Methods**
```typescript
async hasValidConnection(userId: string): Promise<ServiceResponse<boolean>> {
  return this.executeDbOperation(async () => {
    // Check integration exists and is connected
    // Validate token expiration
    // Return boolean status
  }, `check [IntegrationName] connection for user ${userId}`);
}

async getConnectionStatus(userId: string): Promise<ServiceResponse<{
  connected: boolean;
  status: string;
  lastSync?: string;
  expiresAt?: string;
}>> {
  // Return detailed connection information
}
```

**Step 6: Data Sync Implementation**
```typescript
async sync[IntegrationName]DataWithIntelligence(userId: string): Promise<ServiceResponse<{
  // Define sync result structure
  lastSync: string;
}>> {
  try {
    // Get valid access token
    // Fetch data from external API
    // Store data in database
    // Update integration status
    // Return sync results
  } catch (error) {
    return this.handleError(error, 'sync [IntegrationName] data');
  }
}
```

#### Phase 3: Data Fetching and Storage

**Step 7: API Integration Methods**
```typescript
private async fetch[IntegrationName]Data(accessToken: string): Promise<[IntegrationName]Data[]> {
  try {
    const response = await retryFetch(`${this.apiBaseUrl}/endpoint`, {
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
    this.logger.error('Error fetching [IntegrationName] data', { error });
    return [];
  }
}
```

**Step 8: Database Storage Methods**
```typescript
private async store[IntegrationName]Data(data: [IntegrationName]Data[], userId: string): Promise<number> {
  try {
    const dataToStore = data.map(item => ({
      user_id: userId,
      integration_name: '[IntegrationName]',
      data_type: 'data_type',
      external_id: item.id,
      data: item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await this.supabase
      .from('integration_data')
      .upsert(dataToStore, { onConflict: 'user_id,integration_name,data_type,external_id' });

    if (error) {
      this.logger.error('Error storing [IntegrationName] data', { error });
      return 0;
    }

    return data.length;
  } catch (error) {
    this.logger.error('Error storing [IntegrationName] data', { error });
    return 0;
  }
}
```

#### Phase 4: Integration Points

**Step 9: Export Configuration**
```typescript
// src/services/integrations/[integration-name]/index.ts
export { [IntegrationName]Service } from './[IntegrationName]Service';
export type {
  [IntegrationName]Tokens,
  [IntegrationName]Data,
  [IntegrationName]IntegrationData,
} from './[IntegrationName]Service';
export { create[IntegrationName]AuthUrl } from './utils';
```

**Step 10: Main Integration Index**
```typescript
// src/services/integrations/index.ts
export { [IntegrationName]Service } from './[integration-name]';
```

#### Phase 5: UI Components

**Step 11: Create Insights Component**
```typescript
// src/components/integrations/[IntegrationName]Insights.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/index';
import { [IntegrationName]Service, type [IntegrationName]IntegrationData } from '@/services/integrations/[integration-name]';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';

export function [IntegrationName]Insights() {
  // Implement component following HubSpot/Microsoft patterns
  // Include data loading, sync functionality, error handling
  // Use shared UI components for consistency
}
```

#### Phase 6: Edge Function Integration

**Step 12: Create Edge Function (if needed)**
```typescript
// supabase/functions/[integration-name]_refresh_token/index.ts
import { createEdgeFunction } from '@/shared/utils/edgeFunction';

export default createEdgeFunction(async (req) => {
  // Implement token refresh logic
  // Follow existing Edge Function patterns
  // Use proper error handling and response formatting
});
```

---

### **R**efinement

#### Quality Assurance Checklist

**Service Layer Validation**:
- [ ] Extends BaseService correctly
- [ ] All methods return ServiceResponse<T>
- [ ] Error handling uses this.handleError()
- [ ] Database operations use executeDbOperation()
- [ ] Retry logic implemented with retryFetch
- [ ] Token refresh with 5-minute buffer
- [ ] Proper TypeScript types defined

**Integration Points**:
- [ ] Exported from integration index
- [ ] Added to main integrations index
- [ ] UI components use shared components
- [ ] Follows existing naming conventions
- [ ] Build passes without errors

**Data Management**:
- [ ] Stores data in integration_data table
- [ ] Uses proper upsert logic
- [ ] Handles external API errors gracefully
- [ ] Updates integration status correctly
- [ ] Implements proper logging

**UI/UX Consistency**:
- [ ] Uses shared UI components
- [ ] Follows existing component patterns
- [ ] Implements loading states
- [ ] Error handling with user feedback
- [ ] Progress indicators for sync operations

#### Testing Strategy

**Unit Tests**:
```typescript
// __tests__/services/integrations/[integration-name].test.ts
describe('[IntegrationName]Service', () => {
  test('should extend BaseService', () => {
    const service = new [IntegrationName]Service();
    expect(service).toBeInstanceOf(BaseService);
  });

  test('should handle token refresh', async () => {
    // Test token refresh logic
  });

  test('should sync data successfully', async () => {
    // Test data sync functionality
  });
});
```

**Integration Tests**:
```typescript
// __tests__/components/integrations/[IntegrationName]Insights.test.tsx
describe('[IntegrationName]Insights', () => {
  test('should render without errors', () => {
    // Test component rendering
  });

  test('should handle data loading', async () => {
    // Test data loading states
  });
});
```

---

### **E**volution

#### Continuous Improvement

**Performance Optimization**:
- Implement pagination for large datasets
- Add caching strategies for frequently accessed data
- Optimize database queries with proper indexing
- Consider background sync for large integrations

**Feature Enhancements**:
- Add real-time data updates
- Implement webhook support for live data
- Create advanced analytics and insights
- Add data export capabilities

**Monitoring and Observability**:
- Add comprehensive logging for debugging
- Implement metrics collection
- Create health check endpoints
- Set up alerting for integration failures

#### Maintenance Guidelines

**Regular Updates**:
- Monitor API changes from third-party providers
- Update token refresh logic as needed
- Review and update error handling
- Maintain compatibility with BaseService updates

**Documentation**:
- Keep integration documentation current
- Update API endpoint references
- Maintain troubleshooting guides
- Document breaking changes

---

## Quick Reference

### Template Files to Copy
1. `src/services/integrations/google-workspace/GoogleWorkspaceService.ts` - Service template
2. `src/services/integrations/google-workspace/utils.ts` - Utils template
3. `src/services/integrations/google-workspace/index.ts` - Export template
4. `src/components/integrations/GoogleWorkspaceInsights.tsx` - UI template

### Key Patterns to Follow
- Always extend BaseService
- Use ServiceResponse<T> for all methods
- Implement token refresh with 5-minute buffer
- Use retryFetch for external API calls
- Store data in integration_data table
- Use shared UI components
- Follow existing naming conventions

### Common Pitfalls to Avoid
- ❌ Don't use console.log (use this.logger)
- ❌ Don't throw errors (return ServiceResponse with error)
- ❌ Don't hardcode API URLs (use environment variables)
- ❌ Don't skip token validation
- ❌ Don't forget to update integration status
- ❌ Don't use raw fetch (use retryFetch)

---

*Last Updated: 2025-01-27*
*Version: 1.0*
*Status: Active*
