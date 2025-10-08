# 🏗️ **Service Layer Architecture**

## 📋 **Overview**

The Service Layer provides a standardized, type-safe, and consistent way to interact with data across the application. It eliminates direct Supabase calls in components and provides a unified interface for all data operations.

## 🎯 **Architecture Principles**

### **1. Unified Service Pattern**
- **All services extend `UnifiedService<T>`** - Consistent CRUD operations
- **Schema validation** - All data validated against Zod schemas
- **Error handling** - Standardized error responses
- **Logging** - Built-in method call logging

### **2. Service Factory Pattern**
- **Central registry** - All services registered in `ServiceFactory`
- **Dependency injection** - Services accessed via factory
- **Type safety** - Full TypeScript support
- **Testing** - Easy mocking and testing

### **3. React Integration**
- **Service hooks** - `useService()` for React components
- **Loading states** - Automatic loading state management
- **Error handling** - Integrated with notification system
- **Caching** - Built-in caching strategies

## 🏗️ **Core Components**

### **1. Service Interfaces (`src/core/services/interfaces.ts`)**
```typescript
// Standardized service response
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  metadata?: Record<string, any>;
}

// Base service interface
export interface BaseServiceInterface<T> {
  get(id: string): Promise<ServiceResponse<T>>;
  create(data: Partial<T>): Promise<ServiceResponse<T>>;
  update(id: string, data: Partial<T>): Promise<ServiceResponse<T>>;
  delete(id: string): Promise<ServiceResponse<boolean>>;
  list(filters?: Record<string, any>): Promise<ServiceResponse<T[]>>;
}
```

### **2. Unified Service Base (`src/core/services/UnifiedService.ts`)**
```typescript
export abstract class UnifiedService<T> extends BaseService implements BaseServiceInterface<T> {
  protected abstract config: ServiceConfig;
  
  // Standardized CRUD operations
  async get(id: string): Promise<ServiceResponse<T>>
  async create(data: Partial<T>): Promise<ServiceResponse<T>>
  async update(id: string, data: Partial<T>): Promise<ServiceResponse<T>>
  async delete(id: string): Promise<ServiceResponse<boolean>>
  async list(filters?: Record<string, any>): Promise<ServiceResponse<T[]>>
  
  // Advanced operations
  async search(query: string, filters?: Record<string, any>): Promise<ServiceResponse<T[]>>
  async bulkCreate(data: Partial<T>[]): Promise<ServiceResponse<T[]>>
  async bulkUpdate(updates: { id: string; data: Partial<T> }[]): Promise<ServiceResponse<T[]>>
  async bulkDelete(ids: string[]): Promise<ServiceResponse<boolean>>
}
```

### **3. Service Factory (`src/core/services/ServiceFactory.ts`)**
```typescript
export class ServiceFactory implements ServiceFactoryInterface {
  static getInstance(): ServiceFactory
  register<T>(name: string, service: T): void
  get<T>(name: string): T
  has(name: string): boolean
  list(): string[]
}
```

### **4. Service Hooks (`src/shared/hooks/useService.ts`)**
```typescript
export const useService = <T>(serviceName: string) => {
  return {
    useGet: (id: string) => useServiceGet<T>(serviceName, id),
    useList: (filters?: Record<string, any>) => useServiceList<T>(serviceName, filters),
    useCreate: () => useServiceCreate<T>(serviceName),
    useUpdate: () => useServiceUpdate<T>(serviceName),
    useDelete: () => useServiceDelete(serviceName)
  };
};
```

## 🚀 **Usage Examples**

### **1. Creating a Service**
```typescript
// src/core/services/UserService.ts
import { z } from 'zod';
import { UnifiedService } from './UnifiedService';

// Define schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: z.enum(['user', 'owner', 'admin', 'manager']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Create service
export class UserService extends UnifiedService<UserProfile> {
  protected config = {
    tableName: 'user_profiles',
    schema: UserProfileSchema,
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes
    enableLogging: true,
  };

  // Custom methods
  async getUserByEmail(email: string) {
    // Implementation
  }
}

// Export instance
export const userService = new UserService();
```

### **2. Registering Services**
```typescript
// src/core/services/ServiceRegistry.ts
import { serviceFactory } from './ServiceFactory';
import { userService } from './UserService';

export const registerServices = () => {
  serviceFactory.register('user', userService);
  // Add more services as they are migrated
};

// Auto-register on import
registerServices();
```

### **3. Using in React Components**
```typescript
// Component using service hooks
import { useService } from '@/shared/hooks/useService';
import type { UserProfile } from '@/core/services/UserService';

function UserProfileComponent({ userId }: { userId: string }) {
  const { useGet, useUpdate } = useService<UserProfile>('user');
  const { data: user, isLoading, error } = useGet(userId);
  const { mutate: updateUser, isLoading: isUpdating } = useUpdate();

  const handleUpdate = (updates: Partial<UserProfile>) => {
    updateUser(userId, updates);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.first_name} {user.last_name}</h1>
      <p>{user.email}</p>
      <button 
        onClick={() => handleUpdate({ role: 'admin' })}
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : 'Make Admin'}
      </button>
    </div>
  );
}
```

### **4. Direct Service Usage**
```typescript
// Direct service usage (for non-React contexts)
import { serviceFactory } from '@/core/services/ServiceFactory';

const userService = serviceFactory.get('user');
const result = await userService.get('user-id');

if (result.success) {
  console.log('User:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## 📊 **Migration Guide**

### **Before (Direct Supabase Calls)**
```typescript
// ❌ Old pattern - Direct Supabase calls
import { supabase } from '@/lib/supabase';

const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error:', error);
    return null;
  }
  
  return data;
};
```

### **After (Service Layer)**
```typescript
// ✅ New pattern - Service layer
import { useService } from '@/shared/hooks/useService';

function UserComponent({ userId }: { userId: string }) {
  const { useGet } = useService('user');
  const { data: user, isLoading, error } = useGet(userId);
  
  // Automatic loading states, error handling, and notifications
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{user?.first_name}</div>;
}
```

## 🧪 **Testing**

### **Service Testing**
```typescript
// src/core/services/__tests__/UserService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../UserService';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should get a user by ID', async () => {
    const result = await userService.get('test-user-id');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

### **Hook Testing**
```typescript
// src/shared/hooks/__tests__/useService.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useService } from '../useService';

describe('useService', () => {
  it('should fetch data using service hook', async () => {
    const { result } = renderHook(() => useService('user').useGet('test-id'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

## 📋 **Service Migration Checklist**

### **Phase 1: Foundation (Complete)**
- ✅ **Service interfaces** - Standardized response types
- ✅ **UnifiedService base** - Common CRUD operations
- ✅ **ServiceFactory** - Central registry
- ✅ **Service hooks** - React integration
- ✅ **UserService** - First migrated service

### **Phase 2: Core Services (Next)**
- [ ] **CompanyService** - Company management
- [ ] **AnalyticsService** - Analytics data
- [ ] **IntegrationService** - Third-party integrations
- [ ] **NotificationService** - Notification management

### **Phase 3: Component Migration**
- [ ] **Replace direct Supabase calls** in components
- [ ] **Update forms** to use service hooks
- [ ] **Add loading states** and error handling
- [ ] **Implement caching** strategies

### **Phase 4: Advanced Features**
- [ ] **Optimistic updates** - Immediate UI feedback
- [ ] **Background sync** - Offline support
- [ ] **Real-time subscriptions** - Live data updates
- [ ] **Advanced caching** - Redis integration

## 🎯 **Benefits**

### **For Developers**
- **Consistent patterns** - One way to do data operations
- **Type safety** - Full TypeScript support
- **Error handling** - Standardized error responses
- **Testing** - Easy to mock and test
- **Documentation** - Self-documenting interfaces

### **For Users**
- **Better UX** - Consistent loading states and error messages
- **Faster performance** - Built-in caching
- **Reliability** - Robust error handling
- **Real-time updates** - Live data synchronization

### **For the Application**
- **Maintainability** - Centralized data logic
- **Scalability** - Easy to add new services
- **Performance** - Optimized data fetching
- **Security** - Centralized validation and sanitization

## 🚀 **Next Steps**

1. **Migrate CompanyService** - Complete company management
2. **Update components** - Replace direct Supabase calls
3. **Add more services** - Analytics, integrations, etc.
4. **Implement advanced features** - Caching, real-time, etc.

**The service layer provides a solid foundation for scalable, maintainable data operations!** 🏆 