# RBAC Integration Guide

This guide shows how to integrate the new RBAC permissions utility with your existing codebase.

## Quick Start

### 1. Import the Utility

```typescript
import { Role, hasPermission, canAccessFeature } from '@/lib/permissions';
```

### 2. Replace String-based Role Checks

**Before:**
```typescript
// Old way - hardcoded role checks
if (user.role === 'admin' || user.role === 'manager') {
  showUserManagement();
}
```

**After:**
```typescript
// New way - type-safe permission checks
import { Role, hasPermission } from '@/lib/permissions';

if (hasPermission(user.role as Role, "edit_users")) {
  showUserManagement();
}
```

### 3. Use Feature-based Access Control

```typescript
import { Role, canAccessFeature } from '@/lib/permissions';

const userRole = user.role as Role;

return (
  <div>
    {canAccessFeature(userRole, "user-management") && (
      <UserManagementPanel />
    )}
    
    {canAccessFeature(userRole, "billing") && (
      <BillingPanel />
    )}
    
    {canAccessFeature(userRole, "admin-panel") && (
      <AdminPanel />
    )}
  </div>
);
```

## Migration Examples

### Example 1: Route Protection

**Before:**
```typescript
// In your router or navigation component
const protectedRoutes = {
  '/admin': ['admin'],
  '/users': ['admin', 'manager'],
  '/billing': ['admin', 'manager'],
  '/reports': ['admin', 'manager', 'user']
};

function canAccessRoute(userRole: string, route: string) {
  const allowedRoles = protectedRoutes[route];
  return allowedRoles?.includes(userRole) ?? false;
}
```

**After:**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

const routePermissions = {
  '/admin': 'access_admin_panel',
  '/users': 'edit_users',
  '/billing': 'manage_billing',
  '/reports': 'view_reports'
};

function canAccessRoute(userRole: Role, route: string) {
  const requiredPermission = routePermissions[route];
  if (!requiredPermission) return true;
  
  return hasPermission(userRole, requiredPermission);
}
```

### Example 2: Component Conditional Rendering

**Before:**
```typescript
function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>Profile</h1>
      
      {(user.role === 'admin' || user.role === 'manager') && (
        <button>Edit Users</button>
      )}
      
      {user.role === 'admin' && (
        <button>Admin Panel</button>
      )}
      
      {user.role !== 'guest' && (
        <button>View Reports</button>
      )}
    </div>
  );
}
```

**After:**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

function UserProfile({ user }: { user: User }) {
  const userRole = user.role as Role;
  
  return (
    <div>
      <h1>Profile</h1>
      
      {hasPermission(userRole, "edit_users") && (
        <button>Edit Users</button>
      )}
      
      {hasPermission(userRole, "access_admin_panel") && (
        <button>Admin Panel</button>
      )}
      
      {hasPermission(userRole, "view_reports") && (
        <button>View Reports</button>
      )}
    </div>
  );
}
```

### Example 3: API Endpoint Protection

**Before:**
```typescript
// In your API middleware
function validateRequest(req: Request, res: Response, next: NextFunction) {
  const userRole = req.user?.role;
  
  if (req.path.startsWith('/api/admin') && userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  if (req.path.startsWith('/api/users') && 
      !['admin', 'manager'].includes(userRole)) {
    return res.status(403).json({ error: 'User management access required' });
  }
  
  next();
}
```

**After:**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

function validateRequest(req: Request, res: Response, next: NextFunction) {
  const userRole = req.user?.role as Role;
  
  const endpointPermissions = {
    '/api/admin': 'access_admin_panel',
    '/api/users': 'edit_users',
    '/api/billing': 'manage_billing',
    '/api/reports': 'view_reports'
  };
  
  const path = req.path;
  const requiredPermission = endpointPermissions[path];
  
  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return res.status(403).json({ 
      error: `Permission required: ${requiredPermission}` 
    });
  }
  
  next();
}
```

## Integration with Existing Permissions System

The new RBAC utility complements the existing permissions system in `src/shared/utils/permissions.ts`:

### When to Use Each System

**Use the new RBAC utility (`@/lib/permissions`) for:**
- Simple permission checks
- Feature access control
- Route protection
- UI conditional rendering
- Basic role-based logic

**Use the existing system (`@/shared/utils/permissions`) for:**
- Complex permission scenarios
- Resource-specific permissions
- Advanced role hierarchies
- Enterprise-level permission management

### Example: Hybrid Approach

```typescript
import { Role, hasPermission } from '@/lib/permissions';
import { hasPermission as hasDetailedPermission, UserRole } from '@/shared/utils/permissions';

function checkUserAccess(user: User, action: string, resource?: string) {
  // Use simple RBAC for basic checks
  if (hasPermission(user.role as Role, "edit_users")) {
    return true;
  }
  
  // Use detailed system for complex scenarios
  if (resource && action) {
    return hasDetailedPermission(user.role as UserRole, `${resource}:${action}`);
  }
  
  return false;
}
```

## Best Practices

### 1. Type Safety
Always cast user roles to the proper type:
```typescript
const userRole = user.role as Role;
```

### 2. Default Deny
When in doubt, deny access:
```typescript
function safePermissionCheck(userRole: string, permission: string) {
  try {
    return hasPermission(userRole as Role, permission as any);
  } catch {
    return false; // Default deny
  }
}
```

### 3. Feature Flags
Combine with feature flags for maximum flexibility:
```typescript
import { Role, canAccessFeature } from '@/lib/permissions';

function shouldShowFeature(userRole: Role, feature: string, featureFlag: boolean) {
  return canAccessFeature(userRole, feature) && featureFlag;
}
```

### 4. Testing
Test both positive and negative cases:
```typescript
describe('User Management Access', () => {
  it('should allow admin to edit users', () => {
    expect(hasPermission(Role.Admin, "edit_users")).toBe(true);
  });
  
  it('should deny guest from editing users', () => {
    expect(hasPermission(Role.Guest, "edit_users")).toBe(false);
  });
});
```

## Common Patterns

### Pattern 1: Permission-based Components
```typescript
interface PermissionGateProps {
  permission: string;
  userRole: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function PermissionGate({ permission, userRole, children, fallback }: PermissionGateProps) {
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

### Pattern 2: Permission Hooks
```typescript
import { useMemo } from 'react';
import { Role, hasPermission } from '@/lib/permissions';

export function usePermissions(userRole: Role) {
  return useMemo(() => ({
    canEditUsers: hasPermission(userRole, "edit_users"),
    canManageBilling: hasPermission(userRole, "manage_billing"),
    canAccessAdmin: hasPermission(userRole, "access_admin_panel"),
    canViewReports: hasPermission(userRole, "view_reports"),
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

## Troubleshooting

### Common Issues

1. **TypeScript errors**: Make sure to cast user roles to `Role` type
2. **Permission not found**: Check that the permission exists in the `Permission` type
3. **Role not found**: Ensure the role exists in the `Role` enum

### Debug Mode
Enable debug logging in development:
```typescript
if (import.meta.env.DEV) {
  console.log('Permission check:', { userRole, permission, result });
}
```

## Next Steps

1. **Start small**: Replace one component at a time
2. **Test thoroughly**: Ensure all permission checks work correctly
3. **Document changes**: Update team documentation
4. **Monitor usage**: Track permission check performance
5. **Extend gradually**: Add new permissions as needed 