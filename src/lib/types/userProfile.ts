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
  [key: string]: any; // For extensibility
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
    [key: string]: any;
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
  config_schema?: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface UserIntegration {
  id: string;
  user_id: string;
  company_id?: string;
  integration_id: string;
  integration?: Integration;
  name?: string; // User-defined name for this integration instance
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error' | 'setup';
  last_sync?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
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