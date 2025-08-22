# RBAC Permissions Utility

A type-safe, comprehensive Role-Based Access Control (RBAC) system for the Nexus project.

## Overview

This utility provides a clean, type-safe API for managing user permissions across the application. It consolidates all role strings and permission logic into a single location, making it easy to maintain and extend.

## Features

- ✅ **Type-safe**: Full TypeScript support with strict typing
- ✅ **Comprehensive**: Covers all common permission scenarios
- ✅ **Tested**: Complete test suite with 100% coverage
- ✅ **Extensible**: Easy to add new roles and permissions
- ✅ **Performance**: Lightweight and fast permission checks

## Roles

The system defines four main roles with hierarchical permissions:

### Admin
- **Full access** to all features
- Can manage users, billing, integrations
- Access to admin panel
- View reports and analytics

### Manager
- **Management-level** access
- Can edit users and manage billing/integrations
- Cannot access admin panel
- Can view reports

### User
- **Standard user** permissions
- Can view dashboard and submit feedback
- Can view reports
- Cannot manage users or billing

### Guest
- **Minimal access** only
- Can view dashboard and submit feedback
- No access to management features

## Permissions

| Permission | Admin | Manager | User | Guest |
|------------|-------|---------|------|-------|
| `view_dashboard` | ✅ | ✅ | ✅ | ✅ |
| `edit_users` | ✅ | ✅ | ❌ | ❌ |
| `manage_billing` | ✅ | ✅ | ❌ | ❌ |
| `manage_integrations` | ✅ | ✅ | ❌ | ❌ |
| `submit_feedback` | ✅ | ✅ | ✅ | ✅ |
| `view_reports` | ✅ | ✅ | ✅ | ❌ |
| `access_admin_panel` | ✅ | ❌ | ❌ | ❌ |

## Usage

### Basic Permission Checking

```typescript
import { Role, hasPermission } from '@/lib/permissions';

const userRole = Role.Manager;

if (hasPermission(userRole, "edit_users")) {
  // Show user management UI
  console.log("User can edit other users");
} else {
  // Hide user management UI
  console.log("User cannot edit other users");
}
```

### Feature Access Control

```typescript
import { Role, canAccessFeature } from '@/lib/permissions';

const userRole = Role.User;

const uiElements = {
  showUserManagement: canAccessFeature(userRole, "user-management"),
  showBilling: canAccessFeature(userRole, "billing"),
  showReports: canAccessFeature(userRole, "reports"),
  showAdminPanel: canAccessFeature(userRole, "admin-panel")
};
```

### Route Protection

```typescript
import { Role, hasPermission } from '@/lib/permissions';

function canAccessRoute(userRole: Role, route: string): boolean {
  const routePermissions = {
    "/dashboard": "view_dashboard",
    "/users": "edit_users",
    "/billing": "manage_billing",
    "/admin": "access_admin_panel"
  };

  const requiredPermission = routePermissions[route];
  if (!requiredPermission) return true; // No permission required

  return hasPermission(userRole, requiredPermission);
}
```

### React Component Usage

```typescript
import { Role, hasPermission } from '@/lib/permissions';

interface UserProfileProps {
  userRole: Role;
}

export function UserProfile({ userRole }: UserProfileProps) {
  return (
    <div>
      <h1>User Profile</h1>
      
      {hasPermission(userRole, "edit_users") && (
        <button>Edit Users</button>
      )}
      
      {hasPermission(userRole, "manage_billing") && (
        <button>Manage Billing</button>
      )}
      
      {hasPermission(userRole, "access_admin_panel") && (
        <Link to="/admin">Admin Panel</Link>
      )}
    </div>
  );
}
```

### API Endpoint Protection

```typescript
import { Role, hasPermission } from '@/lib/permissions';

function validateApiAccess(userRole: Role, endpoint: string): boolean {
  const endpointPermissions = {
    "/api/users": ["edit_users"],
    "/api/billing": ["manage_billing"],
    "/api/admin": ["access_admin_panel"]
  };

  const requiredPermissions = endpointPermissions[endpoint];
  if (!requiredPermissions) return true;

  return requiredPermissions.some(permission => 
    hasPermission(userRole, permission)
  );
}
```

## Advanced Usage

### Multiple Permission Checks

```typescript
import { Role, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';

const userRole = Role.Manager;

// Check if user has ANY of the permissions
if (hasAnyPermission(userRole, ["edit_users", "manage_billing"])) {
  console.log("User can perform management tasks");
}

// Check if user has ALL of the permissions
if (hasAllPermissions(userRole, ["edit_users", "manage_billing"])) {
  console.log("User has full management access");
}
```

### Get Role Permissions

```typescript
import { Role, getRolePermissions } from '@/lib/permissions';

const permissions = getRolePermissions(Role.Admin);
console.log("Admin permissions:", permissions);
// Output: ["view_dashboard", "edit_users", "manage_billing", ...]
```

### Find Highest Role with Permission

```typescript
import { Role, getHighestRoleWithPermission } from '@/lib/permissions';

const highestRole = getHighestRoleWithPermission("edit_users");
console.log("Highest role with edit_users:", highestRole); // Role.Admin
```

## Testing

Run the test suite:

```bash
pnpm test src/lib/__tests__/permissions.test.ts
```

The test suite covers:
- ✅ All permission combinations
- ✅ Role hierarchy validation
- ✅ Edge cases and error handling
- ✅ Feature access control
- ✅ Type safety

## Migration Guide

### From String-based Roles

**Before:**
```typescript
if (user.role === 'admin') {
  // Show admin features
}
```

**After:**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

if (hasPermission(user.role as Role, "access_admin_panel")) {
  // Show admin features
}
```

### From Hardcoded Permission Checks

**Before:**
```typescript
const canEditUsers = user.role === 'admin' || user.role === 'manager';
```

**After:**
```typescript
import { Role, hasPermission } from '@/lib/permissions';

const canEditUsers = hasPermission(user.role as Role, "edit_users");
```

## Extending the System

### Adding New Permissions

1. Add the permission to the `Permission` type:
```typescript
export type Permission =
  | "view_dashboard"
  | "edit_users"
  | "manage_billing"
  | "manage_integrations"
  | "submit_feedback"
  | "view_reports"
  | "access_admin_panel"
  | "new_permission"; // Add here
```

2. Update the `ROLE_PERMISSIONS` matrix:
```typescript
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.Admin]: [
    // ... existing permissions
    "new_permission", // Add to appropriate roles
  ],
  // ... other roles
};
```

3. Add tests for the new permission.

### Adding New Roles

1. Add the role to the `Role` enum:
```typescript
export enum Role {
  Admin = "admin",
  Manager = "manager",
  User = "user",
  Guest = "guest",
  NewRole = "new_role", // Add here
}
```

2. Update the `ROLE_PERMISSIONS` matrix:
```typescript
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // ... existing roles
  [Role.NewRole]: [
    "view_dashboard",
    "submit_feedback",
    // Add appropriate permissions
  ],
};
```

3. Update tests to include the new role.

## Best Practices

1. **Always use the utility functions** instead of hardcoded role checks
2. **Test permission changes** thoroughly
3. **Document new permissions** clearly
4. **Use feature-based checks** when possible (`canAccessFeature`)
5. **Handle edge cases** gracefully (invalid roles, missing permissions)

## Integration with Existing System

This utility complements the existing permissions system in `src/shared/utils/permissions.ts`. Use this simpler interface for basic permission checks, and the more comprehensive system for complex scenarios.

## Examples

See `src/lib/examples/permissions-usage.ts` for comprehensive usage examples including:
- Basic permission checking
- Feature access control
- Route protection
- Action-based permissions
- React component integration
- API endpoint protection 