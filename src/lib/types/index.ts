/**
 * @file types/index.ts
 * @description Centralized type definitions for the Nexus application
 */
// Re-export all types from different modules
// Note: Individual type modules can be added here when needed

// Common UI component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// API Response patterns
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

// User roles and permissions
export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export interface UserPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canCreate: boolean;
  canView: boolean;
}

// Feature flags
export interface FeatureFlags {
  multiAgent: boolean;
  microsoftOAuth: boolean;
  aiAssistants: boolean;
  marketplace: boolean;
  analytics: boolean;
}

// Navigation and routing
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ComponentType;
  badge?: string | number;
  children?: NavigationItem[];
  requiredRole?: UserRole;
}

// Form handling
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  validation?: (value: any) => string | undefined;
  options?: { label: string; value: string }[];
}

// Error handling
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Theme and styling
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  borderRadius: string;
}

// Testing types
export interface MockData<T = any> {
  data: T;
  loading?: boolean;
  error?: string | null;
}

// Module configuration
export interface ModuleConfig {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  dependencies?: string[];
  permissions: UserPermissions;
} 