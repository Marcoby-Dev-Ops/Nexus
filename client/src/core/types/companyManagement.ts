/**
 * World-Class Company Management Types
 * 
 * Extends user management with comprehensive organizational structure,
 * inspired by Google Workspace, Microsoft 365, and modern SaaS platforms.
 */

import type { UserProfile } from './userProfile';

// Company Management Types
export interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  logo_url?: string;
  website?: string;
  description?: string;
  owner_id?: string;
  
  // Business Information
  business_phone?: string;
  duns_number?: string;
  employee_count?: number;
  founded?: string;
  headquarters?: string;
  fiscal_year_end?: string;
  growth_stage?: string;
  
  // Social and Marketing
  social_profiles?: string[];
  specialties?: string[];
  followers_count?: number;
  client_base_description?: string;
  
  // Business Metrics
  mrr?: number;
  burn_rate?: number;
  cac?: number;
  gross_margin?: number;
  csat?: number;
  avg_deal_cycle_days?: number;
  avg_first_response_mins?: number;
  on_time_delivery_pct?: number;
  website_visitors_month?: number;
  
  // Integrations and Systems
  microsoft_365?: Microsoft365Config;
  business_licenses?: BusinessLicense[];
  inventory_management_system?: string;
  hubspotid?: string;
  
  // Settings and Configuration
  settings: CompanySettings;
  address?: Address;
  key_metrics?: Record<string, unknown>;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// Department Management
export interface Department {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  manager_id?: string;
  parent_department_id?: string;
  budget?: number;
  headcount?: number;
  goals?: string[];
  created_at: string;
  updated_at: string;
  
  // Relationships
  manager?: UserProfile;
  parent_department?: Department;
  sub_departments?: Department[];
  members?: UserProfile[];
}

// Role and Permission Management
export interface CompanyRole {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCompanyRole {
  id: string;
  user_id: string;
  company_id: string;
  role_id: string;
  department_id?: string;
  is_primary: boolean;
  assigned_by: string;
  assigned_at: string;
  expires_at?: string;
  
  // Relationships
  role?: CompanyRole;
  department?: Department;
  user?: UserProfile;
}

// Company Settings
export interface CompanySettings {
  // Security
  require_mfa: boolean;
  session_timeout_minutes: number;
  password_policy: PasswordPolicy;
  ip_whitelist?: string[];
  
  // Features
  enabled_features: string[];
  disabled_features: string[];
  
  // Integrations
  integrations: CompanyIntegration[];
  
  // Notifications
  notification_settings: CompanyNotificationSettings;
  
  // Compliance
  compliance_settings: ComplianceSettings;
  
  // Branding
  branding: CompanyBranding;
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  prevent_common_passwords: boolean;
  max_age_days?: number;
  prevent_reuse_count?: number;
}

export interface CompanyIntegration {
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  last_sync?: string;
  status: 'active' | 'error' | 'disabled';
}

export interface CompanyNotificationSettings {
  email_notifications: boolean;
  slack_notifications: boolean;
  sms_notifications: boolean;
  in_app_notifications: boolean;
  notification_channels: string[];
}

export interface ComplianceSettings {
  data_retention_days: number;
  audit_logging: boolean;
  gdpr_compliance: boolean;
  soc2_compliance: boolean;
  hipaa_compliance: boolean;
}

export interface CompanyBranding {
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  favicon_url?: string;
  custom_css?: string;
  custom_js?: string;
}

// Microsoft 365 Integration
export interface Microsoft365Config {
  tenant_id?: string;
  client_id?: string;
  client_secret?: string;
  subscription_type?: string;
  enabled_services: string[];
  sync_enabled: boolean;
  last_sync?: string;
}

// Business Licenses
export interface BusinessLicense {
  license_type: string;
  license_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'pending';
  documents?: string[];
}

// Address Information
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

// Company Analytics
export interface CompanyAnalytics {
  company_id: string;
  total_users: number;
  active_users: number;
  inactive_users: number;
  departments_count: number;
  avg_session_duration: number;
  most_used_features: string[];
  user_engagement_score: number;
  security_score: number;
  compliance_score: number;
  created_at: string;
  updated_at: string;
}

// Company Invitations
export interface CompanyInvitation {
  id: string;
  company_id: string;
  email: string;
  role_id: string;
  department_id?: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  accepted_by?: string;
  
  // Relationships
  company?: Company;
  role?: CompanyRole;
  department?: Department;
  invited_by_user?: UserProfile;
  accepted_by_user?: UserProfile;
}

// Company Audit Log
export interface CompanyAuditLog {
  id: string;
  company_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  
  // Relationships
  user?: UserProfile;
  company?: Company;
}

// Company Workflows
export interface CompanyWorkflow {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  type: 'onboarding' | 'offboarding' | 'approval' | 'custom';
  steps: WorkflowStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  name: string;
  description?: string;
  type: 'task' | 'approval' | 'notification' | 'integration';
  order: number;
  assignee_type: 'user' | 'role' | 'department' | 'manager';
  assignee_id?: string;
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  is_required: boolean;
  estimated_duration_hours?: number;
}

// Company Templates
export interface CompanyTemplate {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  type: 'email' | 'document' | 'workflow' | 'integration';
  content: Record<string, unknown>;
  variables?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Company Reports
export interface CompanyReport {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  type: 'user_activity' | 'security' | 'compliance' | 'analytics';
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  config: Record<string, unknown>;
  last_generated?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Company Permissions
export interface CompanyPermission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: Record<string, unknown>;
  company_id?: string;
  is_system_permission: boolean;
  created_at: string;
}

// Company Billing
export interface CompanyBilling {
  id: string;
  company_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trial';
  current_period_start: string;
  current_period_end: string;
  amount: number;
  currency: string;
  next_billing_date?: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
}

// Company Usage
export interface CompanyUsage {
  id: string;
  company_id: string;
  feature: string;
  usage_count: number;
  limit?: number;
  period: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  created_at: string;
}

// Company Health
export interface CompanyHealth {
  id: string;
  company_id: string;
  overall_score: number;
  security_score: number;
  compliance_score: number;
  user_engagement_score: number;
  system_health_score: number;
  recommendations: string[];
  last_assessment: string;
  next_assessment: string;
  created_at: string;
  updated_at: string;
}

// Company Settings Extensions
export interface CompanyUserSettings {
  company_id: string;
  user_id: string;
  role_id: string;
  department_id?: string;
  permissions: string[];
  restrictions: string[];
  custom_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Company Integration Data
export interface CompanyIntegrationData {
  id: string;
  company_id: string;
  integration_name: string;
  data_type: string;
  data: Record<string, unknown>;
  sync_status: 'pending' | 'synced' | 'error';
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

// Company Notification
export interface CompanyNotification {
  id: string;
  company_id: string;
  user_id?: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  expires_at?: string;
  created_at: string;
  
  // Relationships
  user?: UserProfile;
  company?: Company;
}

// Company Export Types
export type CompanyExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';

export interface CompanyExportRequest {
  id: string;
  company_id: string;
  requested_by: string;
  export_type: 'users' | 'departments' | 'analytics' | 'audit_log';
  format: CompanyExportFormat;
  filters?: Record<string, unknown>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  created_at: string;
  completed_at?: string;
  
  // Relationships
  company?: Company;
  requested_by_user?: UserProfile;
} 
