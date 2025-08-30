import React from 'react';
import type { Role} from '@/lib/permissions';
import { hasPermission } from '@/lib/permissions';

interface PermissionGateProps {
  permission: string;
  userRole: Role;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * PermissionGate - A component that conditionally renders children based on user permissions
 * 
 * @example
 * <PermissionGate permission="edit_users" userRole={user.role as Role}>
 *   <UserManagementPanel />
 * </PermissionGate>
 * 
 * @example
 * <PermissionGate 
 *   permission="access_admin_panel" 
 *   userRole={user.role as Role}
 *   fallback={<AccessDeniedMessage />}
 *   showFallback={true}
 * >
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({ 
  permission, 
  userRole, 
  children, 
  fallback,
  showFallback = false
}: PermissionGateProps) {
  const hasAccess = hasPermission(userRole, permission as any);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (showFallback && fallback) {
    return <>{fallback}</>;
  }
  
  return null;
}

/**
 * PermissionGateGroup - A component that renders multiple permission gates
 * 
 * @example
 * <PermissionGateGroup userRole={user.role as Role}>
 *   <PermissionGate permission="edit_users">
 *     <UserManagementButton />
 *   </PermissionGate>
 *   <PermissionGate permission="manage_billing">
 *     <BillingButton />
 *   </PermissionGate>
 * </PermissionGateGroup>
 */
interface PermissionGateGroupProps {
  userRole: Role;
  children: React.ReactNode;
}

export function PermissionGateGroup({ userRole, children }: PermissionGateGroupProps) {
  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === PermissionGate) {
          return React.cloneElement(child, { userRole });
        }
        return child;
      })}
    </>
  );
} 
