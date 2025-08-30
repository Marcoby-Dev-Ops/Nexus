# 📋 Service Standardization Guide

## 🎯 **Overview**

This guide establishes consistent patterns and standards for all services in the Nexus application to ensure maintainability, reliability, and performance.

## 🏗️ **Service Architecture Standards**

### **1. Service Base Class**

All services **MUST** extend `BaseService` and implement the `CrudServiceInterface`:

```typescript
import { BaseService } from '../shared/BaseService';
import { CrudServiceInterface } from '../shared/types';
import { ServiceResponse } from '../shared/types';

export class ExampleService extends BaseService implements CrudServiceInterface<ExampleType> {
  protected config = exampleServiceConfig;
  
  constructor() {
    super('ExampleService');
  }

  // CRUD Operations
  async get(id: string): Promise<ServiceResponse<ExampleType>> {
    try {
      const result = await this.withRetry(() => 
        supabase.from('examples').select('*').eq('id', id).single()
      );
      
      return this.createResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch example');
    }
  }

  async create(data: Partial<ExampleType>): Promise<ServiceResponse<ExampleType>> {
    try {
      const result = await this.withRetry(() => 
        supabase.from('examples').insert(data).select().single()
      );
      
      return this.createResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'Failed to create example');
    }
  }

  async update(id: string, data: Partial<ExampleType>): Promise<ServiceResponse<ExampleType>> {
    try {
      const result = await this.withRetry(() => 
        supabase.from('examples').update(data).eq('id', id).select().single()
      );
      
      return this.createResponse(result.data);
    } catch (error) {
      return this.handleError(error, 'Failed to update example');
    }
  }

  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      await this.withRetry(() => 
        supabase.from('examples').delete().eq('id', id)
      );
      
      return this.createResponse(true);
    } catch (error) {
      return this.handleError(error, 'Failed to delete example');
    }
  }

  async list(filters?: Record<string, any>): Promise<ServiceResponse<ExampleType[]>> {
    try {
      let query = supabase.from('examples').select('*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      const result = await this.withRetry(() => query);
      
      return this.createResponse(result.data || []);
    } catch (error) {
      return this.handleError(error, 'Failed to list examples');
    }
  }

  // Business Logic Methods
  async customBusinessMethod(param: string): Promise<ServiceResponse<any>> {
    try {
      // Business logic implementation
      const result = await this.withRetry(() => 
        // Implementation here
      );
      
      return this.createResponse(result);
    } catch (error) {
      return this.handleError(error, 'Failed to execute custom business method');
    }
  }
}
```

### **2. Service Configuration**

Each service **MUST** have a configuration object:

```typescript
export const exampleServiceConfig = {
  tableName: 'examples',
  schema: ExampleSchema,
  cacheTimeout: 300000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000,
} as const;
```

### **3. Service Registration**

All services **MUST** be registered in the `ServiceRegistry`:

```typescript
// In ServiceRegistry.ts
this.register('exampleService', new ExampleService(), {
  name: 'ExampleService',
  category: 'business',
  description: 'Manages example data and operations',
  dependencies: ['userService'],
  isSingleton: true
});
```

## 📝 **Naming Conventions**

### **Service Names**
- **Format:** `[Domain]Service.ts`
- **Examples:** `UserService.ts`, `ContactService.ts`, `AIService.ts`

### **Method Names**
- **CRUD:** `get`, `create`, `update`, `delete`, `list`
- **Business Logic:** `camelCase` with descriptive names
- **Examples:** `getUserProfile`, `createContact`, `updateDealStatus`

### **Variable Names**
- **Constants:** `UPPER_SNAKE_CASE`
- **Variables:** `camelCase`
- **Private:** `_camelCase` (with underscore prefix)

## 🔧 **Error Handling Standards**

### **1. Consistent Error Responses**

All services **MUST** use the standardized error handling:

```typescript
// ✅ CORRECT
return this.handleError(error, 'Failed to fetch user profile');

// ❌ INCORRECT
return { success: false, error: error.message };
```

### **2. Error Context**

Always provide meaningful error context:

```typescript
// ✅ CORRECT
return this.handleError(error, `Failed to update contact ${contactId}`);

// ❌ INCORRECT
return this.handleError(error, 'Error occurred');
```

### **3. Retry Logic**

Use the built-in retry mechanism for external calls:

```typescript
// ✅ CORRECT
const result = await this.withRetry(() => 
  supabase.from('users').select('*').eq('id', userId).single()
);

// ❌ INCORRECT
const result = await supabase.from('users').select('*').eq('id', userId).single();
```

## 📊 **Response Format Standards**

### **1. ServiceResponse Interface**

All service methods **MUST** return `ServiceResponse<T>`:

```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    duration: number;
    retryCount?: number;
  };
}
```

### **2. Response Creation**

Use the standardized response methods:

```typescript
// ✅ CORRECT
return this.createResponse(data);
return this.handleError(error, 'Error message');

// ❌ INCORRECT
return { success: true, data };
return { success: false, error: error.message };
```

## 🏗️ **Service Organization**

### **1. Directory Structure**

```
services/
├── core/                    # Core application services
│   ├── UserService.ts
│   ├── CompanyService.ts
│   └── AnalyticsService.ts
├── business/               # Business domain services
│   ├── ContactService.ts
│   ├── DealService.ts
│   └── CalendarService.ts
├── ai/                     # AI and machine learning services
│   ├── AIService.ts
│   ├── AIInsightsService.ts
│   └── AIFormAssistanceService.ts
├── integrations/           # External integration services
│   ├── consolidatedIntegrationService.ts
│   └── [platform-specific]/
├── departments/            # Department-specific services
│   ├── SalesService.ts
│   ├── MarketingService.ts
│   └── OperationsService.ts
└── shared/                 # Shared utilities and base classes
    ├── BaseService.ts
    ├── types.ts
    └── utils.ts
```

### **2. Service Categories**

- **Core:** Essential application services (User, Company, Analytics)
- **Business:** Business domain services (Contact, Deal, Calendar)
- **AI:** Artificial intelligence and machine learning services
- **Integration:** External system integrations
- **Department:** Department-specific operations
- **Utility:** Shared utilities and helper services

## 🔒 **Security Standards**

### **1. Input Validation**

All service methods **MUST** validate inputs:

```typescript
async createUser(userData: Partial<User>): Promise<ServiceResponse<User>> {
  try {
    // Validate input
    const validatedData = this.config.schema.parse(userData);
    
    const result = await this.withRetry(() => 
      supabase.from('users').insert(validatedData).select().single()
    );
    
    return this.createResponse(result.data);
  } catch (error) {
    return this.handleError(error, 'Failed to create user');
  }
}
```

### **2. Authorization**

Implement proper authorization checks:

```typescript
async updateUser(userId: string, updates: Partial<User>): Promise<ServiceResponse<User>> {
  try {
    // Check authorization
    const isAuthorized = await this.checkUserPermission(userId, 'update');
    if (!isAuthorized) {
      return this.handleError(new Error('Unauthorized'), 'Insufficient permissions');
    }
    
    const result = await this.withRetry(() => 
      supabase.from('users').update(updates).eq('id', userId).select().single()
    );
    
    return this.createResponse(result.data);
  } catch (error) {
    return this.handleError(error, 'Failed to update user');
  }
}
```

## 🧪 **Testing Standards**

### **1. Test Structure**

Each service **MUST** have corresponding tests:

```typescript
// ExampleService.test.ts
import { ExampleService } from './ExampleService';

describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(() => {
    service = new ExampleService();
  });

  describe('get', () => {
    it('should return user by id', async () => {
      const result = await service.get('test-id');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const result = await service.get('invalid-id');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### **2. Test Coverage**

- **Minimum Coverage:** 90%
- **Critical Paths:** 100%
- **Error Scenarios:** 100%

## 📈 **Performance Standards**

### **1. Caching**

Implement appropriate caching strategies:

```typescript
private cache = new Map<string, { data: any; timestamp: number }>();
private readonly CACHE_TTL = 300000; // 5 minutes

async getCachedData(key: string): Promise<any> {
  const cached = this.cache.get(key);
  if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
    return cached.data;
  }
  
  const data = await this.fetchData(key);
  this.cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### **2. Database Queries**

Optimize database queries:

```typescript
// ✅ CORRECT - Select only needed fields
const result = await supabase
  .from('users')
  .select('id, name, email')
  .eq('id', userId)
  .single();

// ❌ INCORRECT - Select all fields
const result = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

## 📚 **Documentation Standards**

### **1. Service Documentation**

Each service **MUST** have comprehensive documentation:

```typescript
/**
 * UserService - Manages user profiles and authentication
 * 
 * Provides CRUD operations for user data and handles user-related
 * business logic including profile management and authentication.
 * 
 * @example
 * ```typescript
 * const userService = getService('userService');
 * const user = await userService.getUserById('user-123');
 * ```
 */
export class UserService extends BaseService {
  // Implementation...
}
```

### **2. Method Documentation**

Document all public methods:

```typescript
/**
 * Creates a new user profile
 * 
 * @param userData - User data to create
 * @returns Promise<ServiceResponse<User>> - Created user or error
 * 
 * @example
 * ```typescript
 * const result = await userService.createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
async createUser(userData: Partial<User>): Promise<ServiceResponse<User>> {
  // Implementation...
}
```

## 🔄 **Migration Checklist**

When creating or updating services, ensure:

- [ ] Service extends `BaseService`
- [ ] Service implements `CrudServiceInterface<T>`
- [ ] Service is registered in `ServiceRegistry`
- [ ] All methods return `ServiceResponse<T>`
- [ ] Error handling uses `handleError()`
- [ ] Input validation is implemented
- [ ] Authorization checks are in place
- [ ] Tests are written with 90%+ coverage
- [ ] Documentation is comprehensive
- [ ] Performance optimizations are applied
- [ ] Naming conventions are followed
- [ ] Security standards are met

## 🚀 **Best Practices**

### **1. Keep Services Focused**

```typescript
// ✅ CORRECT - Single responsibility
export class ContactService extends BaseService {
  // Only contact-related operations
}

// ❌ INCORRECT - Multiple responsibilities
export class BusinessService extends BaseService {
  // Contact, deal, company, and other operations
}
```

### **2. Use Dependency Injection**

```typescript
// ✅ CORRECT - Use service registry
const userService = getService('userService');
const contactService = getService('contactService');

// ❌ INCORRECT - Direct instantiation
const userService = new UserService();
const contactService = new ContactService();
```

### **3. Handle Async Operations Properly**

```typescript
// ✅ CORRECT - Proper async/await
async getData(): Promise<ServiceResponse<any>> {
  try {
    const result = await this.withRetry(() => this.fetchData());
    return this.createResponse(result);
  } catch (error) {
    return this.handleError(error, 'Failed to fetch data');
  }
}

// ❌ INCORRECT - Promise chains
getData(): Promise<ServiceResponse<any>> {
  return this.fetchData()
    .then(result => ({ success: true, data: result }))
    .catch(error => ({ success: false, error: error.message }));
}
```

This standardization guide ensures all services follow consistent patterns, making the codebase more maintainable, reliable, and performant.
