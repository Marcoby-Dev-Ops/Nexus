import { describe, it, expect } from "@jest/globals";
import { Role, hasPermission, getRolePermissions, hasAnyPermission, hasAllPermissions, getHighestRoleWithPermission, canAccessFeature } from "../permissions";

describe("RBAC Permissions System", () => {
  describe("hasPermission", () => {
    it("admin should have all permissions", () => {
      expect(hasPermission(Role.Admin, "access_admin_panel")).toBe(true);
      expect(hasPermission(Role.Admin, "edit_users")).toBe(true);
      expect(hasPermission(Role.Admin, "manage_billing")).toBe(true);
      expect(hasPermission(Role.Admin, "manage_integrations")).toBe(true);
      expect(hasPermission(Role.Admin, "submit_feedback")).toBe(true);
      expect(hasPermission(Role.Admin, "view_reports")).toBe(true);
      expect(hasPermission(Role.Admin, "view_dashboard")).toBe(true);
    });

    it("manager should not have access_admin_panel", () => {
      expect(hasPermission(Role.Manager, "access_admin_panel")).toBe(false);
      expect(hasPermission(Role.Manager, "edit_users")).toBe(true);
      expect(hasPermission(Role.Manager, "manage_billing")).toBe(true);
      expect(hasPermission(Role.Manager, "manage_integrations")).toBe(true);
      expect(hasPermission(Role.Manager, "submit_feedback")).toBe(true);
      expect(hasPermission(Role.Manager, "view_reports")).toBe(true);
      expect(hasPermission(Role.Manager, "view_dashboard")).toBe(true);
    });

    it("user cannot edit users or manage billing/integrations", () => {
      expect(hasPermission(Role.User, "edit_users")).toBe(false);
      expect(hasPermission(Role.User, "manage_billing")).toBe(false);
      expect(hasPermission(Role.User, "manage_integrations")).toBe(false);
      expect(hasPermission(Role.User, "access_admin_panel")).toBe(false);
      expect(hasPermission(Role.User, "view_dashboard")).toBe(true);
      expect(hasPermission(Role.User, "submit_feedback")).toBe(true);
      expect(hasPermission(Role.User, "view_reports")).toBe(true);
    });

    it("guest has only minimal permissions", () => {
      expect(hasPermission(Role.Guest, "view_dashboard")).toBe(true);
      expect(hasPermission(Role.Guest, "submit_feedback")).toBe(true);
      expect(hasPermission(Role.Guest, "edit_users")).toBe(false);
      expect(hasPermission(Role.Guest, "manage_billing")).toBe(false);
      expect(hasPermission(Role.Guest, "manage_integrations")).toBe(false);
      expect(hasPermission(Role.Guest, "view_reports")).toBe(false);
      expect(hasPermission(Role.Guest, "access_admin_panel")).toBe(false);
    });
  });

  describe("getRolePermissions", () => {
    it("should return all permissions for admin", () => {
      const permissions = getRolePermissions(Role.Admin);
      expect(permissions).toContain("access_admin_panel");
      expect(permissions).toContain("edit_users");
      expect(permissions).toContain("manage_billing");
      expect(permissions).toContain("manage_integrations");
      expect(permissions).toContain("submit_feedback");
      expect(permissions).toContain("view_reports");
      expect(permissions).toContain("view_dashboard");
      expect(permissions).toHaveLength(7);
    });

    it("should return limited permissions for guest", () => {
      const permissions = getRolePermissions(Role.Guest);
      expect(permissions).toContain("view_dashboard");
      expect(permissions).toContain("submit_feedback");
      expect(permissions).not.toContain("edit_users");
      expect(permissions).not.toContain("manage_billing");
      expect(permissions).not.toContain("manage_integrations");
      expect(permissions).not.toContain("view_reports");
      expect(permissions).not.toContain("access_admin_panel");
      expect(permissions).toHaveLength(2);
    });

    it("should return appropriate permissions for each role", () => {
      const roles: Role[] = [Role.Admin, Role.Manager, Role.User, Role.Guest];
      
      roles.forEach(role => {
        const permissions = getRolePermissions(role);
        expect(Array.isArray(permissions)).toBe(true);
        expect(permissions.length).toBeGreaterThan(0);
      });
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true if user has any of the specified permissions", () => {
      expect(hasAnyPermission(Role.Admin, ["edit_users", "manage_billing"])).toBe(true);
      expect(hasAnyPermission(Role.User, ["view_dashboard", "edit_users"])).toBe(true);
      expect(hasAnyPermission(Role.Guest, ["view_dashboard", "submit_feedback"])).toBe(true);
    });

    it("should return false if user has none of the specified permissions", () => {
      expect(hasAnyPermission(Role.Guest, ["edit_users", "manage_billing"])).toBe(false);
      expect(hasAnyPermission(Role.User, ["access_admin_panel", "edit_users"])).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true if user has all specified permissions", () => {
      expect(hasAllPermissions(Role.Admin, ["view_dashboard", "edit_users"])).toBe(true);
      expect(hasAllPermissions(Role.User, ["view_dashboard", "submit_feedback"])).toBe(true);
    });

    it("should return false if user lacks any of the specified permissions", () => {
      expect(hasAllPermissions(Role.Manager, ["edit_users", "access_admin_panel"])).toBe(false);
      expect(hasAllPermissions(Role.User, ["view_dashboard", "edit_users"])).toBe(false);
    });
  });

  describe("getHighestRoleWithPermission", () => {
    it("should return the highest role with the permission", () => {
      expect(getHighestRoleWithPermission("edit_users")).toBe(Role.Admin);
      expect(getHighestRoleWithPermission("view_dashboard")).toBe(Role.Admin); // All roles have view_dashboard
      expect(getHighestRoleWithPermission("submit_feedback")).toBe(Role.Admin); // All roles have submit_feedback
      expect(getHighestRoleWithPermission("view_reports")).toBe(Role.Admin);
    });

    it("should return null for non-existent permissions", () => {
      const nonExistentPermission = "nonexistent_permission" as any;
      expect(getHighestRoleWithPermission(nonExistentPermission)).toBe(null);
    });
  });

  describe("canAccessFeature", () => {
    it("should return true for features user has access to", () => {
      expect(canAccessFeature(Role.Admin, "user-management")).toBe(true);
      expect(canAccessFeature(Role.User, "dashboard")).toBe(true);
      expect(canAccessFeature(Role.Guest, "feedback")).toBe(true);
    });

    it("should return false for features user lacks access to", () => {
      expect(canAccessFeature(Role.Guest, "user-management")).toBe(false);
      expect(canAccessFeature(Role.User, "admin-panel")).toBe(false);
      expect(canAccessFeature(Role.Guest, "reports")).toBe(false);
    });

    it("should return false for non-existent features", () => {
      expect(canAccessFeature(Role.Admin, "non-existent-feature")).toBe(false);
    });
  });

  describe("Permission hierarchy", () => {
    it("should maintain proper permission hierarchy", () => {
      const roles: Role[] = [Role.Admin, Role.Manager, Role.User, Role.Guest];
      
      // Admin should have the most permissions
      const adminPermissions = getRolePermissions(Role.Admin);
      const managerPermissions = getRolePermissions(Role.Manager);
      const userPermissions = getRolePermissions(Role.User);
      const guestPermissions = getRolePermissions(Role.Guest);
      
      expect(adminPermissions.length).toBeGreaterThanOrEqual(managerPermissions.length);
      expect(managerPermissions.length).toBeGreaterThanOrEqual(userPermissions.length);
      expect(userPermissions.length).toBeGreaterThanOrEqual(guestPermissions.length);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty permission arrays", () => {
      expect(hasAnyPermission(Role.Admin, [])).toBe(false);
      expect(hasAllPermissions(Role.Admin, [])).toBe(true); // Empty array means all permissions are satisfied
    });

    it("should handle single permission checks", () => {
      expect(hasAnyPermission(Role.Admin, ["edit_users"])).toBe(true);
      expect(hasAllPermissions(Role.Admin, ["edit_users"])).toBe(true);
    });

    it("should handle invalid roles gracefully", () => {
      const invalidRole = "invalid_role" as any;
      expect(hasPermission(invalidRole, "view_dashboard")).toBe(false);
      expect(getRolePermissions(invalidRole)).toEqual([]);
    });
  });
}); 