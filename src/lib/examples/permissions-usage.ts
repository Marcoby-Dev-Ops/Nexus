// src/lib/examples/permissions-usage.ts
// Example usage of the RBAC permissions utility

import { Role, hasPermission, canAccessFeature } from "../permissions";

// Example 1: Basic permission checking
export function checkUserPermissions(userRole: Role) {
  console.log(`User role: ${userRole}`);
  
  // Check specific permissions
  if (hasPermission(userRole, "edit_users")) {
    console.log("✅ User can edit other users");
  } else {
    console.log("❌ User cannot edit other users");
  }

  if (hasPermission(userRole, "access_admin_panel")) {
    console.log("✅ User can access admin panel");
  } else {
    console.log("❌ User cannot access admin panel");
  }

  if (hasPermission(userRole, "manage_billing")) {
    console.log("✅ User can manage billing");
  } else {
    console.log("❌ User cannot manage billing");
  }
}

// Example 2: Feature access control
export function renderUserInterface(userRole: Role) {
  const uiElements = {
    dashboard: canAccessFeature(userRole, "dashboard"),
    userManagement: canAccessFeature(userRole, "user-management"),
    billing: canAccessFeature(userRole, "billing"),
    integrations: canAccessFeature(userRole, "integrations"),
    reports: canAccessFeature(userRole, "reports"),
    adminPanel: canAccessFeature(userRole, "admin-panel"),
    feedback: canAccessFeature(userRole, "feedback")
  };

  return {
    showDashboard: uiElements.dashboard,
    showUserManagement: uiElements.userManagement,
    showBilling: uiElements.billing,
    showIntegrations: uiElements.integrations,
    showReports: uiElements.reports,
    showAdminPanel: uiElements.adminPanel,
    showFeedback: uiElements.feedback
  };
}

// Example 3: Route protection
export function canAccessRoute(userRole: Role, route: string): boolean {
  const routePermissions: Record<string, string> = {
    "/dashboard": "view_dashboard",
    "/users": "edit_users",
    "/billing": "manage_billing",
    "/integrations": "manage_integrations",
    "/reports": "view_reports",
    "/admin": "access_admin_panel",
    "/feedback": "submit_feedback"
  };

  const requiredPermission = routePermissions[route];
  if (!requiredPermission) {
    return true; // No permission required for this route
  }

  return hasPermission(userRole, requiredPermission as any);
}

// Example 4: Action-based permissions
export function canPerformAction(userRole: Role, action: string, resource?: string): boolean {
  const actionPermissions: Record<string, string> = {
    "create_user": "edit_users",
    "delete_user": "edit_users",
    "update_user": "edit_users",
    "view_users": "edit_users",
    "manage_billing": "manage_billing",
    "view_billing": "manage_billing",
    "create_integration": "manage_integrations",
    "delete_integration": "manage_integrations",
    "view_reports": "view_reports",
    "export_reports": "view_reports",
    "access_admin": "access_admin_panel"
  };

  const requiredPermission = actionPermissions[action];
  if (!requiredPermission) {
    return false; // Unknown action, deny by default
  }

  return hasPermission(userRole, requiredPermission as any);
}

// Example 5: Conditional rendering in React components
export function getConditionalProps(userRole: Role) {
  return {
    canEditUsers: hasPermission(userRole, "edit_users"),
    canManageBilling: hasPermission(userRole, "manage_billing"),
    canManageIntegrations: hasPermission(userRole, "manage_integrations"),
    canViewReports: hasPermission(userRole, "view_reports"),
    canAccessAdmin: hasPermission(userRole, "access_admin_panel"),
    canSubmitFeedback: hasPermission(userRole, "submit_feedback"),
    canViewDashboard: hasPermission(userRole, "view_dashboard")
  };
}

// Example 6: API endpoint protection
export function validateApiAccess(userRole: Role, endpoint: string): boolean {
  const endpointPermissions: Record<string, string[]> = {
    "/api/users": ["edit_users"],
    "/api/users/:id": ["edit_users"],
    "/api/billing": ["manage_billing"],
    "/api/integrations": ["manage_integrations"],
    "/api/reports": ["view_reports"],
    "/api/admin": ["access_admin_panel"],
    "/api/feedback": ["submit_feedback"],
    "/api/dashboard": ["view_dashboard"]
  };

  const requiredPermissions = endpointPermissions[endpoint];
  if (!requiredPermissions) {
    return true; // No permission required for this endpoint
  }

  return requiredPermissions.some(permission => 
    hasPermission(userRole, permission as any)
  );
}

// Example usage:
if (import.meta.env.DEV) {
  console.log("=== RBAC Permissions Examples ===");
  
  // Test with different roles
  [Role.Admin, Role.Manager, Role.User, Role.Guest].forEach(role => {
    console.log(`\n--- Testing ${role} role ---`);
    checkUserPermissions(role);
    
    const uiProps = renderUserInterface(role);
    console.log("UI Elements:", uiProps);
    
    console.log("Route access:");
    console.log(`  /dashboard: ${canAccessRoute(role, "/dashboard")}`);
    console.log(`  /users: ${canAccessRoute(role, "/users")}`);
    console.log(`  /admin: ${canAccessRoute(role, "/admin")}`);
    
    console.log("Actions:");
    console.log(`  create_user: ${canPerformAction(role, "create_user")}`);
    console.log(`  manage_billing: ${canPerformAction(role, "manage_billing")}`);
    console.log(`  access_admin: ${canPerformAction(role, "access_admin")}`);
  });
} 