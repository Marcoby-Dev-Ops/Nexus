# RBAC Refactor Roadmap 🚀

## 🎯 **Priority 1: High-Impact, Low-Risk Refactors**

### 1. **Team Settings Page** (`src/pages/admin/TeamSettings.tsx`)
**Current Code:**
```typescript
const canManageTeam = user?.role === 'admin' || user?.role === 'owner';
```

**Refactor to:**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

const canManageTeam = hasPermission(user?.role as Role, "edit_users");
```

**Impact:** ✅ High - This controls team management access
**Risk:** ✅ Low - Simple boolean check

### 2. **User Management Page** (`src/pages/admin/UserManagementPage.tsx`)
**Current Code:**
```typescript
// Line 68: setNewRole(user.role);
// Line 138: <TableCell>{user.role}</TableCell>
```

**Refactor to:**
```typescript
import { Role } from '@/lib/permissions';

// For role display
const getRoleDisplayName = (role: Role) => {
  switch (role) {
    case Role.Admin: return 'Admin';
    case Role.Manager: return 'Manager';
    case Role.User: return 'User';
    case Role.Guest: return 'Guest';
    default: return role;
  }
};

// Usage
<TableCell>{getRoleDisplayName(user.role as Role)}</TableCell>
```

**Impact:** ✅ High - User management interface
**Risk:** ✅ Low - Display logic only

## 🎯 **Priority 2: Feature Toggles & Menu Rendering**

### 3. **Admin Home Dashboard** (`src/components/dashboard/AdminHome.tsx`)
**Current Code:**
```typescript
// Line 150: <p className="text-sm text-muted-foreground">{user.email} • {user.role}</p>
```

**Refactor to:**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

// Add permission-based feature toggles
const canAccessAdminFeatures = hasPermission(user.role as Role, "access_admin_panel");
const canManageUsers = hasPermission(user.role as Role, "edit_users");
const canManageBilling = hasPermission(user.role as Role, "manage_billing");

// Conditional rendering
{canAccessAdminFeatures && <AdminPanel />}
{canManageUsers && <UserManagementPanel />}
{canManageBilling && <BillingPanel />}
```

## 🎯 **Priority 3: API Endpoint Protection**

### 4. **Create API Middleware** (`src/lib/api-middleware.ts`)
**New File:**
```typescript
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

## 🎯 **Priority 4: React Component Patterns**

### 5. **Create Permission Gate Component** (`src/components/shared/PermissionGate.tsx`)
**New File:**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

interface PermissionGateProps {
  permission: string;
  userRole: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ 
  permission, 
  userRole, 
  children, 
  fallback 
}: PermissionGateProps) {
  if (hasPermission(userRole, permission as any)) {
    return <>{children}</>;
  }
  
  return fallback ? <>{fallback}</> : null;
}

// Usage
<PermissionGate permission="edit_users" userRole={user.role as Role}>
  <UserManagementPanel />
</PermissionGate>
```

### 6. **Create Permission Hook** (`src/hooks/usePermissions.ts`)
**New File:**
```typescript
import { useMemo } from 'react';
import { Role, hasPermission } from '@/lib/permissions';

export function usePermissions(userRole: Role) {
  return useMemo(() => ({
    canEditUsers: hasPermission(userRole, "edit_users"),
    canManageBilling: hasPermission(userRole, "manage_billing"),
    canManageIntegrations: hasPermission(userRole, "manage_integrations"),
    canAccessAdmin: hasPermission(userRole, "access_admin_panel"),
    canViewReports: hasPermission(userRole, "view_reports"),
    canSubmitFeedback: hasPermission(userRole, "submit_feedback"),
    canViewDashboard: hasPermission(userRole, "view_dashboard"),
  }), [userRole]);
}

// Usage
function MyComponent({ user }: { user: User }) {
  const permissions = usePermissions(user.role as Role);
  
  return (
    <div>
      {permissions.canEditUsers && <UserManagementButton />}
      {permissions.canManageBilling && <BillingButton />}
    </div>
  );
}
```

## 🎯 **Priority 5: Route Protection**

### 7. **Create Route Guard** (`src/components/shared/ProtectedRoute.tsx`)
**Enhance existing:**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

interface ProtectedRouteProps {
  permission: string;
  userRole: Role;
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  permission, 
  userRole, 
  children, 
  redirectTo = '/dashboard' 
}: ProtectedRouteProps) {
  if (!hasPermission(userRole, permission as any)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
}

// Usage in router
<Route 
  path="/admin" 
  element={
    <ProtectedRoute permission="access_admin_panel" userRole={user.role as Role}>
      <AdminPage />
    </ProtectedRoute>
  } 
/>
```

## 📋 **Migration Checklist**

### Phase 1: Foundation (Week 1)
- [ ] ✅ Create PermissionGate component
- [ ] ✅ Create usePermissions hook
- [ ] ✅ Create API middleware
- [ ] ✅ Update TeamSettings.tsx
- [ ] ✅ Update UserManagementPage.tsx

### Phase 2: Core Features (Week 2)
- [ ] Update AdminHome.tsx with permission-based rendering
- [ ] Add route protection to admin routes
- [ ] Update navigation menu with permission checks
- [ ] Add API endpoint protection

### Phase 3: Advanced Features (Week 3)
- [ ] Add audit logging for permission checks
- [ ] Create permission-based feature flags
- [ ] Add organization-level permission overrides
- [ ] Update all remaining hardcoded role checks

### Phase 4: Testing & Documentation (Week 4)
- [ ] Add integration tests for permission flows
- [ ] Update team documentation
- [ ] Create migration scripts for remaining files
- [ ] Performance testing

## 🚨 **Files to Avoid (For Now)**

These files use role checks for **chat/message display logic**, not permissions:
- `src/components/ai/StreamingComposer.tsx` (lines 245, 247, 442, 444, 452, 469)
- `src/components/ai/ToolEnabledDemo.tsx` (lines 194, 198, 200, 204, 212, 215, 217)
- `src/shared/components/chat/ChatInterface.tsx` (lines 204, 208)

**Reason:** These are UI layout decisions, not security permissions.

## 🎯 **Quick Wins (Start Here)**

1. **TeamSettings.tsx** - 5-minute refactor, high impact
2. **PermissionGate component** - Reusable across the app
3. **usePermissions hook** - Clean, declarative permission checks

## 📊 **Success Metrics**

- [ ] Zero hardcoded role checks in admin features
- [ ] All new features use RBAC utility
- [ ] 100% test coverage for permission flows
- [ ] Reduced permission-related bugs
- [ ] Faster feature development (reusable patterns)

## 🚀 **Ready to Start?**

Pick any file from **Priority 1** and I'll help you refactor it step-by-step! The TeamSettings.tsx file is a perfect starting point - it's small, impactful, and low-risk.

**Want me to:**
1. **Refactor TeamSettings.tsx** right now?
2. **Create the PermissionGate component** first?
3. **Set up the usePermissions hook**?
4. **Something else?**

Just say the word! 🎯 