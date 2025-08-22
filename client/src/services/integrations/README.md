# Integration System Architecture

## Overview

The integration system provides a standardized, maintainable, and extensible way to connect with external services. It follows the service layer standards and provides a consistent interface for all integrations.

## Architecture Components

### 1. Core Services

#### `IntegrationBaseService`
- **Purpose**: Abstract base class for all integrations
- **Features**: 
  - Standardized CRUD operations
  - Error handling and logging
  - Schema validation with Zod
  - Status management
  - Connection testing

#### `IntegrationRegistryService`
- **Purpose**: Central registry for all available integrations
- **Features**:
  - Integration registration and discovery
  - Category-based organization
  - Popular integrations management
  - Search functionality
  - Statistics and metrics

#### `DataMappingService`
- **Purpose**: Handles field mapping between external and internal data models
- **Features**:
  - Field transformation and validation
  - Mapping templates
  - Data type conversion
  - Custom transformation functions
  - Validation rules

### 2. Integration Implementation

#### `HubSpotIntegrationService`
- **Purpose**: HubSpot CRM integration
- **Features**:
  - Contact, company, and deal synchronization
  - OAuth authentication
  - Rate limiting handling
  - Error recovery
  - Data transformation

## Database Schema

### Tables

#### `integrations`
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  platform VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  credentials JSONB,
  settings JSONB,
  last_sync TIMESTAMP,
  data_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `integration_registry`
```sql
CREATE TABLE integration_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL UNIQUE,
  platform VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  capabilities TEXT[],
  required_fields TEXT[],
  optional_fields TEXT[],
  icon VARCHAR,
  documentation_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `data_mappings`
```sql
CREATE TABLE data_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_type VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  external_field VARCHAR NOT NULL,
  internal_field VARCHAR NOT NULL,
  field_type VARCHAR NOT NULL,
  is_required BOOLEAN DEFAULT FALSE,
  default_value JSONB,
  transformation TEXT,
  validation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(integration_type, entity_type, external_field)
);
```

#### `mapping_templates`
```sql
CREATE TABLE mapping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  integration_type VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  mappings JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `integration_data`
```sql
CREATE TABLE integration_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id),
  entity_type VARCHAR NOT NULL,
  external_id VARCHAR NOT NULL,
  data JSONB NOT NULL,
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(integration_id, entity_type, external_id)
);
```

## Usage Examples

### 1. Creating a New Integration

```typescript
import { IntegrationService } from '@/services/integrations';

const integrationService = new IntegrationService();

// Create a new HubSpot integration
const result = await integrationService.createIntegration({
  name: 'My HubSpot CRM',
  type: 'hubspot',
  platform: 'hubspot',
  credentials: {
    accessToken: 'pat-xxx',
    refreshToken: 'xxx'
  },
  settings: {
    syncContacts: true,
    syncCompanies: true,
    syncDeals: true
  }
});
```

### 2. Testing Connection

```typescript
const testResult = await integrationService.testConnection(integrationId);
if (testResult.data?.success) {
  console.log('Connection successful');
} else {
  console.error('Connection failed:', testResult.data?.error);
}
```

### 3. Syncing Data

```typescript
const syncResult = await integrationService.syncIntegration(integrationId);
console.log(`Synced ${syncResult.data?.recordsProcessed} records`);
console.log(`Duration: ${syncResult.data?.duration}ms`);
```

### 4. Data Mapping

```typescript
// Create a field mapping
await integrationService.createDataMapping({
  integrationType: 'hubspot',
  entityType: 'contact',
  externalField: 'properties.firstname',
  internalField: 'firstName',
  fieldType: 'string',
  isRequired: true,
  transformation: 'return value ? value.trim() : null;',
  validation: 'return typeof value === "string" && value.length > 0;'
});

// Transform data
const transformedData = await integrationService.transformData(
  'hubspot',
  'contact',
  { 'properties.firstname': 'John', 'properties.lastname': 'Doe' }
);
```

## Adding New Integrations

### 1. Create Integration Service

```typescript
import { IntegrationBaseService } from '../core/IntegrationBaseService';

export class SalesforceIntegrationService extends IntegrationBaseService {
  protected readonly integrationType = 'salesforce';
  protected readonly platform = 'salesforce';

  async testConnection(integrationId: string): Promise<ServiceResponse<TestConnectionResult>> {
    // Implement Salesforce-specific connection testing
  }

  async syncData(integrationId: string): Promise<ServiceResponse<SyncResult>> {
    // Implement Salesforce-specific data synchronization
  }

  async connect(integrationId: string, credentials: any): Promise<ServiceResponse<any>> {
    // Implement Salesforce-specific connection logic
  }

  async disconnect(integrationId: string): Promise<ServiceResponse<boolean>> {
    // Implement Salesforce-specific disconnection logic
  }

  async getMetadata(): Promise<ServiceResponse<any>> {
    // Return Salesforce integration metadata
  }

  async validateConfig(config: IntegrationConfig): Promise<ServiceResponse<any>> {
    // Validate Salesforce configuration
  }
}
```

### 2. Register Integration

```typescript
// In IntegrationService.initializeIntegrations()
this.registryService.registerIntegration(new SalesforceIntegrationService());
```

### 3. Add Database Records

```sql
-- Add to integration_registry
INSERT INTO integration_registry (
  name, type, platform, description, category, 
  capabilities, required_fields, optional_fields
) VALUES (
  'Salesforce CRM',
  'salesforce',
  'salesforce',
  'Connect to Salesforce CRM to sync leads, contacts, and opportunities',
  'CRM',
  ARRAY['sync_leads', 'sync_contacts', 'sync_opportunities'],
  ARRAY['accessToken', 'instanceUrl'],
  ARRAY['refreshToken', 'clientId', 'clientSecret']
);
```

## Best Practices

### 1. Error Handling
- Always use `executeDbOperation()` for database operations
- Log errors with appropriate context
- Provide meaningful error messages
- Implement retry logic for transient failures

### 2. Data Transformation
- Use the DataMappingService for field mapping
- Validate data before transformation
- Handle missing or invalid data gracefully
- Implement proper type conversion

### 3. Rate Limiting
- Respect API rate limits
- Implement exponential backoff
- Queue operations when necessary
- Monitor usage patterns

### 4. Security
- Encrypt sensitive credentials
- Use OAuth when possible
- Implement proper token refresh
- Validate all inputs

### 5. Monitoring
- Track sync performance
- Monitor error rates
- Log important events
- Set up alerts for failures

## Migration Guide

### From Legacy Services

1. **Update imports**:
   ```typescript
   // Old
   import { UniversalIntegrationService } from '@/services/integrations';
   
   // New
   import { IntegrationService } from '@/services/integrations';
   ```

2. **Update method calls**:
   ```typescript
   // Old
   const result = await universalService.connectIntegration(id, credentials);
   
   // New
   const result = await integrationService.createIntegration({
     name: 'My Integration',
     type: 'hubspot',
     platform: 'hubspot',
     credentials
   });
   ```

3. **Update response handling**:
   ```typescript
   // Old
   if (result.success) { ... }
   
   // New
   if (result.data && !result.error) { ... }
   ```

## Testing

### Unit Tests
```typescript
import { IntegrationService } from '@/services/integrations';

describe('IntegrationService', () => {
  let service: IntegrationService;

  beforeEach(() => {
    service = new IntegrationService();
  });

  it('should create integration', async () => {
    const result = await service.createIntegration({
      name: 'Test Integration',
      type: 'hubspot',
      platform: 'hubspot'
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeNull();
  });
});
```

### Integration Tests
```typescript
describe('HubSpot Integration', () => {
  it('should sync contacts', async () => {
    const result = await service.syncIntegration(integrationId);
    expect(result.data?.recordsProcessed).toBeGreaterThan(0);
  });
});
```

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check credentials validity
   - Verify API endpoints
   - Check network connectivity
   - Review rate limits

2. **Data Sync Issues**
   - Validate field mappings
   - Check data transformation functions
   - Review error logs
   - Verify data formats

3. **Performance Issues**
   - Implement pagination
   - Use batch operations
   - Optimize queries
   - Monitor resource usage

### Debugging

1. **Enable Debug Logging**:
   ```typescript
   this.logger.setLevel('debug');
   ```

2. **Check Integration Status**:
   ```typescript
   const status = await service.getIntegrationStatus(integrationId);
   console.log(status);
   ```

3. **Validate Mappings**:
   ```typescript
   const mappings = await service.getDataMappings('hubspot', 'contact');
   console.log(mappings);
   ```

## Future Enhancements

1. **Real-time Sync**: Webhook-based real-time synchronization
2. **Advanced Mapping**: Visual mapping interface
3. **Bulk Operations**: Batch processing for large datasets
4. **Analytics**: Integration performance analytics
5. **Templates**: Pre-built integration templates
6. **API Versioning**: Support for multiple API versions
7. **Custom Fields**: Dynamic field mapping
8. **Workflow Integration**: Integration with automation workflows 