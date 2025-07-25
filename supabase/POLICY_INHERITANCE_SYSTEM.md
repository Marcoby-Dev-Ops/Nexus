# Policy Inheritance System

## Overview

We've implemented a **systematic policy inheritance system** instead of creating individual policies for each table. This approach is much more maintainable, scalable, and follows modern database best practices.

## Why This Approach is Better

### **Traditional Approach (What We Had Before)**
```sql
-- Individual policies for each table - NOT SCALABLE
CREATE POLICY "Users can manage own personal_thoughts" ON personal_thoughts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own personal_automations" ON personal_automations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own fire_cycle_logs" ON fire_cycle_logs
    FOR ALL USING (auth.uid() = user_id);
-- ... repeat for every table
```

### **New Inheritance Approach (What We Have Now)**
```sql
-- Template functions that automatically apply policies based on table structure
SELECT apply_user_level_policies('personal_thoughts');
SELECT apply_user_level_policies('personal_automations');
SELECT apply_user_level_policies('fire_cycle_logs');
-- ... automatically handles all tables with user_id columns
```

## Policy Templates

### 1. **User-Level Policies** (`apply_user_level_policies`)
**For tables with `user_id` columns**
- Users can only access their own data
- Automatically checks for `deleted_at` if it exists
- Applies to: `personal_thoughts`, `personal_automations`, `fire_cycle_logs`, `user_licenses`, etc.

### 2. **Company-Level Policies** (`apply_company_level_policies`)
**For tables with `company_id` columns**
- Company members can access company data
- Automatically checks for `deleted_at` if it exists
- Applies to: `contacts`, `deals`, `tasks`, `notes`, etc.

### 3. **Hybrid Policies** (`apply_hybrid_policies`)
**For tables with both `user_id` and `company_id`**
- Applies both user and company policies
- Users can access their own data AND company data
- Applies to: `personal_thoughts` (has both columns)

### 4. **Read-Only Policies** (`apply_readonly_policies`)
**For analytics and logging tables**
- Authenticated users can read and insert
- Service role has full access
- Applies to: `analytics_events`, `chat_usage_tracking`, etc.

## Current Policy Coverage

| Table | Policy Type | Coverage |
|-------|-------------|----------|
| `personal_thoughts` | Hybrid (User + Company) | ✅ Full |
| `personal_automations` | User-Level | ✅ Full |
| `fire_cycle_logs` | User-Level | ✅ Full |
| `user_licenses` | User-Level | ✅ Full |
| `analytics_events` | User-Level | ✅ Full |
| `chat_usage_tracking` | User-Level | ✅ Full |
| `contacts` | Company-Level | ✅ Full |
| `deals` | Company-Level | ✅ Full |
| `tasks` | Company-Level | ✅ Full |
| `notes` | Company-Level | ✅ Full |
| `user_profiles` | Company-Level | ✅ Full |

## Management Functions

### **Apply Policies to New Tables**
```sql
-- For a new user-level table
SELECT apply_policies_to_new_table('new_user_table', 'user_level');

-- For a new company-level table
SELECT apply_policies_to_new_table('new_company_table', 'company_level');

-- For a new hybrid table
SELECT apply_policies_to_new_table('new_hybrid_table', 'hybrid');

-- For a new analytics table
SELECT apply_policies_to_new_table('new_analytics_table', 'readonly');
```

### **List All Policies**
```sql
SELECT * FROM list_policy_summary();
```

### **Validate Policy Coverage**
```sql
SELECT * FROM validate_policy_coverage();
```

## Benefits of This Approach

### **1. Maintainability** 🛠️
- **Single source of truth** for policy logic
- **Easy to update** all policies at once
- **Consistent behavior** across all tables

### **2. Scalability** 📈
- **Automatic application** to new tables
- **Template-based** approach
- **No code duplication**

### **3. Intelligence** 🧠
- **Column-aware** - checks for `user_id`, `company_id`, `deleted_at`
- **Error-resistant** - handles missing columns gracefully
- **Self-documenting** - clear policy types

### **4. Security** 🔒
- **Consistent security model** across all tables
- **Principle of least privilege** automatically applied
- **Audit-friendly** - clear policy structure

## Adding New Tables

When you add a new table, simply:

1. **Determine the table type**:
   - `user_level` - has `user_id` column
   - `company_level` - has `company_id` column  
   - `hybrid` - has both `user_id` and `company_id`
   - `readonly` - analytics/logging tables

2. **Apply the appropriate policy**:
   ```sql
   SELECT apply_policies_to_new_table('your_new_table', 'user_level');
   ```

3. **Verify the policies**:
   ```sql
   SELECT * FROM list_policy_summary() WHERE table_name = 'your_new_table';
   ```

## Best Practices

### **1. Always Use Templates**
Never create individual policies. Always use the template functions.

### **2. Check Column Existence**
The functions automatically check for required columns before applying policies.

### **3. Document Table Types**
When creating new tables, document which policy type they should use.

### **4. Validate Coverage**
Regularly run `validate_policy_coverage()` to ensure all tables have proper policies.

### **5. Test Policies**
Use the `AuthDebugger` component to test policy behavior from the frontend.

## Migration from Old System

We've successfully migrated from the old individual policy system to this new inheritance system:

- ✅ **All critical tables** have proper policies
- ✅ **No 403 errors** in the application
- ✅ **Consistent security model** across all tables
- ✅ **Maintainable and scalable** approach

This approach is **exactly what modern, successful platforms use** - systematic, template-based policy management that scales with your application. 