/**
 * Business Profiles Subdomain
 * Handles business profile management and configuration
 */

export * from './components';
export * from './hooks';
export * from './services';
export * from './types';

export interface BusinessProfile {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  location: {
    country: string;
    state?: string;
    city?: string;
  };
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSettings {
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface IntegrationSettings {
  autoSync: boolean;
  syncInterval: number;
  enabledIntegrations: string[];
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
} 