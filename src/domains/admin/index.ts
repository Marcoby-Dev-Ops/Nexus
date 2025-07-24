/**
 * Admin Domain - Main Index
 * Consolidates all admin functionality including user management, billing, and system administration
 */

// Admin Components
// useAuth is now provided by AuthProvider
export { BackendHealthMonitor } from './components/BackendHealthMonitor';

// Admin Services
export { billingService } from './services/billingService';
export { userService } from './services/userService';
export { userDataService } from './services/userDataService';
export { profileContextService } from './services/profileContextService';
export { securityManager } from './services/security';

// Admin Types
export interface AdminConfig {
  enableUserManagement: boolean;
  enableBilling: boolean;
  enableSystemMonitoring: boolean;
  permissions: string[];
} 