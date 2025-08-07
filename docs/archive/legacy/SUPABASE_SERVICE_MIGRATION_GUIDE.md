# 🔄 **Supabase Service Migration Guide**

> **Why:** We're standardizing all Supabase access on a single, robust service pattern for reliability, maintainability, and observability. This eliminates TypeScript errors, provides automatic retry logic, and ensures consistent error handling across the entire application.

## 📋 **Overview**

The Supabase client has been refactored to follow proper service patterns using `BaseService`. This guide helps you migrate from the old utility-based approach to the new service-based approach.

### 🚨 **Important: Compatibility Layer Timeline**

The compatibility layer (`@/lib/supabase-compatibility`) is **temporary** and will be removed in version 2.0. Please migrate all code by then to avoid breaking changes.

**Migration Deadline:** Version 2.0 Release

## 🎯 **Key Changes**

### **Before (Old Pattern)**
```typescript
// Direct imports from supabase.ts
import { select, insertOne, sessionUtils, handleSupabaseError } from '@/lib/supabase';

// Usage
const result = await select('users', '*', { id: userId });
const session = await sessionUtils.getSession();
```

### **After (New Pattern)**
```typescript
// Import the service
import { supabaseService } from '@/core/services/SupabaseService';

// Usage
const result = await supabaseService.select('users', '*', { id: userId });
const session = await supabaseService.sessionUtils.getSession();
```

## 🔧 **Migration Steps**

### **1. Update Imports**

#### **Old Pattern**
```typescript
import { 
  select, 
  selectOne, 
  insertOne, 
  updateOne, 
  deleteOne, 
  sessionUtils, 
  handleSupabaseError,
  callEdgeFunction 
} from '@/lib/supabase';
```

#### **New Pattern**
```typescript
import { supabaseService } from '@/core/services/SupabaseService';
```

### **2. Update Function Calls**

#### **Database Operations**

| Old | New |
|-----|-----|
| `select(table, columns, filter)` | `supabaseService.select(table, columns, filter)` |
| `selectOne(table, id, idColumn)` | `supabaseService.selectOne(table, id, idColumn)` |
| `insertOne(table, data)` | `supabaseService.insertOne(table, data)` |
| `updateOne(table, id, data, idColumn)` | `supabaseService.updateOne(table, id, data, idColumn)` |
| `deleteOne(table, id, idColumn)` | `supabaseService.deleteOne(table, id, idColumn)` |
| `callRPC(functionName, params)` | `supabaseService.callRPC(functionName, params)` |

#### **Session Operations**

| Old | New |
|-----|-----|
| `sessionUtils.getSession()` | `supabaseService.sessionUtils.getSession()` |
| `sessionUtils.getUser()` | `supabaseService.sessionUtils.getUser()` |
| `sessionUtils.refreshSession()` | `supabaseService.sessionUtils.refreshSession()` |
| `sessionUtils.isSessionValid(session)` | `supabaseService.sessionUtils.isSessionValid(session)` |

#### **Edge Functions**

| Old | New |
|-----|-----|
| `callEdgeFunction(name, payload)` | `supabaseService.callEdgeFunction(name, payload)` |

#### **Diagnostic Functions**

| Old | New |
|-----|-----|
| `diagnoseAuthIssues()` | `supabaseService.diagnoseAuthIssues()` |
| `testAndFixSession()` | `supabaseService.testAndFixSession()` |
| `testAuthenticationFlow()` | `supabaseService.testAuthenticationFlow()` |
| `diagnoseJWTTransmission()` | `supabaseService.diagnoseJWTTransmission()` |

#### **Error Handling**

| Old | New |
|-----|-----|
| `handleSupabaseError(error, context)` | `supabaseService.handleError(error, context)` |

### **3. Service Class Pattern**

For new code, consider creating domain-specific services that extend `BaseService`:

```typescript
import { BaseService } from '@/core/services/BaseService';
import { supabase } from '@/lib/supabase';

export class UserService extends BaseService {
  async getUserById(userId: string) {
    return this.executeDbOperation(
      () => supabase.from('users').select('*').eq('id', userId).single(),
      'getUserById'
    );
  }

  async createUser(userData: any) {
    return this.executeDbOperation(
      () => supabase.from('users').insert(userData).select().single(),
      'createUser'
    );
  }
}
```

## 📊 **Migration Examples**

### **Example 1: Database Query**

#### **Before**
```typescript
import { selectOne } from '@/lib/supabase';

const getUserProfile = async (userId: string) => {
  const result = await selectOne('user_profiles', userId);
  if (result.error) {
    console.error('Failed to get user profile:', result.error);
    return null;
  }
  return result.data;
};
```

#### **After**
```typescript
import { supabaseService } from '@/core/services/SupabaseService';

const getUserProfile = async (userId: string) => {
  const result = await supabaseService.selectOne('user_profiles', userId);
  if (result.error) {
    console.error('Failed to get user profile:', result.error);
    return null;
  }
  return result.data;
};
```

### **Example 2: Session Management**

#### **Before**
```typescript
import { sessionUtils } from '@/lib/supabase';

const checkUserSession = async () => {
  const { session, error } = await sessionUtils.getSession();
  if (error || !session) {
    return false;
  }
  return sessionUtils.isSessionValid(session);
};
```

#### **After**
```typescript
import { supabaseService } from '@/core/services/SupabaseService';

const checkUserSession = async () => {
  const { session, error } = await supabaseService.sessionUtils.getSession();
  if (error || !session) {
    return false;
  }
  return supabaseService.sessionUtils.isSessionValid(session);
};
```

### **Example 3: Edge Function Call**

#### **Before**
```typescript
import { callEdgeFunction } from '@/lib/supabase';

const processData = async (data: any) => {
  try {
    const result = await callEdgeFunction('process-data', data);
    return result;
  } catch (error) {
    console.error('Edge function failed:', error);
    throw error;
  }
};
```

#### **After**
```typescript
import { supabaseService } from '@/core/services/SupabaseService';

const processData = async (data: any) => {
  try {
    const result = await supabaseService.callEdgeFunction('process-data', data);
    return result;
  } catch (error) {
    console.error('Edge function failed:', error);
    throw error;
  }
};
```

## 🚀 **Benefits of Migration**

### **1. Enhanced Error Handling**
- Automatic retry logic with exponential backoff
- Standardized error responses with rich metadata
- Better error classification and debugging

### **2. Improved Type Safety**
- Proper TypeScript types for all operations
- Type-safe database table names
- Enhanced IntelliSense support

### **3. Better Logging**
- Consistent logging across all operations
- Service context in log messages
- Enhanced debugging capabilities

### **4. Production Readiness**
- Enterprise-grade error handling
- Rate limiting protection
- Comprehensive monitoring support

## 🔄 **Backward Compatibility**

For existing code that can't be immediately migrated, you can use the compatibility layer:

```typescript
// Import from compatibility layer (deprecated but functional)
import { select, sessionUtils } from '@/lib/supabase-compatibility';

// This will work but shows deprecation warnings
const result = await select('users', '*', { id: userId });
```

> ⚠️ **Warning:** The compatibility layer will be removed in version 2.0. Use this only for temporary migration, not for new code.

## 📋 **Migration Checklist**

- [ ] Update imports to use `supabaseService`
- [ ] Replace direct function calls with service methods
- [ ] Update error handling to use service patterns
- [ ] Test all database operations
- [ ] Test session management
- [ ] Test edge function calls
- [ ] Update any custom error handling
- [ ] Verify logging works correctly

## 🎯 **Best Practices**

### **1. Use Service Classes for Domain Logic**
```typescript
export class UserService extends BaseService {
  async getUserById(userId: string) {
    return this.executeDbOperation(
      () => supabase.from('users').select('*').eq('id', userId).single(),
      'getUserById'
    );
  }
}
```

### **2. Leverage BaseService Features**
```typescript
// Automatic retry for flaky operations
const result = await this.executeDbOperationWithRetry(
  () => supabase.from('users').select('*'),
  'getUsers',
  { maxAttempts: 3 } // retry config object
);
```

### **3. Use Proper Error Handling**
```typescript
const result = await supabaseService.selectOne('users', userId);
if (!result.success) {
  // Handle error using service response
  console.error('Operation failed:', result.error);
  return null;
}
return result.data;
```

### **4. Handle Advanced Type Cases**
```typescript
// For custom table types or complex queries
async getCustomData<T extends Record<string, unknown>>(
  table: keyof Database['public']['Tables'],
  customFilter: Partial<T>
) {
  return this.executeDbOperation(
    async () => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('custom_field', customFilter.custom_field as string);
      return { data, error };
    },
    'getCustomData'
  );
}
```

## 🏆 **Conclusion**

The new service-based approach provides:
- **Better error handling** with automatic retry logic
- **Enhanced type safety** with proper TypeScript support
- **Consistent logging** across all operations
- **Production-ready** architecture with enterprise features
- **Maintainable code** with clear separation of concerns

Migrate your code gradually, starting with the most critical operations, and leverage the compatibility layer for existing code that can't be immediately updated.

---

## 🧐 **Pull Request Review Checklist**

When reviewing code that involves Supabase operations, ensure:

- [ ] **No direct supabase imports** except from `supabaseService`
- [ ] **No usage of deprecated compatibility utilities** from `@/lib/supabase-compatibility`
- [ ] **All queries use a service or `supabaseService`** with proper error handling
- [ ] **Type safety is preserved** for all DB operations
- [ ] **Retry logic is used** for flaky operations (`executeDbOperationWithRetry`)
- [ ] **Service context is provided** in all operation calls
- [ ] **Error handling follows BaseService patterns** (no manual try/catch unless necessary)

### **Quick Reference for Reviewers**

| ✅ **Good** | ❌ **Avoid** |
|-------------|--------------|
| `supabaseService.selectOne('users', id)` | `import { selectOne } from '@/lib/supabase'` |
| `this.executeDbOperation(() => {...}, 'context')` | Manual try/catch with custom error handling |
| `UserService extends BaseService` | Direct supabase client usage in components |
| `{ maxAttempts: 3 }` retry config | Hardcoded retry logic |

---

## 📊 **Migration Progress**

> **Current Status:** 🟡 In Progress  
> **Target:** 🟢 Complete by Version 2.0  
> **Next Milestone:** All new features using service pattern

**Files Migrated:** `[Track your progress here]`  
**Remaining:** `[Count remaining files]`
