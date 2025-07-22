# Nexus RLS Policy Standards

## 🎯 **Goal: Prevent Policy Conflicts**

This document establishes standardized RLS (Row Level Security) policies to prevent the conflicts we experienced with `user_integrations` and `integrations` tables.

## 📋 **Policy Categories**

### **1. User-Owned Tables** (`create_standard_policies`)
- **Pattern**: `auth.uid() = user_id`
- **Use Case**: Personal data, user-specific records
- **Examples**: `user_integrations`, `user_licenses`, `ai_insights`

### **2. Company-Based Tables** (`create_company_policies`)
- **Pattern**: Company-based access through `user_profiles.company_id`
- **Use Case**: Business data shared within a company
- **Examples**: `contacts`, `deals`, `invoices`

### **3. Public Read Tables** (`create_public_read_policies`)
- **Pattern**: Public read, authenticated write
- **Use Case**: Reference data, catalogs
- **Examples**: `billing_plans`, `integrations`

## 🔧 **Standard Policy Structure**

### **User-Owned Tables**
```sql
-- SELECT: Users can read their own data
CREATE POLICY "Users can read own data" ON table_name
    FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can insert their own data
CREATE POLICY "Users can insert own data" ON table_name
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own data
CREATE POLICY "Users can update own data" ON table_name
    FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Users can delete their own data
CREATE POLICY "Users can delete own data" ON table_name
    FOR DELETE USING (auth.uid() = user_id);

-- Service Role: Admin bypass
CREATE POLICY "Service role bypass" ON table_name
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

### **Company-Based Tables**
```sql
-- SELECT: Users can read their company's data
CREATE POLICY "Users can read company data" ON table_name
    FOR SELECT USING (
        company_id IN (
            SELECT company_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Similar patterns for INSERT, UPDATE, DELETE
-- Plus service role bypass
```

### **Public Read Tables**
```sql
-- SELECT: Public read access
CREATE POLICY "Public read access" ON table_name
    FOR SELECT USING (true);

-- INSERT: Authenticated users only
CREATE POLICY "Authenticated users can insert" ON table_name
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Similar patterns for UPDATE, DELETE
-- Plus service role bypass
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Duplicate Policies**
**Problem**: Multiple policies for same operation
**Solution**: Use `drop_all_policies()` before creating new ones

### **Issue 2: Inconsistent Column Names**
**Problem**: `user_id` vs `id` vs `user_id_column`
**Solution**: Standardize column names and use helper functions

### **Issue 3: Join Query Failures**
**Problem**: 403 errors when joining tables
**Solution**: Ensure both tables have compatible policies

### **Issue 4: Service Role Access**
**Problem**: Admin operations blocked
**Solution**: Always include service role bypass policy

## 📝 **Implementation Checklist**

### **For New Tables:**
1. ✅ **Enable RLS**: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. ✅ **Choose Policy Type**: User-owned, Company-based, or Public read
3. ✅ **Use Helper Function**: `create_standard_policies()`, `create_company_policies()`, or `create_public_read_policies()`
4. ✅ **Test Queries**: Verify SELECT, INSERT, UPDATE, DELETE work
5. ✅ **Test Joins**: Verify foreign key relationships work

### **For Existing Tables:**
1. ✅ **Audit Current Policies**: Check for duplicates/conflicts
2. ✅ **Consolidate**: Use helper functions to standardize
3. ✅ **Verify**: Test all operations still work
4. ✅ **Document**: Update this document if needed

## 🔍 **Verification Queries**

### **Check Policy Counts**
```sql
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

### **Check for Duplicates**
```sql
SELECT 
    tablename,
    cmd,
    COUNT(*) as duplicate_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;
```

### **Test User Access**
```sql
-- Test user can read their own data
SELECT * FROM user_integrations WHERE user_id = auth.uid();

-- Test user can read their company's data
SELECT * FROM contacts WHERE company_id IN (
    SELECT company_id FROM user_profiles WHERE id = auth.uid()
);

-- Test public read access
SELECT * FROM integrations LIMIT 1;
```

## 🛠 **Helper Functions**

### **`drop_all_policies(table_name)`**
- Safely removes all policies from a table
- Use before creating new policies to avoid conflicts

### **`create_standard_policies(table_name, user_id_column)`**
- Creates standard user-owned policies
- Handles user_id column variations

### **`create_company_policies(table_name, company_id_column)`**
- Creates company-based access policies
- Links through user_profiles.company_id

### **`create_public_read_policies(table_name)`**
- Creates public read, authenticated write policies
- For reference data and catalogs

## 📚 **Best Practices**

1. **Always use helper functions** instead of manual policy creation
2. **Test joins** when tables have foreign key relationships
3. **Include service role bypass** for admin operations
4. **Document special cases** (like user_profiles using 'id' instead of 'user_id')
5. **Verify policies** after any schema changes
6. **Use consistent naming** for policies across tables

## 🎯 **Success Metrics**

- ✅ **Zero 403 errors** on join queries
- ✅ **Consistent policy counts** (5 policies per table: 4 operations + service role)
- ✅ **No duplicate policies** for same operations
- ✅ **All CRUD operations work** for authenticated users
- ✅ **Admin operations work** via service role
- ✅ **Public read access** works for reference tables

## 🔄 **Maintenance**

### **Monthly Audit**
1. Run verification queries
2. Check for new tables without policies
3. Update this document if needed

### **Before Deployments**
1. Test all critical queries
2. Verify join operations work
3. Check service role access

### **When Adding New Tables**
1. Choose appropriate policy type
2. Use helper functions
3. Test thoroughly
4. Update this document 