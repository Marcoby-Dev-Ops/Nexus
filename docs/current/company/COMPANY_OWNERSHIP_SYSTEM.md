# 🏢 Company Ownership System

**Last Updated**: January 2025  
**Status**: ✅ **ACTIVE AND STABLE**  
**Version**: 1.0 - Comprehensive Ownership Management

---

## Overview

The Nexus platform implements a comprehensive company ownership system that ensures every company has a designated chief administrator (owner) with full control over the organization. This system provides clear accountability, secure access control, and the ability to transfer ownership when needed.

## 🏗️ **Architecture**

### **Database Schema**

#### Companies Table
```sql
ALTER TABLE companies ADD COLUMN owner_id UUID REFERENCES auth.users(id);
```

- **`owner_id`**: Direct reference to the user who owns the company
- **Foreign Key**: Links to `auth.users(id)` with cascade delete protection
- **Index**: Created for performance on ownership queries

#### User Profiles Table
```sql
-- Existing role field supports ownership
role: 'owner' | 'admin' | 'manager' | 'user'
```

### **Ownership Hierarchy**

```
Company Owner (owner_id)
├── Full administrative control
├── Can transfer ownership
├── Can manage all company settings
└── Can access all company data

Company Admins (role = 'admin')
├── Can manage company settings
├── Can manage team members
└── Cannot transfer ownership

Company Members (role = 'user'/'manager')
├── Access to company data
└── Limited administrative capabilities
```

## 🔧 **Core Services**

### **CompanyOwnershipService**

Provides comprehensive ownership management:

```typescript
class CompanyOwnershipService {
  // Get the owner of a company
  async getCompanyOwner(companyId: string): Promise<CompanyOwner | null>
  
  // Check if a user is the owner
  async isCompanyOwner(companyId: string, userId: string): Promise<boolean>
  
  // Transfer ownership to another user
  async transferOwnership(request: OwnershipTransferRequest): Promise<Result>
  
  // Set a user as company owner
  async setCompanyOwner(companyId: string, userId: string): Promise<Result>
  
  // Get ownership statistics
  async getOwnershipStats(): Promise<OwnershipStats>
}
```

### **Database Functions**

#### `get_company_owner(company_uuid UUID)`
Returns the UUID of the company owner.

#### `is_company_owner(company_uuid UUID, user_uuid UUID)`
Returns boolean indicating if user is the company owner.

#### `transfer_company_ownership(company_uuid, new_owner_uuid, current_user_uuid)`
Safely transfers ownership with validation and role updates.

## 🎯 **Key Features**

### **1. Automatic Ownership Assignment**

During company creation, the creating user is automatically assigned as owner:

```typescript
// In OrganizationSetupStep.tsx
const { data: newCompany } = await supabase
  .from('companies')
  .insert({
    name: data.name,
    owner_id: user?.id,  // Set owner during creation
    // ... other fields
  });
```

### **2. Ownership Transfer**

Owners can transfer ownership to other team members:

```typescript
const result = await ownershipService.transferOwnership({
  companyId: 'company-uuid',
  newOwnerId: 'new-owner-uuid',
  currentUserId: 'current-owner-uuid'
});
```

### **3. Ownership Validation**

All ownership operations include validation:

- ✅ Current user must be the owner to transfer
- ✅ New owner must be a company member
- ✅ Database functions prevent unauthorized transfers
- ✅ RLS policies enforce ownership-based access

### **4. Role Consistency**

Ownership changes automatically update user roles:

```sql
-- When ownership transfers, roles are updated
UPDATE user_profiles SET role = 'admin' WHERE id = current_owner;
UPDATE user_profiles SET role = 'owner' WHERE id = new_owner;
```

## 🔒 **Security & Access Control**

### **Row Level Security (RLS)**

```sql
-- Company owners can manage their companies
CREATE POLICY "Company owners can manage their companies" ON companies
    FOR ALL USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.company_id = companies.id 
            AND user_profiles.id = auth.uid()
            AND user_profiles.role IN ('owner', 'admin')
        )
    );
```

### **Access Levels**

| Role | Company Data | Settings | Team Management | Ownership Transfer |
|------|-------------|----------|-----------------|-------------------|
| Owner | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Can Transfer |
| Admin | ✅ Full Access | ✅ Full Access | ✅ Full Access | ❌ Cannot Transfer |
| Manager | ✅ Read Access | ❌ Limited | ❌ Limited | ❌ Cannot Transfer |
| User | ✅ Read Access | ❌ None | ❌ None | ❌ Cannot Transfer |

## 🎨 **UI Components**

### **CompanyOwnershipPanel**

Comprehensive ownership management interface:

```tsx
<CompanyOwnershipPanel 
  companyId="company-uuid"
  companyName="Company Name"
/>
```

**Features:**
- Display current owner with avatar and details
- Ownership transfer dialog with team member selection
- Company member list with roles
- Ownership statistics dashboard
- Real-time updates after ownership changes

### **useCompanyOwnership Hook**

React hook for ownership management:

```typescript
const {
  owner,
  isOwner,
  isLoading,
  transferOwnership,
  getOwner,
  checkOwnership
} = useCompanyOwnership();
```

## 📊 **Ownership Statistics**

The system tracks ownership metrics:

```typescript
interface OwnershipStats {
  totalCompanies: number;
  companiesWithOwners: number;
  orphanedCompanies: number;
}
```

## 🔄 **Migration & Data Integrity**

### **Migration Script**

For existing companies without owners:

```sql
-- Set owners based on user_profiles with role='owner'
UPDATE companies 
SET owner_id = (
    SELECT up.id 
    FROM user_profiles up 
    WHERE up.company_id = companies.id 
    AND up.role = 'owner' 
    LIMIT 1
)
WHERE owner_id IS NULL;
```

### **Data Validation**

```sql
-- Check for orphaned companies
SELECT COUNT(*) FROM companies WHERE owner_id IS NULL;

-- Check for inconsistent roles
SELECT COUNT(*) FROM companies c
JOIN user_profiles up ON c.owner_id = up.id
WHERE up.role != 'owner';
```

## 🚀 **Usage Examples**

### **Creating a Company with Owner**

```typescript
const { data: company } = await supabase
  .from('companies')
  .insert({
    name: 'My Company',
    owner_id: user.id,
    // ... other fields
  });
```

### **Checking Ownership**

```typescript
const isOwner = await ownershipService.isCompanyOwner(companyId, userId);
if (isOwner) {
  // Show ownership management UI
}
```

### **Transferring Ownership**

```typescript
const result = await ownershipService.transferOwnership({
  companyId: 'company-uuid',
  newOwnerId: 'new-owner-uuid',
  currentUserId: user.id
});

if (result.success) {
  // Show success message
  // Refresh UI
}
```

## 🔧 **Maintenance & Monitoring**

### **Health Checks**

```typescript
// Check for orphaned companies
const stats = await ownershipService.getOwnershipStats();
if (stats.orphanedCompanies > 0) {
  // Alert administrators
}
```

### **Audit Trail**

All ownership changes are logged:

```sql
-- Ownership transfer audit
INSERT INTO audit_logs (
  action, 
  table_name, 
  record_id, 
  user_id, 
  details
) VALUES (
  'ownership_transfer',
  'companies',
  company_id,
  current_user_id,
  json_build_object('new_owner_id', new_owner_id)
);
```

## 🎯 **Best Practices**

1. **Always set owner_id during company creation**
2. **Validate ownership before administrative actions**
3. **Use the ownership service for all ownership operations**
4. **Monitor orphaned companies regularly**
5. **Provide clear UI feedback for ownership changes**
6. **Maintain role consistency between companies and user_profiles**

## 🔮 **Future Enhancements**

- **Multi-owner support** for large organizations
- **Ownership approval workflows** for sensitive transfers
- **Ownership history tracking** with audit logs
- **Automatic ownership assignment** based on company rules
- **Ownership expiration** for temporary assignments

## 📊 **Current Implementation Status**

### **✅ Completed Features**
- **Database Schema**: `owner_id` field added to companies table
- **Service Layer**: `CompanyOwnershipService` with comprehensive methods
- **Security**: RLS policies enforcing ownership-based access
- **UI Components**: Ownership management panels and hooks
- **Validation**: Complete ownership validation and transfer logic
- **Audit Trail**: Comprehensive logging of ownership changes

### **🔄 Active Usage**
- **Company Creation**: Automatic owner assignment during setup
- **Access Control**: RLS policies enforcing ownership permissions
- **Transfer Operations**: Safe ownership transfer with validation
- **Role Management**: Automatic role updates during ownership changes

### **🎯 Next Steps**
1. **Enhanced UI**: Improve ownership management interfaces
2. **Multi-owner Support**: Implement shared ownership for large companies
3. **Approval Workflows**: Add approval processes for sensitive transfers
4. **Analytics**: Enhanced ownership analytics and reporting

---

**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Next Review**: March 2025

*This ownership system ensures every company has clear accountability and secure administrative control while providing flexibility for organizational changes.*
