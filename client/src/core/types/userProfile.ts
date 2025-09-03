export interface Company {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  logo_url?: string | null;
  settings?: CompanySettings | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CompanySettings {
  theme?: 'light' | 'dark' | 'system';
  branding?: {
    primary_color?: string;
    logo_url?: string;
    custom_css?: string;
  };
  integrations?: {
    enabled_categories?: string[];
    auto_sync?: boolean;
  };
  notifications?: {
    email_enabled?: boolean;
    slack_enabled?: boolean;
    frequency?: 'real-time' | 'daily' | 'weekly';
  };
  security?: {
    enforce_2fa?: boolean;
    session_timeout?: number;
    allowed_domains?: string[];
  };
  [key: string]: unknown; // For extensibility
}

export interface UserProfile {
  id: string; // Same as auth.users.id
  company_id?: string;
  company?: Company;
  
  // Personal Information
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  
  // Contact Information
  phone?: string;
  mobile?: string;
  work_phone?: string;
  personal_email?: string;
  business_email?: string;
  email?: string; // Add missing email field
  
  // Work Information
  role: 'owner' | 'admin' | 'manager' | 'user';
  department?: string;
  job_title?: string;
  employee_id?: string;
  hire_date?: string;
  manager_id?: string;
  direct_reports?: string[];
  
  // Location Information
  timezone: string;
  location?: string;
  work_location?: 'office' | 'remote' | 'hybrid';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  
  // Professional Information
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  skills?: string[];
  certifications?: string[];
  languages?: { language: string; proficiency: 'basic' | 'intermediate' | 'advanced' | 'native' }[];
  experience?: string; // Add missing experience field
  website?: string; // Add missing website field
  
  // Emergency Contact
  emergency_contact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  
  // System Preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
    date_format?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    time_format?: '12h' | '24h';
    currency?: string;
    [key: string]: unknown;
  };
  
  // Status and Metadata
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  last_login?: string;
  onboarding_completed: boolean;
  profile_completion_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  name: string;
  slug: string;
  category: 'crm' | 'payment' | 'email' | 'automation' | 'communication' | 'productivity' | 'accounting';
  description?: string;
  icon_url?: string;
  config_schema?: Record<string, unknown>;
  isactive: boolean;
  createdat: string;
}

export interface UserIntegration {
  id: string;
  userid: string;
  company_id?: string;
  integrationid: string;
  integration?: Integration;
  name?: string; // User-defined name for this integration instance
  config: Record<string, unknown>;
  status: 'active' | 'inactive' | 'error' | 'setup';
  last_sync?: string;
  error_message?: string;
  createdat: string;
  updatedat: string;
}

export interface EnhancedUser {
  // Supabase auth user fields
  id: string;
  email: string;
  email_confirmed_at?: string;
  
  // Enhanced profile fields
  profile?: UserProfile;
  company?: Company;
  integrations?: UserIntegration[];
  
  // Computed fields
  full_name?: string;
  initials?: string;
  can_manage_company?: boolean;
}

export interface UserContextState {
  user: EnhancedUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface UserContextActions {
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
  addIntegration: (
    integration: Omit<UserIntegration, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ) => Promise<void>;
  updateIntegration: (id: string, updates: Partial<UserIntegration>) => Promise<void>;
  removeIntegration: (id: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export type UserContextType = UserContextState & UserContextActions; 

// Enhanced User Management Types
export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  company_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_info: {
    browser?: string;
    os?: string;
    device?: string;
    ip_address?: string;
    location?: string;
  };
  is_active: boolean;
  created_at: string;
  last_activity: string;
  expires_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface UserPermission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: Record<string, unknown>;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

// Multi-factor Authentication
export interface MFASetup {
  id: string;
  user_id: string;
  type: 'totp' | 'sms' | 'email' | 'hardware';
  status: 'pending' | 'active' | 'disabled';
  secret?: string;
  backup_codes?: string[];
  created_at: string;
  last_used?: string;
}

// User Security Settings
export interface UserSecuritySettings {
  user_id: string;
  require_mfa: boolean;
  session_timeout_minutes: number;
  max_concurrent_sessions: number;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
    prevent_common_passwords: boolean;
  };
  login_notifications: boolean;
  suspicious_activity_alerts: boolean;
  created_at: string;
  updated_at: string;
}

// User Onboarding Flow
export interface UserOnboardingStep {
  id: string;
  user_id: string;
  step_name: string;
  status: 'pending' | 'completed' | 'skipped';
  completed_at?: string;
  data?: Record<string, unknown>;
}

export interface UserOnboardingFlow {
  user_id: string;
  current_step: string;
  total_steps: number;
  completed_steps: number;
  started_at: string;
  completed_at?: string;
  steps: UserOnboardingStep[];
}

// User Analytics and Insights
export interface UserAnalytics {
  user_id: string;
  login_count: number;
  last_login: string;
  average_session_duration: number;
  most_used_features: string[];
  productivity_score?: number;
  engagement_level: 'high' | 'medium' | 'low';
  created_at: string;
  updated_at: string;
}

// User Preferences and Settings
export interface UserPreferences {
  user_id: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    in_app: boolean;
  };
  privacy: {
    profile_visibility: 'public' | 'company' | 'private';
    show_online_status: boolean;
    allow_contact_requests: boolean;
  };
  accessibility: {
    high_contrast: boolean;
    font_size: 'small' | 'medium' | 'large';
    screen_reader: boolean;
  };
  integrations: {
    calendar_sync: boolean;
    email_sync: boolean;
    slack_notifications: boolean;
  };
  created_at: string;
  updated_at: string;
} 
