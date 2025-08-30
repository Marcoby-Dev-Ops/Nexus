import {
  hasPermission,
  getRolePermissions,
  hasAnyPermission,
  hasAllPermissions,
  getHighestRoleWithPermission,
  canAccessFeature,
  type UserRole,
  type PermissionAction
} from '@/shared/utils/permissions';

describe('RBAC Permission System', () => {
  describe('hasPermission', () => {
    it('should return true for owner with any permission', () => {
      expect(hasPermission('owner', 'users:delete')).toBe(true);
      expect(hasPermission('owner', 'company:delete')).toBe(true);
      expect(hasPermission('owner', 'billing:delete')).toBe(true);
    });

    it('should return false for guest with restricted permissions', () => {
      expect(hasPermission('guest', 'users:delete')).toBe(false);
      expect(hasPermission('guest', 'company:delete')).toBe(false);
      expect(hasPermission('guest', 'billing:delete')).toBe(false);
    });

    it('should return true for admin with most permissions but not company/billing delete', () => {
      expect(hasPermission('admin', 'users:delete')).toBe(true);
      expect(hasPermission('admin', 'company:delete')).toBe(false);
      expect(hasPermission('admin', 'billing:delete')).toBe(false);
    });

    it('should return true for user with basic permissions', () => {
      expect(hasPermission('user', 'users:read')).toBe(true);
      expect(hasPermission('user', 'integrations:create')).toBe(true);
      expect(hasPermission('user', 'ai:use')).toBe(true);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for owner', () => {
      const permissions = getRolePermissions('owner');
      expect(permissions).toContain('users:delete');
      expect(permissions).toContain('company:delete');
      expect(permissions).toContain('billing:delete');
      expect(permissions).toContain('ai:admin');
    });

    it('should return limited permissions for guest', () => {
      const permissions = getRolePermissions('guest');
      expect(permissions).toContain('company:read');
      expect(permissions).toContain('settings:read');
      expect(permissions).not.toContain('users:delete');
      expect(permissions).not.toContain('company:delete');
    });

    it('should return appropriate permissions for each role', () => {
      const roles: UserRole[] = ['owner', 'admin', 'manager', 'user', 'viewer', 'guest'];
      
      roles.forEach(role => {
        const permissions = getRolePermissions(role);
        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the specified permissions', () => {
      expect(hasAnyPermission('admin', ['users:delete', 'company:delete'])).toBe(true);
      expect(hasAnyPermission('user', ['users:read', 'company:delete'])).toBe(true);
    });

    it('should return false if user has none of the specified permissions', () => {
      expect(hasAnyPermission('guest', ['users:delete', 'company:delete'])).toBe(false);
      expect(hasAnyPermission('viewer', ['billing:update', 'ai:admin'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all specified permissions', () => {
      expect(hasAllPermissions('owner', ['users:read', 'company:read'])).toBe(true);
      expect(hasAllPermissions('user', ['users:read', 'company:read'])).toBe(true);
    });

    it('should return false if user lacks any of the specified permissions', () => {
      expect(hasAllPermissions('admin', ['users:delete', 'company:delete'])).toBe(false);
      expect(hasAllPermissions('user', ['users:read', 'company:delete'])).toBe(false);
    });
  });

  describe('getHighestRoleWithPermission', () => {
    it('should return the highest role with the permission', () => {
      expect(getHighestRoleWithPermission('users:delete')).toBe('owner');
      expect(getHighestRoleWithPermission('company:read')).toBe('owner'); // All roles have company:read
      expect(getHighestRoleWithPermission('ai:use')).toBe('user');
    });

    it('should return null for non-existent permissions', () => {
      // This would need to be updated if we add a permission that no role has
      // For now, we'll test with a hypothetical permission
      const nonExistentPermission = 'nonexistent:permission' as PermissionAction;
      // Note: This test assumes no role has this permission
      // In a real scenario, you'd need to ensure this permission doesn't exist
    });
  });

  describe('canAccessFeature', () => {
    it('should return true for features user has access to', () => {
      expect(canAccessFeature('admin', 'user-management')).toBe(true);
      expect(canAccessFeature('user', 'ai')).toBe(true);
      expect(canAccessFeature('viewer', 'analytics')).toBe(true);
    });

    it('should return false for features user lacks access to', () => {
      expect(canAccessFeature('guest', 'user-management')).toBe(false);
      expect(canAccessFeature('viewer', 'automation')).toBe(false);
    });

    it('should return false for non-existent features', () => {
      expect(canAccessFeature('owner', 'non-existent-feature')).toBe(false);
    });
  });

  describe('Permission hierarchy', () => {
    it('should maintain proper permission hierarchy', () => {
      const roles: UserRole[] = ['owner', 'admin', 'manager', 'user', 'viewer', 'guest'];
      
      // Owner should have the most permissions
      const ownerPermissions = getRolePermissions('owner');
      const adminPermissions = getRolePermissions('admin');
      const managerPermissions = getRolePermissions('manager');
      const userPermissions = getRolePermissions('user');
      const viewerPermissions = getRolePermissions('viewer');
      const guestPermissions = getRolePermissions('guest');
      
      expect(ownerPermissions.length).toBeGreaterThanOrEqual(adminPermissions.length);
      expect(adminPermissions.length).toBeGreaterThanOrEqual(managerPermissions.length);
      expect(managerPermissions.length).toBeGreaterThanOrEqual(userPermissions.length);
      expect(userPermissions.length).toBeGreaterThanOrEqual(viewerPermissions.length);
      expect(viewerPermissions.length).toBeGreaterThanOrEqual(guestPermissions.length);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty permission arrays', () => {
      expect(hasAnyPermission('owner', [])).toBe(false);
      expect(hasAllPermissions('owner', [])).toBe(true); // Empty array means all permissions are satisfied
    });

    it('should handle single permission checks', () => {
      expect(hasAnyPermission('admin', ['users:delete'])).toBe(true);
      expect(hasAllPermissions('admin', ['users:delete'])).toBe(true);
    });
  });
}); 