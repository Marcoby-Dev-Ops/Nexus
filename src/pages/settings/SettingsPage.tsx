import React from 'react';
import { UnifiedSettingsPage } from '@/components/patterns/UnifiedPages';
import AccountSettings from './AccountSettings';
import SecuritySettings from './SecuritySettings';
import NotificationsSettings from './NotificationsSettings';
import IntegrationsSettings from './IntegrationsSettings';
import DataPrivacySettings from './DataPrivacySettings';
import AppearanceSettings from './AppearanceSettings';
import AdvancedSettings from './AdvancedSettings';

// Placeholder components for new sections
const BillingSettings = () => <div>Billing & subscription management coming soon.</div>;
const TeamSettings = () => <div>Team & access management coming soon.</div>;

const settingsConfig = {
  title: 'Settings',
  description: 'Manage your account and application preferences',
  sections: [
    {
      id: 'profile',
      title: 'Profile & Preferences',
      description: 'Manage your personal information and preferences',
      component: AccountSettings,
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Manage your account security and privacy settings',
      component: SecuritySettings,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Set your notification preferences',
      component: NotificationsSettings,
    },
    {
      id: 'billing',
      title: 'Billing & Subscription',
      description: 'Manage your plan, payment methods, and invoices',
      component: BillingSettings,
    },
    {
      id: 'team',
      title: 'Team & Access',
      description: 'Manage team members, roles, and permissions',
      component: TeamSettings,
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Manage connected apps and integrations',
      component: IntegrationsSettings,
    },
    {
      id: 'data-privacy',
      title: 'Data & Privacy',
      description: 'Export your data and manage privacy settings',
      component: DataPrivacySettings,
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize your theme and layout preferences',
      component: AppearanceSettings,
    },
    {
      id: 'advanced',
      title: 'Advanced/Developer',
      description: 'API tokens, developer tools, and audit logs',
      component: AdvancedSettings,
    },
  ],
};

const SettingsPage: React.FC = () => {
  return <UnifiedSettingsPage config={settingsConfig} />;
};

export default SettingsPage; 