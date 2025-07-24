# 🧪 Onboarding Flow Testing Instructions

## ✅ **Issue Resolved**

The import error has been fixed by using type-only imports for the interfaces:
```typescript
import { companyProvisioningService } from '@/core/services/CompanyProvisioningService';
import type { CompanyProvisioningOptions, ProvisioningResult } from '@/core/services/CompanyProvisioningService';
```

## 🚀 **How to Test the Onboarding Flow**

### **Step 1: Force Onboarding Mode**
1. **Open your browser** and navigate to: `http://localhost:5173`
2. **Add the force parameter**: Change the URL to: `http://localhost:5173?force-onboarding=true`
3. **Refresh the page** to trigger the onboarding flow

### **Step 2: Complete Onboarding**
1. **Fill out the Basic Info step**:
   - Enter your first and last name
   - Add a job title
   - Add a company name
   - Click "Continue" (this will create your company)
2. **Complete the remaining steps**:
   - Business Context
   - Integration Discovery
   - AI Capabilities
   - Success

### **Step 3: Verify Company Creation**
1. **Check the browser console** for these logs:
   ```
   [BasicInfoStep] Company created successfully: {companyId}
   [AppWithOnboarding] Company association ensured after onboarding
   ```

2. **Check Supabase database**:
   - Go to your Supabase dashboard
   - Check the `companies` table for a new record
   - Check the `user_profiles` table for your `company_id`

### **Step 4: Verify No More 403 Errors**
1. **Navigate around the app** after completing onboarding
2. **Check that you don't see** any 403 Forbidden errors
3. **Verify that business data loads** properly

## 🔍 **Expected Behavior**

### **During Onboarding:**
- ✅ Company is created automatically during Step 1
- ✅ Button shows "Setting up..." while creating company
- ✅ No errors in the console
- ✅ Smooth transition between steps

### **After Onboarding:**
- ✅ User has a `company_id` in their profile
- ✅ No 403 errors when accessing business data
- ✅ All app features work normally

## 🐛 **Troubleshooting**

### **If you still see import errors:**
1. **Clear browser cache**: Hard refresh (Ctrl+F5)
2. **Clear Vite cache**: Stop dev server and restart
3. **Check console**: Look for any remaining import errors

### **If company creation fails:**
1. **Check Supabase logs**: Look for any database errors
2. **Verify RLS policies**: Ensure the user can create companies
3. **Check network tab**: Look for any failed API calls

## 📊 **Success Criteria**

- ✅ Onboarding flow completes without errors
- ✅ Company is created in the database
- ✅ User profile has `company_id` populated
- ✅ No 403 errors when accessing business data
- ✅ App functionality works normally after onboarding

---

**The onboarding flow with company provisioning is now ready for testing!** 🎉 