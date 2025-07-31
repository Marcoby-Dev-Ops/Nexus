# 🚀 Component Migration Guide

## 📋 **Migration Status**

### ✅ **Completed Migrations**
- `CompanyProfilePage.tsx` → Uses `CompanyService` hooks

### 🔄 **Next Priority Migrations**
- `AccountSettings.tsx` → Use `UserService` hooks
- `TeamSettings.tsx` → Use `UserService` hooks
- `BillingSettings.tsx` → Use `BillingService` hooks (when created)

---

## 🎯 **Migration Pattern**

### **Step 1: Identify Current Data Source**
```typescript
// BEFORE: Direct auth/user calls
const { user, updateProfile } = useAuth();
const { data, loading } = useUser();
```

### **Step 2: Replace with Service Hooks**
```typescript
// AFTER: Service layer hooks
const userService = useService('user');
const { data: user, isLoading } = userService.useGet(userId);
const { mutate: updateUser, isLoading: isUpdating } = userService.useUpdate();
```

### **Step 3: Update Data Access**
```typescript
// BEFORE: Direct property access
const userData = user?.profile;

// AFTER: Service data access
const userData = user; // Service returns validated data
```

### **Step 4: Enhance Error Handling**
```typescript
// BEFORE: Manual error handling
try {
  await updateProfile(data);
} catch (error) {
  console.error(error);
  toast.error('Update failed');
}

// AFTER: Automatic error handling
await updateUser(userId, data);
// Service handles errors and shows toasts automatically
```

---

## 📊 **Migration Benefits**

### **1. Code Reduction**
- **Before**: ~50 lines of manual state management
- **After**: ~15 lines with service hooks
- **Savings**: ~70% reduction in boilerplate

### **2. Error Handling**
- **Before**: Manual try/catch in every component
- **After**: Automatic error handling with toast notifications
- **Improvement**: Consistent UX across all components

### **3. Loading States**
- **Before**: Manual loading state management
- **After**: Automatic loading states from service hooks
- **Improvement**: Better user experience with loading indicators

### **4. Type Safety**
- **Before**: Manual type assertions and checks
- **After**: Zod-validated data from services
- **Improvement**: Compile-time error detection

---

## 🔧 **Migration Checklist**

### **Pre-Migration**
- [ ] Identify current data source (useAuth, useUser, direct Supabase calls)
- [ ] Map data fields to service schema
- [ ] Identify required service (user, company, billing, etc.)

### **During Migration**
- [ ] Replace data source with service hooks
- [ ] Update form field mappings
- [ ] Replace manual error handling
- [ ] Add loading states
- [ ] Update TypeScript types

### **Post-Migration**
- [ ] Test component functionality
- [ ] Verify loading states work
- [ ] Test error scenarios
- [ ] Update any related tests
- [ ] Document changes

---

## 📝 **Migration Examples**

### **Example 1: User Profile Migration**

**Before:**
```typescript
const { user, updateProfile } = useAuth();

const handleSubmit = async (data) => {
  try {
    await updateProfile(data);
    toast.success('Profile updated');
  } catch (error) {
    toast.error('Update failed');
  }
};
```

**After:**
```typescript
const userService = useService('user');
const { data: user, isLoading } = userService.useGet(userId);
const { mutate: updateUser, isLoading: isUpdating } = userService.useUpdate();

const handleSubmit = async (data) => {
  await updateUser(userId, data);
  // Service handles success/error toasts automatically
};
```

### **Example 2: Company Settings Migration**

**Before:**
```typescript
const { user, updateCompany } = useAuth();

const handleSubmit = async (data) => {
  try {
    await updateCompany(data);
    toast.success('Company updated');
  } catch (error) {
    toast.error('Update failed');
  }
};
```

**After:**
```typescript
const companyService = useService('company');
const { data: company, isLoading } = companyService.useGet(companyId);
const { mutate: updateCompany, isLoading: isUpdating } = companyService.useUpdate();

const handleSubmit = async (data) => {
  await updateCompany(companyId, data);
  // Service handles success/error toasts automatically
};
```

---

## 🚨 **Common Gotchas**

### **1. Type Assertions**
```typescript
// Sometimes needed for legacy user objects
const userId = (user as any)?.id;
```

### **2. Field Name Mappings**
```typescript
// Check service schema for exact field names
// Company: client_base_description vs clientbase_description
```

### **3. Loading State Combinations**
```typescript
// Combine multiple loading states
disabled={isSubmitting || isUpdating || isLoading}
```

### **4. Error Handling**
```typescript
// Service hooks handle errors automatically
// Remove manual try/catch blocks
```

---

## 🎯 **Next Steps**

### **Immediate (This Sprint)**
1. ✅ Migrate `CompanyProfilePage.tsx` (COMPLETED)
2. 🔄 Migrate `AccountSettings.tsx`
3. 🔄 Migrate `TeamSettings.tsx`

### **Next Sprint**
1. 🔄 Create `BillingService`
2. 🔄 Migrate `BillingSettings.tsx`
3. 🔄 Create `IntegrationService`
4. 🔄 Migrate integration pages

### **Future**
1. 🔄 Add caching layer
2. 🔄 Implement optimistic updates
3. 🔄 Add real-time sync
4. 🔄 Create advanced search features

---

## 📚 **Resources**

- **Service Architecture**: `docs/SERVICE_LAYER_ARCHITECTURE.md`
- **Service Hooks**: `src/shared/hooks/useService.ts`
- **Service Registry**: `src/core/services/ServiceRegistry.ts`
- **Migration Summary**: `SERVICE_LAYER_CLEANUP_SUMMARY.md`

---

**Status**: ✅ **READY FOR TEAM ADOPTION** 