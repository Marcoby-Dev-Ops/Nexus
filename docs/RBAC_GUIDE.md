# 🔐 Role-Based Access Control (RBAC) Guide

## 📋 Overview

This guide covers the implementation of Role-Based Access Control (RBAC) in Nexus, including integration patterns, refactoring strategies, and best practices.

## 🎯 RBAC Architecture

### **Core Components**

#### **Permission System**
```typescript
// src/lib/permissions.ts
export enum Role {
  Owner = 'owner',
  Admin = 'admin', 
  Manager = 'manager',
  User = 'user',
  Guest = 'guest'
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  roles: Role[];
}

export function hasPermission(userRole: Role, permissionId: string): boolean {
  // Permission checking logic
}
```

#### **Permission Gate Component**
```typescript
// src/components/shared/PermissionGate.tsx
export const PermissionGate: React.FC<{
  permission: string;
  userRole: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ permission, userRole, children, fallback }) => {
  if (!hasPermission(userRole, permission)) {
    return fallback || null;
  }
  return <>{children}</>;
};
```

---

## 🚀 Implementation Phases

### **Phase 1: High-Impact Components (Current Sprint)**

#### **Admin Dashboard Priority**
- [ ] **Team Settings** - Replace hardcoded role checks with `hasPermission()`
- [ ] **User Management** - Add permission-based user editing controls
- [ ] **Billing Panel** - Protect billing management with `manage_billing` permission
- [ ] **Integration Settings** - Add `manage_integrations` permission checks

#### **Route Protection**
- [ ] **Admin Routes** - Wrap admin routes with permission guards
- [ ] **Settings Routes** - Add role-based access to sensitive settings
- [ ] **API Endpoints** - Add permission middleware to sensitive APIs

#### **UI Components**
- [ ] **Navigation Menus** - Hide admin links based on permissions
- [ ] **Action Buttons** - Disable actions user can't perform
- [ ] **Feature Toggles** - Use RBAC for feature visibility

### **Phase 2: Medium-Impact Components (Next Sprint)**

#### **Reports & Analytics**
- [ ] **Report Access** - Add `view_reports` permission checks
- [ ] **Export Controls** - Restrict data exports by role
- [ ] **Dashboard Widgets** - Show/hide widgets based on permissions

#### **User Experience**
- [ ] **Error Messages** - Show appropriate access denied messages
- [ ] **Loading States** - Handle permission check loading states
- [ ] **Fallback UI** - Provide alternative content for unauthorized users

### **Phase 3: Advanced Features (Future)**

#### **Organization-Level Permissions**
- [ ] **Multi-tenant Support** - Add org-specific permission overrides
- [ ] **Permission Groups** - Create permission bundles for rapid role changes
- [ ] **Audit Trails** - Log permission check failures for security review

#### **Performance Optimization**
- [ ] **Permission Caching** - Cache permission results for better performance
- [ ] **Lazy Loading** - Load permission-dependent components on demand
- [ ] **Bundle Splitting** - Split admin features into separate bundles

---

## 🔧 Refactoring Patterns

### **Priority 1: High-Impact, Low-Risk Refactors**

#### **1. Team Settings Page** (`src/pages/admin/TeamSettings.tsx`)

**Before (Hardcoded):**
```typescript
const canManageTeam = user?.role === 'admin' || user?.role === 'owner';
```

**After (RBAC):**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

const canManageTeam = hasPermission(user?.role as Role, "edit_users");
```

#### **2. User Management Page** (`src/pages/admin/UserManagementPage.tsx`)

**Before (Hardcoded):**
```typescript
<TableCell>{user.role}</TableCell>
```

**After (RBAC):**
```typescript
import { Role } from '@/lib/permissions';

const getRoleDisplayName = (role: Role) => {
  switch (role) {
    case Role.Admin: return 'Admin';
    case Role.Manager: return 'Manager';
    case Role.User: return 'User';
    case Role.Guest: return 'Guest';
    default: return role;
  }
};

<TableCell>{getRoleDisplayName(user.role as Role)}</TableCell>
```

#### **3. Admin Dashboard** (`src/components/dashboard/AdminHome.tsx`)

**Before (Hardcoded):**
```typescript
{user.role === 'admin' && <AdminPanel />}
```

**After (RBAC):**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

const canAccessAdminFeatures = hasPermission(user.role as Role, "access_admin_panel");
const canManageUsers = hasPermission(user.role as Role, "edit_users");
const canManageBilling = hasPermission(user.role as Role, "manage_billing");

{canAccessAdminFeatures && <AdminPanel />}
{canManageUsers && <UserManagementPanel />}
{canManageBilling && <BillingPanel />}
```

### **Priority 2: API Endpoint Protection**

#### **Permission Middleware**
```typescript
// src/lib/api-middleware.ts
import { Role, hasPermission } from '@/lib/permissions';

export function createPermissionMiddleware(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role;
    
    if (!hasPermission(userRole, requiredPermission as any)) {
      return res.status(403).json({ 
        error: `Permission required: ${requiredPermission}` 
      });
    }
    
    next();
  };
}

// Usage in routes
app.get('/api/users', 
  createPermissionMiddleware('edit_users'),
  userController.list
);
```

---

## 🛠️ Development Tools

### **Quick Start Commands**

#### **Find Existing Role Checks**
```bash
# Find hardcoded role checks
git grep -n "role ===" src/
git grep -n "'admin'" src/
git grep -n "user.role" src/

# Find permission-related patterns
git grep -n "canEdit\|canManage\|canAccess" src/
```

#### **Test RBAC Integration**
```bash
# Run RBAC tests
pnpm test src/lib/__tests__/permissions.test.ts

# Type check
pnpm run type-check

# Build test
pnpm run build
```

### **Common Patterns to Replace**

#### **Before (Hardcoded)**
```typescript
if (user.role === 'admin') {
  // Show admin UI
}

{user.role === 'manager' && <ManagerPanel />}
```

#### **After (RBAC)**
```typescript
import { hasPermission } from '@/lib/permissions';
import { PermissionGate } from '@/components/shared/PermissionGate';

if (hasPermission(user.role as Role, "access_admin_panel")) {
  // Show admin UI
}

<PermissionGate permission="access_admin_panel" userRole={user.role as Role}>
  <ManagerPanel />
</PermissionGate>
```

---

## 📊 Success Metrics

### **This Sprint**
- [ ] **5+ components** refactored to use RBAC
- [ ] **Zero breaking changes** in production
- [ ] **All tests passing** with new permission checks
- [ ] **Performance impact** < 5ms per permission check

### **Next Sprint**
- [ ] **All admin routes** protected with RBAC
- [ ] **API endpoints** secured with permission middleware
- [ ] **User experience** improved with proper error handling
- [ ] **Audit logging** implemented for security review

### **Future Goals**
- [ ] **Multi-tenant support** for organization-level permissions
- [ ] **Permission caching** for improved performance
- [ ] **Advanced analytics** on permission usage patterns
- [ ] **Automated testing** for all permission scenarios

---

## 🔒 Security Best Practices

### **Permission Design**
- **Principle of Least Privilege** - Grant minimum permissions needed
- **Role Hierarchy** - Define clear role relationships
- **Permission Granularity** - Use specific permissions, not broad roles
- **Audit Trail** - Log all permission checks and failures

### **Implementation Guidelines**
- **Type Safety** - Use TypeScript for all permission checks
- **Error Handling** - Provide clear access denied messages
- **Performance** - Cache permission results when appropriate
- **Testing** - Test all permission scenarios thoroughly

### **Common Pitfalls**
- ❌ **Hardcoded Role Checks** - Use permission system instead
- ❌ **Broad Permissions** - Use specific, granular permissions
- ❌ **No Error Handling** - Always handle permission failures gracefully
- ❌ **No Logging** - Log permission failures for security review

---

## 🎯 Next Steps

1. **Complete Phase 1** - High-impact component refactoring
2. **Implement API Middleware** - Secure all sensitive endpoints
3. **Add Permission Caching** - Improve performance
4. **Create Audit System** - Log all permission activities
5. **Add Multi-tenant Support** - Organization-level permissions

This RBAC system provides secure, scalable access control while maintaining excellent developer experience and performance.
