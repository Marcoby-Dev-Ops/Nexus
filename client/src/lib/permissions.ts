// src/lib/permissions.ts

export enum Role {
  Admin = "admin",
  Manager = "manager", 
  User = "user",
  Guest = "guest",
}

export type Permission =
  | "view_dashboard"
  | "edit_users"
  | "manage_billing"
  | "manage_integrations"
  | "submit_feedback"
  | "view_reports"
  | "access_admin_panel";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.Admin]: [
    "view_dashboard",
    "edit_users",
    "manage_billing",
    "manage_integrations",
    "submit_feedback",
    "view_reports",
    "access_admin_panel",
  ],
  [Role.Manager]: [
    "view_dashboard",
    "edit_users",
    "manage_billing",
    "manage_integrations",
    "submit_feedback",
    "view_reports",
  ],
  [Role.User]: [
    "view_dashboard",
    "submit_feedback",
    "view_reports",
  ],
  [Role.Guest]: [
    "view_dashboard",
    "submit_feedback",
  ],
};

/**
 * Checks if a given role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a given role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

/**
 * Get the highest role that has a specific permission
 */
export function getHighestRoleWithPermission(permission: Permission): Role | null {
  const roles: Role[] = [Role.Admin, Role.Manager, Role.User, Role.Guest];
  
  for (const role of roles) {
    if (hasPermission(role, permission)) {
      return role;
    }
  }
  
  return null;
}

/**
 * Utility to check if a user can access a specific feature
 */
export function canAccessFeature(role: Role, feature: string): boolean {
  const featurePermissions: Record<string, Permission[]> = {
    'dashboard': ['view_dashboard'],
    'user-management': ['edit_users'],
    'billing': ['manage_billing'],
    'integrations': ['manage_integrations'],
    'feedback': ['submit_feedback'],
    'reports': ['view_reports'],
    'admin-panel': ['access_admin_panel']
  };
  
  const requiredPermissions = featurePermissions[feature];
  if (!requiredPermissions) {
    return false;
  }
  
  return hasAnyPermission(role, requiredPermissions);
} 