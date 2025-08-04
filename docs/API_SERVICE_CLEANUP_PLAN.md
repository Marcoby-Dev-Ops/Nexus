# API/Service Layer Cleanup Plan

## 🎯 **Current State Analysis**

### ✅ **What's Working Well**
- **Supabase Integration**: Centralized client in `src/lib/supabase.ts`
- **Base Service Pattern**: `BaseService.ts` provides common functionality
- **Error Handling**: `handleSupabaseError` utility for consistent error handling
- **Type Safety**: TypeScript types generated from Supabase schema

### 🚨 **Issues Found**

#### 1. **Service Organization Inconsistencies**
- **Scattered Services**: Services spread across `src/services/` and `src/core/services/`
- **Mixed Patterns**: Some services extend `BaseService`, others are standalone
- **Duplicate Logic**: Similar API calls repeated across services

#### 2. **Data Fetching Patterns**
- **Direct Supabase Calls**: Some components call Supabase directly instead of using services
- **Inconsistent Error Handling**: Different error handling patterns across services
- **Missing Caching**: No centralized caching strategy

#### 3. **Service Architecture Gaps**
- **No Service Registry**: No central place to discover available services
- **Missing Service Interfaces**: Inconsistent service method signatures
- **No Request/Response Types**: Missing standardized data transfer objects

---

## 🛠️ **Cleanup Strategy**

### **Phase 1: Standardize Service Architecture**

#### 1.1 Create Service Registry
```typescript
// src/core/services/ServiceRegistry.ts
export interface ServiceRegistry {
  user: UserService;
  auth: AuthService;
  company: CompanyService;
  analytics: AnalyticsService;
  // ... other services
}

export const serviceRegistry: ServiceRegistry = {
  user: userService,
  auth: authService,
  company: companyService,
  analytics: analyticsService,
  // ... other services
};
```

#### 1.2 Standardize Service Interfaces
```typescript
// src/core/services/interfaces.ts
export interface BaseServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  metadata?: Record<string, any>;
}

export interface ServiceInterface<T> {
  get(id: string): Promise<BaseServiceResponse<T>>;
  create(data: Partial<T>): Promise<BaseServiceResponse<T>>;
  update(id: string, data: Partial<T>): Promise<BaseServiceResponse<T>>;
  delete(id: string): Promise<BaseServiceResponse<boolean>>;
  list(filters?: Record<string, any>): Promise<BaseServiceResponse<T[]>>;
}
```

#### 1.3 Create Service Factory
```typescript
// src/core/services/ServiceFactory.ts
export class ServiceFactory {
  private static instance: ServiceFactory;
  private services: Map<string, any> = new Map();

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service;
  }
}
```

### **Phase 2: Consolidate Service Layer**

#### 2.1 Create Unified Service Base
```typescript
// src/core/services/UnifiedService.ts
export abstract class UnifiedService<T> implements ServiceInterface<T> {
  protected abstract tableName: string;
  protected abstract schema: z.ZodSchema<T>;

  async get(id: string): Promise<BaseServiceResponse<T>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return {
        data: this.schema.parse(data),
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: handleSupabaseError(error, `get ${this.tableName}`),
        success: false
      };
    }
  }

  // ... other CRUD methods
}
```

#### 2.2 Create Service Hooks
```typescript
// src/shared/hooks/useService.ts
export const useService = <T>(serviceName: string) => {
  const service = ServiceFactory.getInstance().get(serviceName);
  
  const useGet = (id: string) => {
    return useQuery({
      queryKey: [serviceName, 'get', id],
      queryFn: () => service.get(id),
    });
  };

  const useList = (filters?: Record<string, any>) => {
    return useQuery({
      queryKey: [serviceName, 'list', filters],
      queryFn: () => service.list(filters),
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data: Partial<T>) => service.create(data),
    });
  };

  return { useGet, useList, useCreate };
};
```

### **Phase 3: Migrate Existing Services**

#### 3.1 Service Migration Checklist
- [ ] **UserService**: Migrate to `UnifiedService<User>`
- [ ] **CompanyService**: Create and migrate
- [ ] **AnalyticsService**: Consolidate analytics services
- [ ] **IntegrationService**: Standardize integration patterns

#### 3.2 Component Migration Checklist
- [ ] Replace direct Supabase calls with service calls
- [ ] Update components to use service hooks
- [ ] Implement consistent error handling
- [ ] Add loading states and caching

---

## 📋 **Implementation Steps**

### **Step 1: Create Foundation (Week 1)**
1. Create `src/core/services/ServiceRegistry.ts`
2. Create `src/core/services/interfaces.ts`
3. Create `src/core/services/ServiceFactory.ts`
4. Create `src/core/services/UnifiedService.ts`

### **Step 2: Create Service Hooks (Week 2)**
1. Create `src/shared/hooks/useService.ts`
2. Create `src/shared/hooks/useServiceMutation.ts`
3. Create `src/shared/hooks/useServiceQuery.ts`

### **Step 3: Migrate Core Services (Week 3)**
1. Migrate `UserService` to new patterns
2. Create `CompanyService` with unified patterns
3. Consolidate analytics services

### **Step 4: Update Components (Week 4)**
1. Replace direct Supabase calls in components
2. Update forms to use service hooks
3. Implement consistent error handling

---

## 🎯 **Success Metrics**

### **Before Cleanup**
- ❌ Scattered service organization
- ❌ Inconsistent service patterns
- ❌ Direct Supabase calls in components
- ❌ Mixed error handling approaches
- ❌ No centralized caching

### **After Cleanup**
- ✅ Centralized service registry
- ✅ Consistent service interfaces
- ✅ Service hooks for components
- ✅ Unified error handling
- ✅ Centralized caching strategy
- ✅ Type-safe service calls

---

## 🚀 **Next Steps**

1. **Start with Foundation**: Create the service architecture
2. **Migrate one service at a time**: Begin with UserService
3. **Update components gradually**: Replace direct calls with service hooks
4. **Add comprehensive testing**: Ensure no regressions

**Ready to begin Phase 1?** Let me know and I'll start implementing the service architecture! 