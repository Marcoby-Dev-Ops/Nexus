# 🚀 Component Migration Guide

**Last Updated**: January 2025  
**Status**: ✅ **MIGRATION IN PROGRESS**  
**Version**: 2.0 - Service Layer Architecture

---

## 📋 **Migration Status**

### ✅ **Completed Migrations**
- `CompanyProfilePage.tsx` → Uses `CompanyService` hooks
- `AccountSettings.tsx` (settings) → Uses `UserService` hooks
- `Profile.tsx` → Uses `UserService` hooks
- `SecuritySettings.tsx` → Uses `UserService` hooks
- `TeamSettings.tsx` → Uses `UserService` hooks

### 🔄 **Next Priority Migrations**
- `BillingSettings.tsx` → Use `BillingService` hooks (when created)
- Integration pages → Use `IntegrationService` hooks (when created)
- Analytics pages → Use `AnalyticsService` hooks (when created)

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

### **4. Form Validation**
- **Before**: Manual validation logic
- **After**: Zod schema validation with automatic error display
- **Improvement**: Consistent validation across all forms

---

## 📝 **Migration Examples**

### **Example 1: AccountSettings.tsx**

**Before:**
```typescript
const { user } = useAuth();
const [formData, setFormData] = useState({
  firstName: user?.first_name || '',
  lastName: user?.last_name || '',
  email: user?.email || '',
  phone: user?.phone || '',
});

const handleSave = async () => {
  setLoading(true);
  try {
    // TODO: Implement actual profile update
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMessage({ type: 'success', text: 'Profile updated successfully!' });
  } catch (error) {
    setMessage({ type: 'error', text: 'Failed to update profile.' });
  } finally {
    setLoading(false);
  }
};
```

**After:**
```typescript
const userService = useService('user');
const { data: userProfile, isLoading } = userService.useGet(user?.id || '');
const { mutate: updateUser, isLoading: isUpdating } = userService.useUpdate();

const { form, handleSubmit, isSubmitting } = useFormWithValidation({
  schema: userProfileSchema,
  onSubmit: async (data) => {
    await updateUser(user.id, data);
  },
  successMessage: 'Profile updated successfully!',
});
```

### **Example 2: Profile.tsx**

**Before:**
```typescript
const [formData, setFormData] = useState<Partial<UserProfile>>(() => 
  convertDbProfileToUserProfile(user?.profile as DatabaseProfile)
);

const handleSave = async () => {
  setIsSaving(true);
  try {
    await DatabaseService.updateUserProfile(user.id, formData);
    setSaveMessage('Profile updated successfully!');
  } catch (error) {
    setSaveMessage('Failed to update profile.');
  } finally {
    setIsSaving(false);
  }
};
```

**After:**
```typescript
const userService = useService('user');
const { data: userProfile, isLoading } = userService.useGet(user?.id || '');
const { mutate: updateUser, isLoading: isUpdating } = userService.useUpdate();

const { form, handleSubmit, isSubmitting } = useFormWithValidation({
  schema: userProfileSchema,
  onSubmit: async (data) => {
    await updateUser(user.id, data);
  },
  successMessage: 'Profile updated successfully!',
});
```

### **Example 3: SecuritySettings.tsx**

**Before:**
```typescript
const handlePasswordChange = async () => {
  if (newPassword !== confirmPassword) {
    toast.error('New passwords do not match');
    return;
  }
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success('Password changed successfully');
  } catch (error) {
    toast.error('Failed to change password');
  }
};
```

**After:**
```typescript
const { form, handleSubmit, isSubmitting } = useFormWithValidation({
  schema: passwordChangeSchema,
  onSubmit: async (data) => {
    await updateUser(user.id, { password: data.newPassword });
  },
  successMessage: 'Password updated successfully!',
});
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
2. ✅ Migrate `AccountSettings.tsx` (COMPLETED)
3. ✅ Migrate `Profile.tsx` (COMPLETED)
4. ✅ Migrate `SecuritySettings.tsx` (COMPLETED)
5. ✅ Migrate `TeamSettings.tsx` (COMPLETED)

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

## 📊 **Current Implementation Status**

### **✅ Completed Features**
- **Service Registry**: `ServiceRegistry.ts` with 6 registered services
- **Service Hooks**: `useService.ts` with comprehensive HTTP methods
- **Component Migrations**: 5 components successfully migrated
- **Error Handling**: Automatic error handling with toast notifications
- **Loading States**: Automatic loading state management
- **Type Safety**: Full TypeScript support with proper interfaces

### **🔄 Active Usage**
- **Service Registry**: Used by multiple components and services
- **useService Hook**: Active in migrated components
- **Migration Pattern**: Established and documented
- **Error Prevention**: Consistent error handling across components

### **🎯 Next Steps**
1. **Complete Billing Migration**: Migrate BillingSettings component
2. **Integration Services**: Create and migrate integration components
3. **Analytics Services**: Create and migrate analytics components
4. **Performance Optimization**: Add caching and optimistic updates

---

## 📚 **Resources**

- **Service Architecture**: `docs/current/services/SERVICE_LAYER_ARCHITECTURE.md`
- **Service Hooks**: `src/shared/hooks/useService.ts`
- **Service Registry**: `src/core/services/ServiceRegistry.ts`
- **Migration Summary**: `docs/current/services/SERVICE_LAYER_CLEANUP_SUMMARY.md`

---

**Status**: ✅ **MIGRATION IN PROGRESS - READY FOR ADDITIONAL SERVICES**

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Next Review**: March 2025

*This guide ensures consistent migration to the service layer architecture, reducing boilerplate and improving maintainability.*
