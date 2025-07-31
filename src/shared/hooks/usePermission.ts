import { Role, hasPermission } from '@/lib/permissions';

/**
 * usePermission - A hook for checking permissions in components
 * 
 * @example
 * const canEditUsers = usePermission(user.role as Role, "edit_users");
 * 
 * if (canEditUsers) {
 *   // Show user management UI
 * }
 * 
 * @param userRole - The user's role
 * @param permission - The permission to check
 * @returns boolean indicating if the user has the permission
 */
export function usePermission(userRole: Role, permission: string): boolean {
  return hasPermission(userRole, permission as any);
} 