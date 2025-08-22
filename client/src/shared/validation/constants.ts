/**
 * Validation constants and rules for consistent form validation across the application
 */

export const VALIDATION_RULES = {
  // Password validation
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  
  // Username validation
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_REGEX: /^[a-zA-Z0-9_-]+$/,
  
  // Email validation
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Phone validation
  PHONE_REGEX: /^\+?[\d\s-()]+$/,
  
  // URL validation
  URL_REGEX: /^https?:\/\/.+/,
  
  // Name validation
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  
  // Bio/Description validation
  BIO_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 1000,
  
  // Company validation
  COMPANY_NAME_MIN_LENGTH: 2,
  COMPANY_NAME_MAX_LENGTH: 100,
  
  // Job title validation
  JOB_TITLE_MIN_LENGTH: 2,
  JOB_TITLE_MAX_LENGTH: 100,
  
  // Location validation
  LOCATION_MIN_LENGTH: 2,
  LOCATION_MAX_LENGTH: 100,
} as const;

export const VALIDATION_MESSAGES = {
  // Password messages
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must be no more than ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`,
  PASSWORD_INVALID: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  
  // Email messages
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  
  // Name messages
  FIRST_NAME_REQUIRED: 'First name is required',
  FIRST_NAME_TOO_SHORT: `First name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`,
  FIRST_NAME_TOO_LONG: `First name must be no more than ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
  
  LAST_NAME_REQUIRED: 'Last name is required',
  LAST_NAME_TOO_SHORT: `Last name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters`,
  LAST_NAME_TOO_LONG: `Last name must be no more than ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
  
  // Company messages
  COMPANY_NAME_REQUIRED: 'Company name is required',
  COMPANY_NAME_TOO_SHORT: `Company name must be at least ${VALIDATION_RULES.COMPANY_NAME_MIN_LENGTH} characters`,
  COMPANY_NAME_TOO_LONG: `Company name must be no more than ${VALIDATION_RULES.COMPANY_NAME_MAX_LENGTH} characters`,
  
  // Phone messages
  PHONE_INVALID: 'Please enter a valid phone number',
  
  // URL messages
  URL_INVALID: 'Please enter a valid URL',
  
  // Bio/Description messages
  BIO_TOO_LONG: `Bio must be no more than ${VALIDATION_RULES.BIO_MAX_LENGTH} characters`,
  DESCRIPTION_TOO_LONG: `Description must be no more than ${VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} characters`,
  
  // Job title messages
  JOB_TITLE_TOO_SHORT: `Job title must be at least ${VALIDATION_RULES.JOB_TITLE_MIN_LENGTH} characters`,
  JOB_TITLE_TOO_LONG: `Job title must be no more than ${VALIDATION_RULES.JOB_TITLE_MAX_LENGTH} characters`,
  
  // Location messages
  LOCATION_TOO_SHORT: `Location must be at least ${VALIDATION_RULES.LOCATION_MIN_LENGTH} characters`,
  LOCATION_TOO_LONG: `Location must be no more than ${VALIDATION_RULES.LOCATION_MAX_LENGTH} characters`,
  
  // General messages
  FIELD_REQUIRED: 'This field is required',
  FIELD_TOO_SHORT: 'This field is too short',
  FIELD_TOO_LONG: 'This field is too long',
  FIELD_INVALID: 'This field is invalid',
} as const;

export const FORM_DEFAULTS = {
  // Default form states
  IS_LOADING: false,
  IS_SUBMITTING: false,
  IS_VALID: false,
  
  // Default error states
  HAS_ERRORS: false,
  ERROR_MESSAGE: '',
  
  // Default success states
  IS_SUCCESS: false,
  SUCCESS_MESSAGE: '',
} as const;

export const FORM_MODES = {
  // Form validation modes
  ON_CHANGE: 'onChange',
  ON_BLUR: 'onBlur',
  ON_SUBMIT: 'onSubmit',
  ON_TOUCH: 'onTouched',
  ALL: 'all',
} as const;

export const FIELD_TYPES = {
  // Input field types
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  NUMBER: 'number',
  TEL: 'tel',
  URL: 'url',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  DATE: 'date',
  DATETIME: 'datetime-local',
  TIME: 'time',
  FILE: 'file',
} as const;

export const VALIDATION_PATTERNS = {
  // Common validation patterns
  EMAIL: VALIDATION_RULES.EMAIL_REGEX,
  PASSWORD: VALIDATION_RULES.PASSWORD_REGEX,
  PHONE: VALIDATION_RULES.PHONE_REGEX,
  URL: VALIDATION_RULES.URL_REGEX,
  USERNAME: VALIDATION_RULES.USERNAME_REGEX,
} as const; 