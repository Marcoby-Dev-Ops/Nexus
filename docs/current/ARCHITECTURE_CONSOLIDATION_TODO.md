# Architecture Consolidation TODO

## 🔄 **IN PROGRESS: UserContext Migration**

### **Phase 1: High Impact, Low Risk (COMPLETED)**
- [x] **Replace `useUser()` calls** with `useUserContext()` or specific hooks
  - [x] `src/shared/components/OnboardingProgressDashboard.tsx` (line 35) ✅
  - [x] `src/shared/components/OnboardingCompletionChecker.tsx` (line 26) ✅
  - [x] `src/shared/components/layout/Header.tsx` (line 16) ✅
  - [x] `src/shared/components/layout/AppWithOnboarding.tsx` (lines 1991, 2437) ✅
  - [x] `src/components/ai/PersonalMemoryCapture.tsx` (line 44) ✅
- [x] **Replace direct `userService` calls** in admin pages
  - [x] `src/pages/admin/TeamSettings.tsx` (lines 100, 127, 138, 161, 166, 187, 192) ✅
  - [x] `src/pages/admin/SecuritySettings.tsx` (lines 68, 110) ✅
  - [x] `src/pages/admin/Profile.tsx` (lines 157, 209, 213) ✅
  - [x] `src/pages/admin/AccountSettings.tsx` (lines 50, 111, 115) ✅
  - [x] `src/components/admin/user/pages/settings/AccountSettings.tsx` (lines 43, 97, 101) ✅
- [ ] **Replace direct `companyService` calls** in company pages (PENDING - requires CompanyContext)
  - [ ] `src/pages/admin/CompanyProfilePage.tsx` (lines 62, 103)

### **Phase 2: Medium Impact, Medium Risk (COMPLETED)**
- [x] **Replace legacy `useUserProfile` hook** with new context hooks
  - [x] `src/shared/hooks/useUserProfile.ts` (entire file - replace with new context) ✅
  - [x] `src/hooks/auth/useUserProfile.ts` (entire file - replace with new context) ✅
  - [x] `src/components/auth/ProfileForm.tsx` (line 36) ✅
  - [x] `src/pages/admin/OnboardingChecklist.tsx` (line 49 - commented out) ✅
- [x] **Simplify complex user data access** in `useUser.ts` ✅

### **Phase 3: Low Impact, High Risk (PENDING)**
- [ ] **Replace direct property access** patterns
- [ ] **Update complex business logic** that depends on user data

## ✅ **COMPLETED**

- ✅ **UserContext Implementation** - Complete
  - ✅ `src/shared/contexts/UserContext.tsx` - Created with caching and convenience hooks
  - ✅ `src/shared/contexts/UserContext.example.tsx` - Created with migration examples
  - ✅ Integrated `UserProvider` into `src/app/App.tsx`
  - ✅ Fixed `useAuth` error by reordering providers

## 📋 **ORIGINAL TODO ITEMS**

- [ ] **`src/shared/utils/ensureUserProfile.ts`** - Replace helper functions with service pattern
- [ ] **`src/shared/hooks/useUserProfile.ts`** - Replace helper functions with service pattern

## 🏢 **COMPANY CONTEXT TODO**

- [ ] **Create CompanyContext** - Similar to UserContext but for company data
  - [ ] `src/shared/contexts/CompanyContext.tsx` - Create with caching and convenience hooks
  - [ ] `src/shared/contexts/CompanyContext.example.tsx` - Create with usage examples
  - [ ] Integrate `CompanyProvider` into `src/app/App.tsx`
  - [ ] Replace direct `companyService` calls with context hooks
  - [ ] Update company-related components to use context
