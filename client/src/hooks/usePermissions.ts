import { useMemo } from 'react';
import { Role, hasPermission, canAccessFeature } from '@/lib/permissions';

/**
 * usePermissions - A comprehensive hook that provides all permission checks for a user role
 * 
 * @example
 * function MyComponent({ user }: { user: User }) {
 *   const permissions = usePermissions(user.role as Role);
 *   
 *   return (
 *     <div>
 *       {permissions.canEditUsers && <UserManagementButton />}
 *       {permissions.canManageBilling && <BillingButton />}
 *       {permissions.canAccessAdmin && <AdminPanel />}
 *     </div>
 *   );
 * }
 */
export function usePermissions(userRole: Role) {
  return useMemo(() => ({
    // User Management
    canEditUsers: hasPermission(userRole, "edit_users"),
    
    // Billing & Financial
    canManageBilling: hasPermission(userRole, "manage_billing"),
    
    // Integrations
    canManageIntegrations: hasPermission(userRole, "manage_integrations"),
    
    // Admin Access
    canAccessAdmin: hasPermission(userRole, "access_admin_panel"),
    
    // Reports & Analytics
    canViewReports: hasPermission(userRole, "view_reports"),
    
    // Feedback
    canSubmitFeedback: hasPermission(userRole, "submit_feedback"),
    
    // Dashboard
    canViewDashboard: hasPermission(userRole, "view_dashboard"),
    
    // Feature-based access (using canAccessFeature)
    canAccessUserManagement: canAccessFeature(userRole, "user-management"),
    canAccessBilling: canAccessFeature(userRole, "billing"),
    canAccessIntegrations: canAccessFeature(userRole, "integrations"),
    canAccessReports: canAccessFeature(userRole, "reports"),
    canAccessAdminPanel: canAccessFeature(userRole, "admin-panel"),
    canAccessFeedback: canAccessFeature(userRole, "feedback"),
    canAccessDashboard: canAccessFeature(userRole, "dashboard"),
    
    // Role-based helpers
    isAdmin: userRole === Role.Admin,
    isManager: userRole === Role.Manager,
    isUser: userRole === Role.User,
    isGuest: userRole === Role.Guest,
    
    // Permission groups
    canManageTeam: hasPermission(userRole, "edit_users"),
    canManageCompany: hasPermission(userRole, "manage_billing") || hasPermission(userRole, "manage_integrations"),
    canViewAnalytics: hasPermission(userRole, "view_reports"),
    canAccessSensitiveData: hasPermission(userRole, "access_admin_panel") || hasPermission(userRole, "edit_users"),
  }), [userRole]);
}

/**
 * usePermission - A simple hook for checking a single permission
 * 
 * @example
 * const canEditUsers = usePermission(user.role as Role, "edit_users");
 * 
 * if (canEditUsers) {
 *   // Show user management UI
 * }
 */
export function usePermission(userRole: Role, permission: string): boolean {
  return useMemo(() => hasPermission(userRole, permission as any), [userRole, permission]);
}

/**
 * useFeatureAccess - A hook for checking feature access
 * 
 * @example
 * const canAccessUserManagement = useFeatureAccess(user.role as Role, "user-management");
 * 
 * if (canAccessUserManagement) {
 *   // Show user management feature
 * }
 */
export function useFeatureAccess(userRole: Role, feature: string): boolean {
  return useMemo(() => canAccessFeature(userRole, feature), [userRole, feature]);
}

/**
 * useRolePermissions - A hook that returns all permissions for a role
 * 
 * @example
 * const permissions = useRolePermissions(user.role as Role);
 * console.log('User has permissions:', permissions);
 */
export function useRolePermissions(userRole: Role) {
  return useMemo(() => {
    const allPermissions = [
      "view_dashboard",
      "edit_users", 
      "manage_billing",
      "manage_integrations",
      "submit_feedback",
      "view_reports",
      "access_admin_panel"
    ];
    
    return allPermissions.filter(permission => 
      hasPermission(userRole, permission as any)
    );
  }, [userRole]);
} 
