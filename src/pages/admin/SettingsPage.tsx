import React, { lazy } from 'react';
import { UnifiedSettingsPage } from '@/shared/components/patterns/UnifiedPages';
import SecuritySettings from '@/components/admin/user/pages/SecuritySettings';
import NotificationsSettings from '@/components/admin/user/pages/NotificationsSettings';
import IntegrationsSettings from '@/components/admin/user/pages/IntegrationsSettings';
import DataPrivacySettings from '@/components/admin/user/pages/DataPrivacySettings';
import AppearanceSettings from '@/components/admin/user/pages/AppearanceSettings';
import AdvancedSettings from '@/components/admin/user/pages/AdvancedSettings';
import AIModelSettings from '@/components/admin/user/pages/AIModelSettings';
import BillingSettings from '@/components/admin/user/pages/BillingSettings';
import { ContinuousImprovementDashboard } from '@/components/ai/ContinuousImprovementDashboard';
import { useAuth } from '@/hooks/index';

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

const CompanyProfilePage = lazy(() => import('@/domains/admin/user/pages/CompanyProfilePage').then(m => ({ default: m.default })));

const settingsConfig = {
  title: 'Settings',
  description: 'Manage your account and application preferences',
  sections: [
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
  return <UnifiedSettingsPage config={settingsConfig} />;
};

export default SettingsPage; 