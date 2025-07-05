import React from 'react';
import { PageTemplates } from '../../components/patterns/PageTemplates';
import { ContentCard } from '../../components/patterns/ContentCard';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import AccountSettings from './AccountSettings';
import SecuritySettings from './SecuritySettings';

// Analytics hook placeholder (implement as needed)
const useSettingsAnalytics = (tab: string) => {
  React.useEffect(() => {
    // TODO: Replace with real analytics event
    // analytics.track('settings_tab_view', { tab });
  }, [tab]);
};

const SettingsPage: React.FC = () => {
  const [tab, setTab] = React.useState('overview');
  useSettingsAnalytics(tab);

  return (
    <ErrorBoundary>
      <PageTemplates.Settings>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-6">Manage your account and application preferences</p>
        <Tabs value={tab} onValueChange={setTab} defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="advice">Advice</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="space-y-8">
              <ContentCard title="Profile & Preferences">
                <AccountSettings />
              </ContentCard>
              <ContentCard title="Security & Privacy">
                <SecuritySettings />
              </ContentCard>
            </div>
          </TabsContent>
          <TabsContent value="advice">
            <ContentCard title="Personalized Advice">
              <div className="text-muted-foreground">
                {/* TODO: Integrate AI-powered recommendations */}
                <p>AI-powered security, personalization, and best practice recommendations will appear here.</p>
              </div>
            </ContentCard>
          </TabsContent>
          <TabsContent value="resources">
            <ContentCard title="Resources & Actions">
              <div className="space-y-4">
                {/* TODO: Add real links and actions */}
                <a href="/user-guide" className="text-primary underline">User Guide</a>
                <a href="/support" className="text-primary underline">Contact Support</a>
                <a href="/settings/data-export" className="text-primary underline">Export My Data</a>
                <a href="/settings/delete-account" className="text-destructive underline">Delete My Account</a>
              </div>
            </ContentCard>
          </TabsContent>
        </Tabs>
      </PageTemplates.Settings>
    </ErrorBoundary>
  );
};

export default SettingsPage; 