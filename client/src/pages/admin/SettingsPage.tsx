import React, { lazy } from 'react';
import { UnifiedSettingsPage } from '@/shared/components/patterns/UnifiedPages';
import { Separator } from '@/shared/components/ui/Separator';
import SecuritySettings from './SecuritySettings';
import NotificationsSettings from './NotificationsSettings';
import IntegrationsSettings from './IntegrationsSettings';
import DataPrivacySettings from './DataPrivacySettings';
import AppearanceSettings from './AppearanceSettings';
import AdvancedSettings from './AdvancedSettings';
import AIModelSettings from './AIModelSettings';
import BillingSettings from './BillingSettings';

import {
  User,
  Globe,
  Shield,
  Link,
  Bell,
  Palette,
  CreditCard,
  Lock,
  Cpu,
  Layers
} from 'lucide-react';

// Lazy loaded profile components
const CompanyProfilePage = lazy(() => import('./CompanyProfilePage').then(m => ({ default: m.CompanyProfilePage })));
const UserProfilePage = lazy(() => import('./UserProfilePage').then(m => ({ default: m.UserProfilePage })));

// Placeholder/Future components
const TeamSettings = () => <div>Team & access management settings can be managed here.</div>;

// Section Wrappers for Consolidation
const AccountSection = () => (
  <div className="space-y-8">
    <UserProfilePage />
    <Separator />
    <AppearanceSettings />
  </div>
);

const OrganizationSection = () => (
  <div className="space-y-8">
    <CompanyProfilePage />
    <Separator />
    <TeamSettings />
    <Separator />
    <BillingSettings />
  </div>
);

const SecurityPrivacySection = () => (
  <div className="space-y-8">
    <SecuritySettings />
    <Separator />
    <DataPrivacySettings />
  </div>
);

const ConnectionsAPISection = () => (
  <div className="space-y-8">
    <AIModelSettings />
    <Separator />
    <IntegrationsSettings />
    <Separator />
    <AdvancedSettings />
  </div>
);

const settingsConfig = {
  title: 'Settings',
  description: 'Manage your personal, organizational, and application preferences',
  sections: [
    {
      id: 'account',
      title: 'Account',
      description: 'Personal information and interface appearance',
      component: AccountSection,
      icon: User,
      hideWrapperCard: true,
    },
    {
      id: 'organization',
      title: 'Organization',
      description: 'Company details, team management, and billing',
      component: OrganizationSection,
      icon: Globe,
      hideWrapperCard: true,
    },
    {
      id: 'security-privacy',
      title: 'Security & Privacy',
      description: 'Account protection, sessions, and data management',
      component: SecurityPrivacySection,
      icon: Shield,
      hideWrapperCard: true,
    },
    {
      id: 'connections',
      title: 'Connections & API',
      description: 'Integrations, AI models, and developer tools',
      component: ConnectionsAPISection,
      icon: Link,
      hideWrapperCard: true,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Notification preferences for email, push, and in-app',
      component: NotificationsSettings,
      icon: Bell,
    },
  ],
};

const SettingsPage: React.FC = () => {
  return <UnifiedSettingsPage config={settingsConfig} />;
};

export default SettingsPage;

