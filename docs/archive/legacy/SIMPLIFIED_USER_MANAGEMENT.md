# Simplified User Management System

## 🎯 **Problem: Overengineering**

The current user management system is overengineered with:
- 6+ overlapping hooks
- Complex service layers
- Redundant functionality
- Excessive state management

## ✅ **Simplified Solution**

### **1. Single User Hook**
```typescript
// src/hooks/useUser.ts
export function useUser() {
  const { user, session } = useAuth();
  
  return {
    // Basic user data
    user,
    session,
    isAuthenticated: !!user,
    
    // Profile management
    profile: user?.user_metadata,
    updateProfile: async (updates) => {
      // Simple Supabase call
    },
    
    // Company data
    company: user?.user_metadata?.company,
    updateCompany: async (updates) => {
      // Simple Supabase call
    },
    
    // Loading states
    loading: !user && !session,
    error: null
  };
}
```

### **2. Simple Service Layer**
```typescript
// src/services/userService.ts
export const userService = {
  // Basic CRUD operations
  getUser: async (userId) => { /* simple Supabase call */ },
  updateUser: async (userId, updates) => { /* simple Supabase call */ },
  getUserCompany: async (userId) => { /* simple Supabase call */ },
  
  // No complex business logic
  // No multiple layers
  // No excessive error handling
};
```

### **3. Minimal State Management**
```typescript
// Use React Query for caching
const { data: user, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => userService.getUser(userId)
});
```

## 🗑️ **What to Remove**

### **Delete These Files:**
- `src/shared/hooks/useUserManagement.ts` (649 lines)
- `src/shared/hooks/useCompanyManagement.ts` (796 lines)
- `src/shared/hooks/useCompanyOwnership.ts` (172 lines)
- `src/shared/hooks/useCompanyProvisioning.ts` (105 lines)
- `src/core/services/CompanyProvisioningService.ts` (270 lines)
- `src/core/services/CompanyOwnershipService.ts` (241 lines)

### **Simplify These Files:**
- `src/shared/hooks/useUserProfile.ts` → Merge into `useUser`
- `src/core/services/userProfileService.ts` → Simplify to basic CRUD

## 🎯 **Benefits**

### **1. Simplicity**
- One hook for all user operations
- Clear, predictable API
- Easy to understand and debug

### **2. Performance**
- Less code = faster loading
- Fewer re-renders
- Simpler state management

### **3. Maintainability**
- Single source of truth
- Fewer bugs
- Easier to test

### **4. Developer Experience**
- Familiar patterns
- Less cognitive overhead
- Faster development

## 📋 **Migration Plan**

### **Phase 1: Create Simplified Hook**
1. Create new `useUser` hook
2. Add basic CRUD operations
3. Test with existing components

### **Phase 2: Update Components**
1. Replace complex hooks with simple `useUser`
2. Remove redundant state management
3. Simplify error handling

### **Phase 3: Clean Up**
1. Delete overengineered files
2. Remove unused services
3. Update documentation

## 🎯 **Result**

Instead of 6+ hooks and complex services, we'll have:
- **1 simple hook** (`useUser`)
- **1 simple service** (`userService`)
- **Clear, predictable API**
- **Easy to maintain and extend** 