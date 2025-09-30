# 🚀 RBAC Quick Start Guide

## **5-Minute Setup**

### Step 1: Import the Utilities
```typescript
// In any component that needs permissions
import { Role, hasPermission } from '@/lib/permissions';
import { PermissionGate } from '@/components/shared/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
```

### Step 2: Replace Your First Role Check
**Find this in your code:**
```typescript
const canManageTeam = user?.role === 'admin' || user?.role === 'owner';
```

**Replace with:**
```typescript
const canManageTeam = hasPermission(user?.role as Role, "edit_users");
```

### Step 3: Use PermissionGate for UI
**Before:**
```typescript
{user?.role === 'admin' && <AdminPanel />}
```

**After:**
```typescript
<PermissionGate permission="access_admin_panel" userRole={user?.role as Role}>
  <AdminPanel />
</PermissionGate>
```

### Step 4: Use the Hook for Multiple Checks
```typescript
function MyComponent({ user }: { user: User }) {
  const permissions = usePermissions(user.role as Role);
  
  return (
    <div>
      {permissions.canEditUsers && <UserManagementButton />}
      {permissions.canManageBilling && <BillingButton />}
      {permissions.canAccessAdmin && <AdminPanel />}
    </div>
  );
}
```

## **🎯 Your First Refactor: TeamSettings.tsx**

**Ready to try it?** Here's exactly what to change:

### 1. Add the imports
```typescript
import { Role, hasPermission } from '@/lib/permissions';
import { PermissionGate } from '@/components/shared/PermissionGate';
```

### 2. Replace line 44
**From:**
```typescript
const canManageTeam = user?.role === 'admin' || user?.role === 'owner';
```

**To:**
```typescript
const canManageTeam = hasPermission(user?.role as Role, "edit_users");
```

### 3. Wrap the invite form
**From:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Invite Team Members</CardTitle>
    ...
  </CardHeader>
</Card>
```

**To:**
```typescript
<PermissionGate permission="edit_users" userRole={user?.role as Role}>
  <Card>
    <CardHeader>
      <CardTitle>Invite Team Members</CardTitle>
      ...
    </CardHeader>
  </Card>
</PermissionGate>
```

**That's it!** You've just refactored your first component. 🎉

## **📋 Next Steps Checklist**

### ✅ **Week 1: Foundation**
- [ ] ✅ RBAC utility created and tested
- [ ] ✅ PermissionGate component ready
- [ ] ✅ usePermissions hook ready
- [ ] [ ] Refactor TeamSettings.tsx (5 minutes)
- [ ] [ ] Refactor UserManagementPage.tsx (10 minutes)
- [ ] [ ] Add permission checks to AdminHome.tsx (15 minutes)

### ✅ **Week 2: Core Features**
- [ ] [ ] Create API middleware for endpoint protection
- [ ] [ ] Add route protection to admin routes
- [ ] [ ] Update navigation menu with permission checks
- [ ] [ ] Add permission-based feature toggles

### ✅ **Week 3: Advanced Features**
- [ ] [ ] Add audit logging for permission checks
- [ ] [ ] Create permission-based feature flags
- [ ] [ ] Add organization-level permission overrides
- [ ] [ ] Update all remaining hardcoded role checks

## **🔍 Find More Files to Refactor**

Run these commands to find more opportunities:

```bash
# Find hardcoded role checks
git grep -n "role ===" src/
git grep -n "'admin'" src/
git grep -n "'manager'" src/

# Find user role references
git grep -n "user\?\.role" src/ | grep -E "(admin|manager|user)"
```

## **🎯 Priority Files to Refactor**

1. **`src/pages/admin/TeamSettings.tsx`** - ✅ Ready to refactor
2. **`src/pages/admin/UserManagementPage.tsx`** - High impact
3. **`src/components/dashboard/AdminHome.tsx`** - Dashboard access
4. **`src/shared/components/layout/Sidebar.tsx`** - Navigation
5. **`src/pages/admin/AdminPage.tsx`** - Admin panel access

## **🚨 Common Patterns to Replace**

### Pattern 1: Boolean Role Checks
**Before:**
```typescript
const isAdmin = user.role === 'admin';
const canManage = user.role === 'admin' || user.role === 'manager';
```

**After:**
```typescript
const isAdmin = hasPermission(user.role as Role, "access_admin_panel");
const canManage = hasPermission(user.role as Role, "edit_users");
```

### Pattern 2: Conditional Rendering
**Before:**
```typescript
{user.role === 'admin' && <AdminPanel />}
{(user.role === 'admin' || user.role === 'manager') && <UserManagement />}
```

**After:**
```typescript
<PermissionGate permission="access_admin_panel" userRole={user.role as Role}>
  <AdminPanel />
</PermissionGate>

<PermissionGate permission="edit_users" userRole={user.role as Role}>
  <UserManagement />
</PermissionGate>
```

### Pattern 3: Multiple Permission Checks
**Before:**
```typescript
const canAccessAdmin = user.role === 'admin';
const canManageUsers = user.role === 'admin' || user.role === 'manager';
const canViewReports = user.role !== 'guest';
```

**After:**
```typescript
const permissions = usePermissions(user.role as Role);

const canAccessAdmin = permissions.canAccessAdmin;
const canManageUsers = permissions.canEditUsers;
const canViewReports = permissions.canViewReports;
```

## **🎉 Success Metrics**

Track these to measure your progress:

- [ ] **Zero hardcoded role checks** in admin features
- [ ] **All new features** use RBAC utility
- [ ] **100% test coverage** for permission flows
- [ ] **Reduced permission-related bugs**
- [ ] **Faster feature development** (reusable patterns)

## **🚀 Ready to Start?**

**Pick one:**
1. **Refactor TeamSettings.tsx** (5 minutes, high impact)
2. **Create your first PermissionGate** (2 minutes)
3. **Set up usePermissions hook** (3 minutes)
4. **Find more files to refactor** (run the grep commands above)

**Just say the word and I'll help you with any of these!** 🎯

---

**Remember:** Start small, test often, and celebrate each refactor! You're building a more secure, maintainable, and scalable permission system. 🎉 