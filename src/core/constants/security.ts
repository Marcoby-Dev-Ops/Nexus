/**
 * Security Configuration Constants
 * @description Centralized security settings and validation rules
 */

// Environment validation
export const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

// Security headers for API requests
export const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;

// LocalStorage security settings
export const STORAGE_CONFIG = {
  // Keys that should be encrypted
  SENSITIVEKEYS: [
    'nexus_user_context',
    'nexus_success_criteria',
    'teams_tokens',
    'ga4_config',
  ],
  // Maximum age for stored data (in milliseconds)
  MAXAGE: 24 * 60 * 60 * 1000, // 24 hours
  // Keys to exclude from cleanup
  SYSTEMKEYS: [
    'vite-ui-theme',
  ],
} as const;

// API rate limiting
export const RATE_LIMITS = {
  DEFAULT: 100, // requests per minute
  AUTH: 5,      // auth attempts per minute
  CHAT: 20,     // chat messages per minute
} as const;

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // eslint-disable-next-line no-useless-escape
  PHONE: /^\+?[\d\s\-\(\)]+$/,
   
  URL: /^https?:\/\/.+/,
  // Prevent XSS in user inputs
  // eslint-disable-next-line no-useless-escape
  SAFETEXT: /^[a-zA-Z0-9\s\-_.,!?@#$%^&*()+={}[\]:";'<>\/\\|`~]*$/,
} as const;

// Content Security Policy
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https: //js.stripe.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https: //fonts.googleapis.com'],
  'font-src': ["'self'", 'https: //fonts.gstatic.com'],
  'img-src': ["'self'", 'data: ', 'https: '],
  'connect-src': [
    "'self'",
    'https: //kqclbpimkraenvbffnpk.supabase.co',
    'https: //api.stripe.com',
  ],
  'frame-src': ['https: //js.stripe.com'],
} as const;

// Production security checks
export const SECURITY_CHECKS = {
  // Disable console.log in production
  DISABLECONSOLE_IN_PROD: true,
  // Enable HTTPS redirect
  FORCEHTTPS: true,
  // Enable secure cookies
  SECURECOOKIES: true,
} as const; 