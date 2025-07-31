import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Please enter a valid phone number');
const urlSchema = z.string().url('Please enter a valid URL').optional().or(z.literal(''));

// User Profile Schema
export const userProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  jobTitle: z.string().min(2, 'Job title must be at least 2 characters').optional(),
  company: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  role: z.string().min(1, 'Role is required').optional(),
  department: z.string().min(2, 'Department must be at least 2 characters').optional(),
  businessEmail: emailSchema.optional(),
  personalEmail: emailSchema.optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  location: z.string().min(2, 'Location must be at least 2 characters').optional(),
  website: urlSchema,
  phone: phoneSchema.optional(),
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