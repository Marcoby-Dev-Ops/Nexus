# 🔌 **Integration Adapter System**

## 📋 **Overview**

The Integration Adapter System provides a standardized, type-safe, and consistent way to integrate with external services. It follows our service layer standards and provides a unified interface for all integration operations.

## 🎯 **Architecture Principles**

### **1. Service Layer Standards Compliance**
- **All adapters extend `BaseAdapter`** - Consistent error handling and logging
- **ServiceResponse pattern** - Standardized response format
- **Type safety** - Comprehensive Zod schemas for all data structures
- **Authentication validation** - Built-in session validation

### **2. Registry Pattern**
- **Central registry** - All adapters registered in `AdapterRegistry`
- **Metadata-driven** - Rich metadata for UI display and filtering
- **Category-based organization** - Easy filtering by integration type
- **Popularity tracking** - Highlight commonly used integrations

### **3. BaseAdapter Class**
- **Extends BaseService** - Inherits all service layer functionality
- **Abstract methods** - Enforces consistent interface
- **Built-in logging** - Automatic operation logging
- **Error handling** - Standardized error responses

## 🏗️ **Core Components**

### **1. BaseAdapter Class**
```typescript
export abstract class BaseAdapter extends BaseService {
  abstract readonly id: string;
  abstract readonly metadata: AdapterMetadata;

  abstract connect(credentials: AdapterCredentials): Promise<ServiceResponse<AdapterConnectionResult>>;
  abstract disconnect(): Promise<ServiceResponse<AdapterConnectionResult>>;
  abstract testConnection(): Promise<ServiceResponse<AdapterConnectionResult>>;
  abstract sync(): Promise<ServiceResponse<AdapterSyncResult>>;
}
```

### **2. Adapter Registry**
```typescript
class AdapterRegistry {
  register(adapter: Adapter): void;
  get(id: string): Adapter | undefined;
  getAll(): Adapter[];
  getByCategory(category: string): Adapter[];
  getPopular(): Adapter[];
  getByAuthType(authType: string): Adapter[];
}
```

### **3. Type Definitions**
```typescript
// Adapter Credentials
export type AdapterCredentials = {
  access_token?: string;
  refresh_token?: string;
  api_key?: string;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  scope?: string;
  expires_at?: string;
};

// Connection Result
export type AdapterConnectionResult = {
  success: boolean;
  error?: string;
  details?: Record<string, any>;
};

// Sync Result
export type AdapterSyncResult = {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  duration: number;
};
```

## 📦 **Available Adapters**

### **CRM & Marketing**
- **HubSpot** - CRM and marketing automation platform
- **Salesforce** - Enterprise CRM platform

### **Productivity**
- **Google Workspace** - Email, calendar, and productivity tools
- **Microsoft 365** - Office productivity and collaboration tools

### **Communication**
- **Slack** - Team communication platform
- **Discord** - Community communication platform

## 🚀 **Usage Examples**

### **1. Creating a New Adapter**
```typescript
class MyCustomAdapter extends BaseAdapter {
  readonly id = 'my_custom_integration';
  readonly metadata: AdapterMetadata = {
    name: 'my_custom_integration',
    displayName: 'My Custom Integration',
    description: 'Custom integration for my service',
    icon: 'custom-icon',
    authType: 'oauth',
    scopes: ['read', 'write'],
    capabilities: ['Data Sync', 'API Access'],
    setupTime: '2 minutes',
    category: 'Custom'
  };

  async connect(credentials: AdapterCredentials): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      try {
        this.logger.info('Connecting to My Custom Integration');
        
        // Your connection logic here
        const result = await this.performConnection(credentials);
        
        return { data: { success: true }, error: null };
      } catch (error) {
        this.logger.error('Connection failed', { error });
        return { data: null, error: 'Failed to connect' };
      }
    }, 'connect to My Custom Integration');
  }

  // Implement other abstract methods...
}
```

### **2. Registering an Adapter**
```typescript
import { adapterRegistry } from '@/core/adapters/adapterRegistry';

const myAdapter = new MyCustomAdapter();
adapterRegistry.register(myAdapter);
```

### **3. Using Adapters in Components**
```typescript
import { adapterRegistry } from '@/core/adapters/adapterRegistry';

const IntegrationComponent = () => {
  const adapters = adapterRegistry.getAll();
  const popularAdapters = adapterRegistry.getPopular();
  const crmAdapters = adapterRegistry.getByCategory('CRM');

  const handleConnect = async (adapterId: string) => {
    const adapter = adapterRegistry.get(adapterId);
    if (!adapter) return;

    const credentials = { /* user credentials */ };
    const result = await adapter.connect(credentials);
    
    if (result.error) {
      // Handle error
    } else {
      // Handle success
    }
  };
};
```

## 🔧 **Integration with Consolidated Service**

The adapter system works seamlessly with the `consolidatedIntegrationService`:

```typescript
// In consolidatedIntegrationService.ts
async connectVendor(vendorId: string, credentials: IntegrationCredentials): Promise<ServiceResponse<ConnectionResult>> {
  const adapter = adapterRegistry.get(vendorId);
  if (!adapter) {
    return { data: null, error: 'Adapter not found' };
  }

  const result = await adapter.connect(credentials);
  return result;
}
```

## 📊 **Standards Compliance**

### **✅ Fully Compliant Areas:**
1. **Service Layer Architecture** - Extends BaseService, uses ServiceResponse
2. **TypeScript Standards** - Comprehensive Zod schemas, no `any` types
3. **Logging Standards** - Uses `this.logger` instead of `console.*`
4. **Error Handling** - Consistent error responses and logging
5. **Authentication** - Built-in session validation

### **✅ Key Features:**
- **Type Safety** - All interfaces properly typed
- **Standardized Responses** - Consistent ServiceResponse format
- **Built-in Logging** - Automatic operation logging
- **Error Handling** - Proper error propagation
- **Extensibility** - Easy to add new adapters
- **Backward Compatibility** - Maintains existing interface

## 🧪 **Testing**

### **Unit Testing**
```typescript
describe('HubSpotAdapter', () => {
  let adapter: HubSpotAdapter;

  beforeEach(() => {
    adapter = new HubSpotAdapter();
  });

  it('should connect successfully', async () => {
    const credentials = { access_token: 'test_token' };
    const result = await adapter.connect(credentials);
    
    expect(result.success).toBe(true);
    expect(result.data?.success).toBe(true);
  });
});
```

### **Integration Testing**
```typescript
describe('AdapterRegistry', () => {
  it('should register and retrieve adapters', () => {
    const adapter = new HubSpotAdapter();
    adapterRegistry.register(adapter);
    
    const retrieved = adapterRegistry.get('hubspot');
    expect(retrieved).toBe(adapter);
  });
});
```

## 📚 **Migration Guide**

### **From Old Adapter System:**
1. **Update interface** - Change from `any` to `AdapterCredentials`
2. **Extend BaseAdapter** - Instead of implementing raw interface
3. **Use ServiceResponse** - Return `ServiceResponse<T>` instead of raw objects
4. **Add logging** - Use `this.logger` for all operations
5. **Update error handling** - Use standardized error responses

### **Example Migration:**
```typescript
// OLD
interface OldAdapter {
  connect: (credentials: any) => Promise<{ success: boolean; error?: string }>;
}

// NEW
class NewAdapter extends BaseAdapter {
  async connect(credentials: AdapterCredentials): Promise<ServiceResponse<AdapterConnectionResult>> {
    return this.executeDbOperation(async () => {
      // Your logic here
    }, 'connect to integration');
  }
}
```

## 🎯 **Best Practices**

1. **Always extend BaseAdapter** - Don't implement raw interface
2. **Use proper logging** - Log all operations with context
3. **Handle errors gracefully** - Return proper ServiceResponse
4. **Validate credentials** - Check required fields before processing
5. **Add comprehensive metadata** - Rich metadata helps with UI
6. **Test thoroughly** - Unit and integration tests for all adapters
7. **Document capabilities** - Clear description of what the adapter does

## 🔄 **Future Enhancements**

- **Real-time sync** - WebSocket-based real-time data sync
- **Batch operations** - Bulk data processing capabilities
- **Rate limiting** - Built-in API rate limiting
- **Caching** - Intelligent caching of frequently accessed data
- **Metrics** - Performance and usage metrics
- **Webhook support** - Real-time event notifications 