# 🚫 **Frontend Supabase Direct Calls - Playbook Item**

## 📋 **Issue Description**

**Error**: `403 (Forbidden)` or `permission denied for table` when accessing database tables from frontend components.

**Root Cause**: Frontend components are making direct Supabase calls instead of using the proper service layer architecture.

## 🎯 **The Rule**

> **NEVER call Supabase directly from frontend components**
> 
> All database operations must go through the service layer using `BaseService` pattern.

## ❌ **What NOT to Do**

```typescript
// ❌ WRONG - Direct Supabase call in component
const fetchClientProfiles = async () => {
  const { data, error } = await supabase
    .from('unified_client_profiles')
    .select('*')
    .order('updatedat', { ascending: false });
  
  if (error) {
    console.error('Error fetching client profiles:', error);
  }
  // ...
};
```

## ✅ **What TO Do**

### **1. Create/Use Service Layer**

```typescript
// ✅ CORRECT - Service extends BaseService
export class UnifiedClientService extends BaseService {
  constructor() {
    super();
  }

  async getUnifiedClientProfiles(userId: string): Promise<ServiceResponse<UnifiedClientProfile[]>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabase
        .from('unified_client_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    }, `get unified client profiles for user ${userId}`);
  }
}

// Export singleton instance
export const unifiedClientService = new UnifiedClientService();
```

### **2. Use Service in Component**

```typescript
// ✅ CORRECT - Use service in component
const fetchClientProfiles = async () => {
  try {
    const result = await unifiedClientService.getUnifiedClientProfiles(user!.id);
    
    if (result.success && result.data) {
      setProfiles(result.data);
    } else {
      console.error('Error fetching client profiles:', result.error);
    }
  } catch (error) {
    console.error('Error fetching client profiles:', error);
  }
};
```

## 🔧 **How to Fix Existing Code**

### **Step 1: Identify Direct Supabase Calls**

Search for patterns like:
```bash
grep -r "await supabase" src/
grep -r "supabase.from" src/
```

### **Step 2: Create Service Class**

1. Create service file: `src/services/YourDomainService.ts`
2. Extend `BaseService`
3. Use `this.executeDbOperation()` for database calls
4. Export singleton instance

### **Step 3: Update Component**

1. Import service instance
2. Replace direct Supabase calls with service methods
3. Handle `ServiceResponse<T>` format
4. Check `result.success` before using `result.data`

### **Step 4: Update RLS Policies**

Ensure RLS policies use `user_id` column:
```sql
-- ✅ CORRECT RLS Policy
CREATE POLICY "users_can_access_own_data" ON your_table
    FOR ALL USING (auth.uid() = user_id);
```

## 🏗️ **Service Layer Architecture**

```
Frontend Component
       ↓
Service Layer (extends BaseService)
       ↓
Supabase Client
       ↓
Database
```

## 📚 **Benefits**

- **Security**: Proper authentication and authorization
- **Consistency**: Standardized error handling and logging
- **Maintainability**: Centralized business logic
- **Testing**: Easy to mock and test
- **Type Safety**: Full TypeScript support

## 🚨 **Common Mistakes**

1. **Using static methods** instead of instance methods
2. **Not extending BaseService** in service classes
3. **Direct Supabase imports** in components
4. **Missing user_id** in RLS policies
5. **Not handling ServiceResponse** format

## 🔍 **Verification Checklist**

- [ ] No `import { supabase }` in component files
- [ ] All database operations go through services
- [ ] Services extend `BaseService`
- [ ] Services use `this.executeDbOperation()`
- [ ] Components handle `ServiceResponse<T>` format
- [ ] RLS policies use `auth.uid() = user_id`
- [ ] Service instances are exported as singletons

## 📖 **Related Documentation**

- [BaseService Guide](../current/services/BASESERVICE_COMPLETE_GUIDE.md)
- [Service Layer Architecture](../SERVICE_LAYER_ARCHITECTURE.md)
- [RLS Policies Guide](../database/RLS_POLICIES.md)

---

**Status**: ✅ **ACTIVE**  
**Last Updated**: January 2025  
**Priority**: 🔴 **HIGH** - Security and Architecture Compliance
