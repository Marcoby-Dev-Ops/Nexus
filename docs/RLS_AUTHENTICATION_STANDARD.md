# Nexus RLS Authentication Standard

## **🎯 Standard Authentication Patterns**

### **Pattern 1: Direct User Ownership**
For tables where users directly own records:
```sql
-- Standard pattern for user-owned data
(auth.uid() = user_id)
```

**Tables using this pattern:**
- `ai_conversations` (user_id)
- `ai_messages` (via conversation.user_id)
- `thoughts` (user_id)
- `user_integrations` (user_id)
- `user_billing_plans` (user_id)

### **Pattern 2: Profile-Based Access**
For tables that reference user_profiles:
```sql
-- Standard pattern for profile-based access
(auth.uid() = id)
```

**Tables using this pattern:**
- `user_profiles` (id matches auth.uid())

### **Pattern 3: Company-Based Access**
For tables that belong to a company:
```sql
-- Standard pattern for company-based access
(company_id IN (
  SELECT company_id 
  FROM user_profiles 
  WHERE user_profiles.id = auth.uid()
))
```

**Tables using this pattern:**
- `companies` (via user_profiles.company_id)
- `company_status` (company_id)
- `business_profiles` (org_id)

### **Pattern 4: Integration-Based Access**
For tables that belong to user integrations:
```sql
-- Standard pattern for integration-based access
(user_integration_id IN (
  SELECT id 
  FROM user_integrations 
  WHERE user_integrations.user_id = auth.uid()
))
```

**Tables using this pattern:**
- `integration_data` (user_integration_id)
- `integration_sync_logs` (user_integration_id)

### **Pattern 5: Authenticated User Access**
For public data that requires authentication:
```sql
-- Standard pattern for authenticated access
(auth.role() = 'authenticated')
```

**Tables using this pattern:**
- `integrations` (public integration catalog)
- `ai_action_card_templates` (public templates)

### **Pattern 6: Anonymous Access**
For truly public data:
```sql
-- Standard pattern for anonymous access
true
```

**Tables using this pattern:**
- `billing_plans` (public pricing)
- `integration_status` (public status)

## **🔧 Standard RLS Policy Template**

### **For User-Owned Tables:**
```sql
-- INSERT: Allow authenticated users to insert
CREATE POLICY "Users can insert own data" ON table_name 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- SELECT: Allow users to read their own data
CREATE POLICY "Users can read own data" ON table_name 
FOR SELECT USING (auth.uid() = user_id);

-- UPDATE: Allow users to update their own data
CREATE POLICY "Users can update own data" ON table_name 
FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Allow users to delete their own data
CREATE POLICY "Users can delete own data" ON table_name 
FOR DELETE USING (auth.uid() = user_id);
```

### **For Company-Based Tables:**
```sql
-- INSERT: Allow authenticated users to insert
CREATE POLICY "Users can insert company data" ON table_name 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- SELECT: Allow users to read their company's data
CREATE POLICY "Users can read company data" ON table_name 
FOR SELECT USING (
  company_id IN (
    SELECT company_id 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  )
);

-- UPDATE: Allow users to update their company's data
CREATE POLICY "Users can update company data" ON table_name 
FOR UPDATE USING (
  company_id IN (
    SELECT company_id 
    FROM user_profiles 
    WHERE user_profiles.id = auth.uid()
  )
);
```

## **🚨 Current Issues to Fix**

### **1. Inconsistent Column Names**
- Some tables use `user_id`
- Others use `id` (user_profiles)
- Others use complex relationships

### **2. Mixed Authentication Strategies**
- Some use direct ownership
- Others use company-based access
- Others use integration-based access

### **3. Duplicate Policies**
- Multiple policies for same operations
- Conflicting conditions
- Inconsistent naming

### **4. Missing Fallbacks**
- No handling for `auth.uid() IS NULL`
- No graceful degradation
- No testing-friendly policies

## **📋 Implementation Checklist**

### **Phase 1: Clean Up Duplicates** ✅
- [x] Remove duplicate user_profiles policies
- [x] Remove duplicate ai_insights policies
- [x] Remove duplicate billing_plans policies
- [x] Remove duplicate integration_status policies
- [x] Remove duplicate user_billing_plans policies

### **Phase 2: Standardize Patterns**
- [ ] Update all tables to use consistent patterns
- [ ] Standardize column names where possible
- [ ] Add proper fallbacks for testing
- [ ] Ensure all policies follow templates

### **Phase 3: Testing & Validation**
- [ ] Test all CRUD operations
- [ ] Verify authentication flows
- [ ] Test edge cases (null auth, expired sessions)
- [ ] Validate performance impact

## **🔍 Table-Specific Recommendations**

### **user_profiles**
- ✅ Already standardized (uses `id = auth.uid()`)
- ✅ Has proper fallback for testing

### **user_integrations**
- ✅ Already standardized (uses `user_id = auth.uid()`)
- ✅ Has proper fallback for testing

### **companies**
- ⚠️ Uses complex subquery pattern
- ⚠️ Consider simplifying to direct ownership

### **company_status**
- ⚠️ Uses complex subquery pattern
- ⚠️ Consider simplifying to direct ownership

### **business_profiles**
- ⚠️ Uses complex subquery pattern
- ⚠️ Consider simplifying to direct ownership

### **ai_conversations & ai_messages**
- ✅ Already standardized
- ✅ Good pattern to follow

### **thoughts**
- ✅ Already standardized
- ✅ Good pattern to follow

## **🎯 Next Steps**

1. **Standardize company-based tables** to use simpler patterns
2. **Add consistent fallbacks** for testing scenarios
3. **Test all authentication flows** thoroughly
4. **Document any deviations** from standard patterns
5. **Create automated tests** for RLS policies 