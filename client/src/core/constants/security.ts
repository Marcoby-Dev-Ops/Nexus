/**
 * Security Configuration
 * @description Centralized security settings and constants
 */

export const SECURITY_CONFIG = {
  // Content Security Policy
  CSP: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Vite dev mode
      "'unsafe-eval'",   // Required for Vite dev mode
      'https://identity.marcoby.com',
      'https://napi.marcoby.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'connect-src': [
      "'self'",
      'https://identity.marcoby.com',
      'https://napi.marcoby.com',
      'https://automate.marcoby.net',
      'wss://identity.marcoby.com',
      'wss://napi.marcoby.com'
    ],
    'frame-src': [
      "'self'",
      'https://identity.marcoby.com'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  },

  // HTTP Security Headers
  HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  },

  // Rate Limiting
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Input Validation Patterns
  VALIDATION: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
    API_KEY: /^[a-zA-Z0-9_-]{20,}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  },

  // Session Security
  SESSION: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  },

  // Encryption Settings
  ENCRYPTION: {
    algorithm: 'AES-GCM',
    keyLength: 256,
    iterations: 100000,
    saltLength: 16,
    ivLength: 12
  },

  // Audit Logging
  AUDIT: {
    enabled: true,
    level: 'info',
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'key',
      'credential'
    ]
  }
};

export const STORAGE_CONFIG = {
  // Keys that should be encrypted in localStorage
  SENSITIVEKEYS: [
    'nexus_user_context',
    'teams_tokens',
    'nexus_success_criteria',
    'ga4_config',
    'auth_tokens',
    'api_keys',
    'user_preferences',
    'session_data'
  ] as const,

  // Storage prefixes
  PREFIXES: {
    SECURE: 'secure_',
    TEMP: 'temp_',
    CACHE: 'cache_'
  },

  // Expiration times (in milliseconds)
  EXPIRATION: {
    SESSION: 24 * 60 * 60 * 1000, // 24 hours
    CACHE: 60 * 60 * 1000,        // 1 hour
    TEMP: 5 * 60 * 1000           // 5 minutes
  }
};

export const API_SECURITY = {
  // API endpoints that require authentication
  PROTECTED_ENDPOINTS: [
    '/api/user',
    '/api/company',
    '/api/integrations',
    '/api/ai',
    '/api/analytics'
  ],

  // API endpoints that require specific roles
  ROLE_REQUIRED: {
    '/api/admin': ['admin'],
    '/api/company/settings': ['owner', 'admin'],
    '/api/integrations/manage': ['owner', 'admin', 'manager']
  },

  // Rate limiting by endpoint
  RATE_LIMITS: {
    '/api/auth/login': { max: 5, windowMs: 15 * 60 * 1000 },
    '/api/ai/chat': { max: 50, windowMs: 60 * 1000 },
    '/api/integrations': { max: 20, windowMs: 60 * 1000 }
  }
};

// Security utility functions
export const SecurityUtils = {
  /**
   * Sanitize data for logging (remove sensitive fields)
   */
  sanitizeForLogging: (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    SECURITY_CONFIG.AUDIT.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  },

  /**
   * Validate input against security patterns
   */
  validateInput: (input: string, type: keyof typeof SECURITY_CONFIG.VALIDATION): boolean => {
    const pattern = SECURITY_CONFIG.VALIDATION[type];
    return pattern.test(input);
  },

  /**
   * Generate secure random string
   */
  generateSecureToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
    
    return result;
  }
}; 
