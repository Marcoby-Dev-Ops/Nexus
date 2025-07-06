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
export interface ApiResponse<T = unknown> {
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
  validation?: (value: unknown) => string | undefined;
  options?: { label: string; value: string }[];
}

// Error handling
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
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
export interface MockData<T = unknown> {
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

/**
 * Centralized Type Exports for Nexus
 * Pillar: 2 - Minimum Lovable Feature Set
 * 
 * This file centralizes all type exports for better import organization
 */

// Core database types
export type { Database } from '../core/database.types';

// Enhanced database types with improved type safety
export * from './database-enhanced';

// User and company types  
export type { 
  Company, 
  CompanySettings, 
  UserProfile, 
  EnhancedUser, 
  UserContextState, 
  UserContextActions, 
  UserContextType 
} from './userProfile';

// Domain-specific types (avoiding conflicts)
export type { 
  ThoughtCategory, 
  ThoughtStatus, 
  ThoughtRelationship
} from './thoughts';
export * from './billing';
export * from './integrations';

// Legacy compatibility  
// export * from './database-fixes'; 