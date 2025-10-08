/**
 * @file constants/index.ts
 * @description Application-wide constants and configuration
 */

import { getEnv } from '@/core/environment';

// API Configuration
export const API_CONFIG = {
  BASEURL: getEnv().api.url,
  TIMEOUT: 30000,
  RETRYATTEMPTS: 3,
  RETRYDELAY: 1000,
} as const;

// Route Constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  AUTHCALLBACK: '/auth/callback',
  
  // Departments
  FINANCE: '/finance',
  SALES: '/sales', 
  OPERATIONS: '/operations',
  MARKETING: '/marketing',
  
  // Features
  MARKETPLACE: '/marketplace',
  DATAWAREHOUSE: '/data-warehouse',
} as const;

// UI Constants
export const UI_CONFIG = {
  SIDEBARWIDTH: 256,
  HEADERHEIGHT: 64,
  MOBILEBREAKPOINT: 768,
  TOASTDURATION: 5000,
  MODALZ_INDEX: 1000,
  TOOLTIPDELAY: 500,
} as const;

// Testing Constants
export const TEST_IDS = {
  SIDEBAR: 'sidebar',
  HEADER: 'header',
  MAINCONTENT: 'main-content',
  LOADINGSPINNER: 'loading-spinner',
  ERRORBOUNDARY: 'error-boundary',
} as const;

// Feature Flags (default values)
export const DEFAULT_FEATURES = {
  multiAgent: false,
  microsoftOAuth: false,
  aiAssistants: true,
  marketplace: true,
  analytics: true,
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORDMIN_LENGTH: 8,
  USERNAMEMIN_LENGTH: 3,
  EMAILREGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONEREGEX: /^\+?[\d\s-()]+$/,
} as const;

// Date and Time
export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  WITHTIME: 'MMM d, yyyy h: mm a',
  ISO: 'yyyy-MM-dd',
  TIMEONLY: 'h:mm a',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORKERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOTFOUND: 'The requested resource was not found.',
  VALIDATIONERROR: 'Please check your input and try again.',
  GENERICERROR: 'Something went wrong. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully!',
  CREATED: 'Item created successfully!',
  UPDATED: 'Item updated successfully!',
  DELETED: 'Item deleted successfully!',
  LOGGEDIN: 'Welcome back!',
  LOGGEDOUT: 'You have been logged out.',
} as const;

// File Upload
export const UPLOAD_CONFIG = {
  MAXFILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWEDIMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWEDDOCUMENT_TYPES: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
} as const;

// Pagination
export const PAGINATION = {
  DEFAULTPAGE_SIZE: 20,
  MAXPAGE_SIZE: 100,
  PAGESIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULTTTL: 5 * 60 * 1000, // 5 minutes
  USERDATA_TTL: 15 * 60 * 1000, // 15 minutes
  STATICDATA_TTL: 60 * 60 * 1000, // 1 hour
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  PAGETRANSITION: 200,
} as const; 
