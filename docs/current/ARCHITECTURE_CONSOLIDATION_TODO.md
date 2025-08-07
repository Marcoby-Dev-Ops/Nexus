# 🏗️ **Architecture Consolidation - Master TODO List**

## 🎯 **Objective**
Consolidate all database operations to follow the **BaseService pattern** and eliminate the deprecated `supabase-compatibility` layer. This ensures consistent error handling, logging, validation, and retry logic across the entire codebase.

---

## 📋 **Phase 1: Service Layer Migration**

### **Priority 1: Core Services (High Impact)**
- [x] **`src/core/auth/AuthService.ts`** - Migrate to use `SupabaseService` instead of direct helper functions ✅
- [ ] **`src/core/adapters/adapterRegistry.ts`** - Replace direct helper calls with service pattern
- [x] **`src/core/auth/OAuthTokenService.ts`** - Already using helpers, migrate to service pattern ✅ (In Progress)
- [ ] **`src/core/database/DatabaseService.ts`** - Update to use `SupabaseService` consistently
- [ ] **`src/core/database/queryWrapper.ts`** - Already using service pattern ✅

### **Priority 2: Business Services**
- [ ] **`src/business/services/domainAnalysisService.ts`** - Migrate from compatibility helpers to service pattern
- [ ] **`src/shared/lib/business/businessProfileService.ts`** - Update to use `SupabaseService` consistently
- [ ] **`src/services/integrations/DataPointDictionaryService.ts`** - Migrate sessionUtils to service pattern
- [ ] **`src/services/integrations/integrationService.ts`** - Migrate sessionUtils to service pattern
- [ ] **`src/services/integrations/integrationDataService.ts`** - Migrate sessionUtils to service pattern
- [ ] **`src/services/integrations/consolidatedIntegrationService.ts`** - Migrate sessionUtils to service pattern

### **Priority 3: Shared Components & Hooks**
- [ ] **`src/shared/widgets/hooks/useWidgetAnalytics.ts`** - Replace `insertOne` with service pattern
- [ ] **`src/shared/utils/ensureUserProfile.ts`** - Replace helper functions with service pattern
- [ ] **`src/shared/ui/components/SecurityStatus.tsx`** - Replace `select` with service pattern
- [ ] **`src/shared/hooks/useUserProfile.ts`** - Replace helper functions with service pattern
- [ ] **`src/shared/stores/organizationStore.ts`** - Replace helper functions with service pattern

---

## 📋 **Phase 2: Direct Supabase Call Elimination**

### **Priority 1: Service Files**
- [ ] **`src/core/services/workflowService.ts`** - Replace direct `.select()` calls with service pattern
- [ ] **`src/core/services/UserLicensesService.ts`** - Replace direct `.select()` calls with service pattern
- [ ] **`src/core/services/PersonalThoughtsService.ts`** - Replace direct `.select()` calls with service pattern
- [ ] **`src/core/services/PersonalAutomationsService.ts`** - Replace direct `.select()` calls with service pattern
- [ ] **`src/core/services/ChatUsageTrackingService.ts`** - Replace direct `.select()` calls with service pattern

### **Priority 2: Page Components**
- [ ] **`src/pages/analytics/IntegrationsPage.tsx`** - Replace direct `.select()` calls
- [ ] **`src/pages/analytics/DataWarehouseHome.tsx`** - Replace direct `.select()` calls
- [ ] **`src/pages/integrations/IntegrationMarketplacePage.tsx`** - Replace direct `.select()` calls

---

## 📋 **Phase 3: Edge Functions & Supabase Functions**

### **Priority 1: Edge Functions**
- [ ] **`supabase/functions/_shared/database.ts`** - Update to use service pattern
- [ ] **`supabase/functions/workspace-items/index.ts`** - Replace direct `.select()` calls
- [ ] **`supabase/functions/verify-onboarding-completion/index.ts`** - Replace direct `.select()` calls
- [ ] **`supabase/functions/trigger-n8n-workflow/index.ts`** - Replace direct `.select()` calls
- [ ] **`supabase/functions/submit-assessment-response/index.ts`** - Replace direct `.select()` calls
- [ ] **`supabase/functions/stripe-customer-portal/index.ts`** - Replace direct `.select()` calls
- [ ] **`supabase/functions/stripe-checkout-session/index.ts`** - Replace direct `.select()` calls
- [ ] **`supabase/functions/upsert_kpis/index.ts`** - Replace direct `.select()` calls

---

## 📋 **Phase 4: Infrastructure & Cleanup**

### **Priority 1: Remove Deprecated Layer**
- [ ] **Delete `src/lib/supabase-compatibility.ts`** - After all migrations complete
- [ ] **Update `src/lib/supabase.ts`** - Add direct exports from `SupabaseService` if needed
- [ ] **Update all import statements** - Remove references to compatibility layer

### **Priority 2: Testing & Validation**
- [ ] **Update test files** - Ensure all tests use service pattern
- [ ] **Run comprehensive linting** - Verify no direct Supabase calls remain
- [ ] **Performance testing** - Ensure service layer doesn't impact performance
- [ ] **Integration testing** - Verify all database operations work correctly

---

## 🎯 **Migration Pattern**

### **Before (Deprecated Pattern)**
```typescript
import { select, insertOne, updateOne } from '@/lib/supabase-compatibility';

// Direct helper calls
const { data, error } = await select('table_name', '*', { filter: 'value' });
const { data, error } = await insertOne('table_name', data);
```

### **After (BaseService Pattern)**
```typescript
import { SupabaseService } from '@/core/services/SupabaseService';

export class MyService extends BaseService {
  private supabaseService = SupabaseService.getInstance();

  async myMethod(): Promise<ServiceResponse<T>> {
    return this.executeDbOperation(async () => {
      const { data, error } = await this.supabaseService.select('table_name', '*', { filter: 'value' });
      
      if (error) {
        this.logger.error('Operation failed:', error);
        return { data: null, error: 'Operation failed' };
      }
      
      return { data, error: null };
    }, 'myMethod');
  }
}
```

---

## 📊 **Progress Tracking**

### **Completed ✅**
- BaseService pattern established
- SupabaseService implemented
- Initial service migrations completed

### **In Progress 🔄**
- Direct Supabase call elimination
- Service layer consolidation

### **Remaining 📋**
- 15+ files need service pattern migration
- 20+ files need direct call elimination
- Edge functions need updates
- Compatibility layer removal

---

## 🚨 **Critical Rules**

1. **No direct Supabase calls** - All database operations must go through service layer
2. **Consistent error handling** - Use `BaseService.executeDbOperation` for all DB operations
3. **Proper logging** - Use `this.logger` from BaseService
4. **Parameter validation** - Use `validateIdParam`, `validateRequiredParam` methods
5. **ServiceResponse pattern** - All public methods must return `ServiceResponse<T>`

---

## 📝 **Notes**

- **Estimated effort**: 2-3 days for complete migration
- **Risk level**: Medium (requires careful testing)
- **Dependencies**: All services must be migrated before removing compatibility layer
- **Testing**: Each migration requires comprehensive testing to ensure no regressions

---

*Last updated: 2025-01-27*
