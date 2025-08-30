/**
 * Role-Based Access Control (RBAC) Permission System
 * 
 * This utility consolidates all role strings and permission logic into a single,
 * type-safe location. It provides a clean API for checking permissions across
 * the application.
 */

export type UserRole = 
  | 'owner'
  | 'admin' 
  | 'manager'
  | 'user'
  | 'viewer'
  | 'guest';

export type PermissionAction = 
  // User Management
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  
  // Company Management
  | 'company:read'
  | 'company:update'
  | 'company:delete'
  
  // Billing
  | 'billing:read'
  | 'billing:update'
  | 'billing:delete'
  
  // Integrations
  | 'integrations:read'
  | 'integrations:create'
  | 'integrations:update'
  | 'integrations:delete'
  
  // Analytics
  | 'analytics:read'
  | 'analytics:export'
  
  // AI Features
  | 'ai:use'
  | 'ai:configure'
  | 'ai:admin'
  
  // Automation
  | 'automation:read'
  | 'automation:create'
  | 'automation:update'
  | 'automation:delete'
  
  // Settings
  | 'settings:read'
  | 'settings:update'
  | 'settings:admin';

// Permission matrix defining what each role can do
const PERMISSION_MATRIX: Record<UserRole, PermissionAction[]> = {
  owner: [
    // Full access to everything
    'users:read', 'users:create', 'users:update', 'users:delete',
    'company:read', 'company:update', 'company:delete',
    'billing:read', 'billing:update', 'billing:delete',
    'integrations:read', 'integrations:create', 'integrations:update', 'integrations:delete',
    'analytics:read', 'analytics:export',
    'ai:use', 'ai:configure', 'ai:admin',
    'automation:read', 'automation:create', 'automation:update', 'automation:delete',
    'settings:read', 'settings:update', 'settings:admin'
  ],
  admin: [
    // Full access except company deletion and billing deletion
    'users:read', 'users:create', 'users:update', 'users:delete',
    'company:read', 'company:update',
    'billing:read', 'billing:update',
    'integrations:read', 'integrations:create', 'integrations:update', 'integrations:delete',
    'analytics:read', 'analytics:export',
    'ai:use', 'ai:configure', 'ai:admin',
    'automation:read', 'automation:create', 'automation:update', 'automation:delete',
    'settings:read', 'settings:update', 'settings:admin'
  ],
  manager: [
    // Can manage users, integrations, automation, and basic settings
    'users:read', 'users:create', 'users:update',
    'company:read',
    'billing:read',
    'integrations:read', 'integrations:create', 'integrations:update',
    'analytics:read', 'analytics:export',
    'ai:use', 'ai:configure',
    'automation:read', 'automation:create', 'automation:update',
    'settings:read', 'settings:update'
  ],
  user: [
    // Standard user permissions
    'users:read',
    'company:read',
    'billing:read',
    'integrations:read', 'integrations:create',
    'analytics:read',
    'ai:use',
    'automation:read', 'automation:create',
    'settings:read'
  ],
  viewer: [
    // Read-only access
    'users:read',
    'company:read',
    'analytics:read',
    'settings:read'
  ],
  guest: [
    // Minimal access
    'company:read',
    'settings:read'
  ]
};

/**
 * Check if a user with the given role has permission to perform an action
 * 
 * @param role - The user's role
 * @param action - The action to check permission for
 * @returns boolean indicating if the user has permission
 */
export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  const permissions = PERMISSION_MATRIX[role];
  return permissions.includes(action);
}

/**
 * Get all permissions for a given role
 * 
 * @param role - The user's role
 * @returns Array of all permissions for the role
 */
export function getRolePermissions(role: UserRole): PermissionAction[] {
  return PERMISSION_MATRIX[role];
}

/**
 * Check if a role has any of the specified permissions
 * 
 * @param role - The user's role
 * @param actions - Array of actions to check
 * @returns boolean indicating if the user has any of the permissions
 */
export function hasAnyPermission(role: UserRole, actions: PermissionAction[]): boolean {
  return actions.some(action => hasPermission(role, action));
}

/**
 * Check if a role has all of the specified permissions
 * 
 * @param role - The user's role
 * @param actions - Array of actions to check
 * @returns boolean indicating if the user has all of the permissions
 */
export function hasAllPermissions(role: UserRole, actions: PermissionAction[]): boolean {
  return actions.every(action => hasPermission(role, action));
}

/**
 * Get the highest role that has a specific permission
 * 
 * @param action - The action to check
 * @returns The highest role with the permission, or null if none found
 */
export function getHighestRoleWithPermission(action: PermissionAction): UserRole | null {
  const roles: UserRole[] = ['owner', 'admin', 'manager', 'user', 'viewer', 'guest'];
  
  for (const role of roles) {
    if (hasPermission(role, action)) {
      return role;
    }
  }
  
  return null;
}

/**
 * Utility to check if a user can access a specific feature
 * 
 * @param role - The user's role
 * @param feature - The feature to check access for
 * @returns boolean indicating if the user can access the feature
 */
export function canAccessFeature(role: UserRole, feature: string): boolean {
  const featurePermissions: Record<string, PermissionAction[]> = {
    'user-management': ['users:read', 'users:create', 'users:update', 'users:delete'],
    'billing': ['billing:read', 'billing:update'],
    'integrations': ['integrations:read', 'integrations:create'],
    'analytics': ['analytics:read'],
    'ai': ['ai:use'],
    'automation': ['automation:read', 'automation:create'],
    'settings': ['settings:read', 'settings:update']
  };
  
  const requiredPermissions = featurePermissions[feature];
  if (!requiredPermissions) {
    return false;
  }
  
  return hasAnyPermission(role, requiredPermissions);
} 
