/**
 * @file constants/index.ts
 * @description Application-wide constants and configuration
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_SUPABASE_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Route Constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  AUTH_CALLBACK: '/auth/callback',
  
  // Departments
  FINANCE: '/finance',
  SALES: '/sales', 
  OPERATIONS: '/operations',
  MARKETING: '/marketing',
  
  // Features
  MARKETPLACE: '/marketplace',
  DATA_WAREHOUSE: '/data-warehouse',
} as const;

// UI Constants
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  MOBILE_BREAKPOINT: 768,
  TOAST_DURATION: 5000,
  MODAL_Z_INDEX: 1000,
  TOOLTIP_DELAY: 500,
} as const;

// Testing Constants
export const TEST_IDS = {
  SIDEBAR: 'sidebar',
  HEADER: 'header',
  MAIN_CONTENT: 'main-content',
  LOADING_SPINNER: 'loading-spinner',
  ERROR_BOUNDARY: 'error-boundary',
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
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s-()]+$/,
} as const;

// Date and Time
export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: 'yyyy-MM-dd',
  TIME_ONLY: 'h:mm a',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully!',
  CREATED: 'Item created successfully!',
  UPDATED: 'Item updated successfully!',
  DELETED: 'Item deleted successfully!',
  LOGGED_IN: 'Welcome back!',
  LOGGED_OUT: 'You have been logged out.',
} as const;

// File Upload
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  USER_DATA_TTL: 15 * 60 * 1000, // 15 minutes
  STATIC_DATA_TTL: 60 * 60 * 1000, // 1 hour
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  PAGE_TRANSITION: 200,
} as const; 