# Authentication System Migration Guide

## 🚨 **CRITICAL: This Problem WILL Recur Without Complete Migration**

The new authentication system is only partially implemented. There are **50+ direct Supabase calls** throughout the codebase that bypass our SessionManager, which means the authentication issues **WILL recur**.

## 📋 **Migration Checklist**

### ✅ **Completed**
- [x] SessionManager implementation
- [x] DatabaseQueryWrapper implementation  
- [x] AuthError system
- [x] RLS policy updates
- [x] Auth store integration

### ❌ **Still Need to Complete**
- [ ] Migrate all direct `supabase.from()` calls
- [ ] Update service layer calls
- [ ] Update hook implementations
- [ ] Update component data fetching
- [ ] Update edge functions

## 🔧 **Migration Patterns**

### **Before (Problematic)**
```typescript
// Direct call - WILL FAIL with auth issues
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### **After (Fixed)**
```typescript
// Using DatabaseQueryWrapper
const queryWrapper = new DatabaseQueryWrapper();
const { data, error } = await queryWrapper.getUserProfile(userId);
```

## 📁 **Files That Need Migration**

### **High Priority (Core Services)**
1. `src/core/services/dataService.ts` - Line 223
2. `src/core/services/supabaseDebugService.ts` - Line 30
3. `src/domains/ai/lib/contextualRAG.ts` - Line 384
4. `src/domains/ai/lib/profileContextService.ts` - Line 26
5. `src/shared/hooks/useUserManagement.ts` - Line 90
6. `src/shared/hooks/useCompanyManagement.ts` - Line 159

### **Medium Priority (Domain Services)**
1. `src/domains/admin/onboarding/services/profileService.ts` - Line 70
2. `src/domains/admin/services/profileContextService.ts` - Line 31
3. `src/domains/admin/onboarding/services/onboardingVerificationService.ts` - Line 112
4. `src/domains/admin/onboarding/hooks/useOnboarding.ts` - Line 159
5. `src/domains/integrations/components/UnifiedClientProfilesView.tsx` - Line 85

### **Low Priority (Components & Utilities)**
1. `src/shared/components/debug/SupabaseTest.tsx` - Line 1
2. `src/shared/lib/business/businessProfileService.ts` - Line 25

## 🛠️ **Migration Steps**

### **Step 1: Update Service Layer**
Replace direct Supabase calls in services with DatabaseQueryWrapper:

```typescript
// OLD
export class DataService {
  async fetchUserProfile(userId: string) {
    return this.fetchFromSupabase('user_profiles', `id=eq.${userId}&select=*`);
  }
}

// NEW
export class DataService {
  private queryWrapper = new DatabaseQueryWrapper();
  
  async fetchUserProfile(userId: string) {
    return this.queryWrapper.getUserProfile(userId);
  }
}
```

### **Step 2: Update Hooks**
Replace direct calls in hooks:

```typescript
// OLD
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// NEW
const queryWrapper = new DatabaseQueryWrapper();
const { data, error } = await queryWrapper.getUserProfile(user.id);
```

### **Step 3: Update Components**
Replace direct calls in components:

```typescript
// OLD
const { data, error } = await supabase
  .from('ai_unified_client_profiles')
  .select('*')
  .eq('user_id', user!.id);

// NEW
const queryWrapper = new DatabaseQueryWrapper();
const { data, error } = await queryWrapper.userQuery(
  async () => supabase
    .from('ai_unified_client_profiles')
    .select('*')
    .eq('user_id', user!.id),
  user!.id,
  'fetch-client-profiles'
);
```

## 🧪 **Testing Strategy**

### **1. Unit Tests**
```typescript
// Test each migrated function
describe('DataService', () => {
  it('should fetch user profile with proper authentication', async () => {
    const service = new DataService();
    const result = await service.fetchUserProfile('test-user-id');
    expect(result.error).toBeNull();
  });
});
```

### **2. Integration Tests**
```typescript
// Test the complete flow
describe('Authentication Flow', () => {
  it('should handle session properly', async () => {
    const sessionManager = SessionManager.getInstance();
    const session = await sessionManager.ensureSession();
    expect(session.user.id).toBeDefined();
  });
});
```

### **3. Manual Testing**
Use the AuthTest component to verify:
- Session establishment
- Database queries
- Error handling

## 🚀 **Implementation Priority**

### **Phase 1: Critical Services (Week 1)**
1. `src/core/services/dataService.ts`
2. `src/core/services/supabaseDebugService.ts`
3. `src/shared/hooks/useUserManagement.ts`

### **Phase 2: Domain Services (Week 2)**
1. `src/domains/ai/lib/contextualRAG.ts`
2. `src/domains/admin/services/profileContextService.ts`
3. `src/domains/integrations/components/UnifiedClientProfilesView.tsx`

### **Phase 3: Components & Utilities (Week 3)**
1. All remaining component files
2. Edge functions
3. Utility services

## ⚠️ **Common Pitfalls**

### **1. Forgetting Error Handling**
```typescript
// BAD
const { data } = await queryWrapper.getUserProfile(userId);

// GOOD
const { data, error } = await queryWrapper.getUserProfile(userId);
if (error) {
  logger.error('Failed to fetch profile:', error);
  return null;
}
```

### **2. Not Using Proper Context**
```typescript
// BAD
const { data } = await queryWrapper.query(() => supabase.from('table').select());

// GOOD
const { data } = await queryWrapper.query(
  () => supabase.from('table').select(),
  { context: 'specific-operation' }
);
```

### **3. Ignoring Session State**
```typescript
// BAD
if (!user) return;

// GOOD
const sessionManager = SessionManager.getInstance();
const session = await sessionManager.ensureSession();
if (!session) return;
```

## 📊 **Success Metrics**

- [ ] Zero direct `supabase.from()` calls in codebase
- [ ] All database operations go through DatabaseQueryWrapper
- [ ] Session validation before every database operation
- [ ] Proper error handling for all auth failures
- [ ] Comprehensive logging for debugging

## 🔍 **Verification Commands**

```bash
# Find all remaining direct Supabase calls
grep -r "supabase\.from" src/ --exclude-dir=node_modules

# Find all DatabaseQueryWrapper usage
grep -r "DatabaseQueryWrapper" src/ --exclude-dir=node_modules

# Test authentication system
pnpm run test:auth
```

## 🎯 **Expected Outcome**

After complete migration:
- ✅ No more `auth.uid()` returning null
- ✅ No more RLS policy failures
- ✅ Consistent authentication across all operations
- ✅ Proper session management
- ✅ Comprehensive error handling
- ✅ Better debugging capabilities

**This migration is CRITICAL to prevent the authentication issues from recurring.** 