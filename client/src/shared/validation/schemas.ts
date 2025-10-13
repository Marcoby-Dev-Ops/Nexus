import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number');
const urlSchema = z.string().url('Please enter a valid URL').optional().or(z.literal(''));
// Basic domain validation: labels and TLD, no protocol
const domainSchema = z
  .string()
  .regex(/^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/i, 'Please enter a valid domain (e.g., example.com)')
  .optional()
  .or(z.literal(''));

// Helpers to treat empty strings as undefined for optional fields
const emptyToUndefined = <T>(schema: z.ZodType<T>) =>
  z.preprocess((val) => (val === '' ? undefined : val), schema.optional());

const optionalStringMin = (min: number, message: string) =>
  emptyToUndefined(z.string().min(min, message));

const optionalEmail = emptyToUndefined(emailSchema);
const optionalPhone = emptyToUndefined(phoneSchema);

const optionalRole = z.preprocess(
  (val) => (val === '' ? undefined : val),
  z.enum(['user', 'owner', 'admin', 'manager']).optional()
);

// User Profile Schema
export const userProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').or(z.literal('')),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').or(z.literal('')),
  displayName: optionalStringMin(2, 'Display name must be at least 2 characters'),
  jobTitle: optionalStringMin(2, 'Job title must be at least 2 characters'),
  company: optionalStringMin(2, 'Company name must be at least 2 characters'),
  role: optionalRole,
  department: optionalStringMin(2, 'Department must be at least 2 characters'),
  businessEmail: optionalEmail,
  personalEmail: optionalEmail,
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  location: optionalStringMin(2, 'Location must be at least 2 characters'),
  website: urlSchema,
  phone: optionalPhone,
  chatTone: z.string().optional(),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

// Company Profile Schema
export const companyProfileSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(2, 'Industry is required'),
  size: z.string().min(1, 'Company size is required'),
  website: urlSchema,
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  clientbase_description: z.string().max(500, 'Client description must be 500 characters or less').optional(),
});

export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

// Authentication Schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Settings Schemas
export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  marketingEmails: z.boolean(),
  weeklyDigest: z.boolean(),
});

export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

export const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'team']),
  dataSharing: z.boolean(),
  analyticsTracking: z.boolean(),
});

export type PrivacySettingsFormData = z.infer<typeof privacySettingsSchema>;

// Integration Schemas
export const integrationSetupSchema = z.object({
  name: z.string().min(2, 'Integration name must be at least 2 characters'),
  apiKey: z.string().min(1, 'API key is required'),
  webhookUrl: urlSchema.optional(),
  settings: z.record(z.any()).optional(),
});

export type IntegrationSetupFormData = z.infer<typeof integrationSetupSchema>;

// User Preferences Schema
export const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'], {
    required_error: 'Please select a theme',
  }),
  language: z.string().min(2, 'Language must be at least 2 characters'),
  timezone: z.string().min(1, 'Timezone is required'),
  notifications_enabled: z.boolean(),
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  sidebar_collapsed: z.boolean(),
});

export type UserPreferencesFormData = z.infer<typeof userPreferencesSchema>;

// Search and Filter Schemas
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
});

export type SearchFiltersFormData = z.infer<typeof searchFiltersSchema>;

// Multi-step Signup Schema for the current signup flow
export const multiStepSignupSchema = z.object({
  // Business Info Step
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100, 'Business name must be 100 characters or less'),
  businessType: z.string().min(1, 'Business type is required'),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().min(1, 'Company size is required'),
  website: urlSchema, // optional URL
  domain: domainSchema, // optional domain
  
  // Conditional fields
  fundingStage: z.string().optional(),
  revenueRange: z.string().optional(),
  teamSize: z.string().optional(),
  
  // Contact Info Step
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be 50 characters or less'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be 50 characters or less'),
  email: emailSchema,
  phone: optionalPhone,
});

export type MultiStepSignupFormData = z.infer<typeof multiStepSignupSchema>;

// Individual step schemas for real-time validation
export const businessInfoSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100, 'Business name must be 100 characters or less'),
  businessType: z.string().min(1, 'Business type is required'),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().min(1, 'Company size is required'),
  website: urlSchema, // optional URL
  domain: domainSchema,
  fundingStage: z.string().optional(),
  revenueRange: z.string().optional(),
  teamSize: z.string().optional(),
});

export const contactInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name must be 50 characters or less'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name must be 50 characters or less'),
  email: emailSchema,
  phone: optionalPhone,
});

// Enhanced validation with conditional requirements
export const conditionalBusinessInfoSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100, 'Business name must be 100 characters or less'),
  businessType: z.string().min(1, 'Business type is required'),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().min(1, 'Company size is required'),
  fundingStage: z.string().optional(),
  revenueRange: z.string().optional(),
  teamSize: z.string().optional(),
}).refine((data) => {
  // Conditional validation for funding stage
  if (['startup', 'small-business'].includes(data.businessType) && !data.fundingStage) {
    return false;
  }
  return true;
}, {
  message: "Funding stage is required for startups and small businesses",
  path: ["fundingStage"],
}).refine((data) => {
  // Conditional validation for revenue range
  if (['startup', 'small-business', 'medium-business'].includes(data.businessType) && !data.revenueRange) {
    return false;
  }
  return true;
}, {
  message: "Revenue range is required for startups, small businesses, and medium businesses",
  path: ["revenueRange"],
});

// Export all schemas for easy importing
export const schemas = {
  userProfile: userProfileSchema,
  companyProfile: companyProfileSchema,
  login: loginSchema,
  signup: signupSchema,
  resetPassword: resetPasswordSchema,
  notificationSettings: notificationSettingsSchema,
  privacySettings: privacySettingsSchema,
  integrationSetup: integrationSetupSchema,
  searchFilters: searchFiltersSchema,
} as const; 
