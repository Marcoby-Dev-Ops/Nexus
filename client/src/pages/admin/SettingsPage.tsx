import React, { lazy, useEffect } from 'react';
import { UnifiedSettingsPage } from '@/shared/components/patterns/UnifiedPages';
import SecuritySettings from './SecuritySettings';
import NotificationsSettings from './NotificationsSettings';
import IntegrationsSettings from './IntegrationsSettings';
import DataPrivacySettings from './DataPrivacySettings';
import AppearanceSettings from './AppearanceSettings';
import AdvancedSettings from './AdvancedSettings';
import AIModelSettings from './AIModelSettings';
import BillingSettings from './BillingSettings';
import { ContinuousImprovementDashboard } from '@/lib/ai/components/ContinuousImprovementDashboard';
import { useAuth } from '@/hooks/index';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';

// AI Performance Settings Component
const AIPerformanceSettings = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">AI Performance & Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Monitor your AI usage, track improvements, and view detailed analytics.
        </p>
      </div>
      <ContinuousImprovementDashboard userId={user?.id || ''} timeframe="week" />
    </div>
  );
};

// Placeholder components for new sections
const TeamSettings = () => <div>Team & access management coming soon.</div>;

const CompanyProfilePage = lazy(() => import('./CompanyProfilePage').then(m => ({ default: m.CompanyProfilePage })));
const UserProfilePage = lazy(() => import('./UserProfilePage').then(m => ({ default: m.UserProfilePage })));

const settingsConfig = {
  title: 'Settings',
  description: 'Manage your account and application preferences',
  sections: [
    {
      id: 'user-profile',
      title: 'User Profile',
      description: 'Manage your personal information',
      component: UserProfilePage,
    },
    {
      id: 'company-profile',
      title: 'Company Profile',
      description: 'View and edit your company information',
      component: CompanyProfilePage,
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Manage your account security and privacy settings',
      component: SecuritySettings,
    },
    {
      id: 'ai-models',
      title: 'AI Models & Keys',
      description: 'Configure AI models and manage API keys',
      component: AIModelSettings,
    },
    {
      id: 'ai-performance',
      title: 'AI Performance',
      description: 'Monitor AI usage, performance metrics, and improvements',
      component: AIPerformanceSettings,
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
      description: 'Manage your plan, payment methods, and usage',
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
  const { setHeaderContent, clearHeaderContent } = useHeaderContext();

  useEffect(() => {
    // Move the page title to the main header and remove a subtitle/description
    setHeaderContent(settingsConfig.title, undefined, null);

    return () => clearHeaderContent();
  }, []);

  return <UnifiedSettingsPage config={settingsConfig} />;
};

export default SettingsPage; 
