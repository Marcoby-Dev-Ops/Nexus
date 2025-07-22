import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/shared/components/ui/theme-provider';

// Layout Components
import { UnifiedLayout } from '@/shared/components/layout/UnifiedLayout';
import { HelpLayout } from '@/shared/layouts/HelpLayout';
import { AppWithOnboarding } from '@/shared/components/layout/AppWithOnboarding';

// Providers
import { NotificationProvider } from '@/core/hooks/NotificationContext';
import { SystemContextProvider } from '@/core/hooks/SystemContext';
import { OnboardingProvider } from '@/domains/admin/onboarding/hooks/OnboardingContext';
import { FireCycleProvider } from '@/core/fire-cycle/FireCycleProvider';

// Storage cleanup
import { cleanupCorruptedStorage } from '@/core/auth/secureStorage';

// Callback system

// Session debug panel moved to debug page

// Lazy‑loaded Pages
const AIHubPage         = React.lazy(() => import('@/domains/ai/pages/AIHubPage'));
const WorkspacePage     = React.lazy(() => import('@/domains/workspace/pages/WorkspacePage'));
const WorkspaceInboxPage = React.lazy(() => import('@/domains/workspace/pages/WorkspaceInboxPage'));
const WorkspaceCalendarUnifiedPage = React.lazy(() => import('@/domains/workspace/pages/WorkspaceCalendarUnifiedPage'));
const ChatPage          = React.lazy(() => import('@/domains/ai/pages/ChatPage'));
const AICapabilitiesPage = React.lazy(() => import('@/domains/ai/pages/AICapabilities'));
const AIPerformancePage = React.lazy(() => import('@/domains/ai/pages/AIPerformancePage'));
const IntegrationsPage  = React.lazy(() => import('@/domains/analytics/pages/IntegrationsPage'));
const IntegrationMarketplacePage = React.lazy(() => import('@/domains/integrations/pages/IntegrationMarketplacePage'));
const FireCyclePage     = React.lazy(() => import('@/domains/analytics/pages/FireCyclePage'));
const ProfilePage       = React.lazy(() => import('@/domains/admin/user/pages/Profile'));
const AuthCallback      = React.lazy(() => import('@/domains/admin/user/pages/AuthCallback'));
const EmailNotVerified  = React.lazy(() => import('@/domains/admin/user/pages/EmailNotVerified'));
const UnifiedCallback   = React.lazy(() => import('@/shared/pages/UnifiedCallbackPage'));
const Microsoft365CallbackPage = React.lazy(() => import('@/domains/integrations/pages/Microsoft365CallbackPage'));
const HubSpotCallbackPage = React.lazy(() => import('@/domains/integrations/pages/HubSpotCallbackPage'));
const HubSpotDashboard = React.lazy(() => import('@/domains/integrations/pages/HubSpotDashboard'));

const KnowledgeHome     = React.lazy(() => import('@/domains/knowledge/pages/Home'));
const DebugPage         = React.lazy(() => import('@/domains/admin/pages/DebugPage'));

// Data & Analytics Pages
const AnalyticsPage     = React.lazy(() => import('@/domains/analytics/pages/UnifiedAnalyticsPage'));
const DataWarehouseHome = React.lazy(() => import('@/domains/analytics/pages/DataWarehouseHome'));
const IntegrationDataDashboard = React.lazy(() => import('@/domains/integrations/components/IntegrationDataDashboard'));

const TeamManagementPage = React.lazy(() => import('@/domains/workspace/pages/WorkspacePage'));
const CustomerInsightsPage = React.lazy(() => import('@/domains/workspace/pages/WorkspacePage'));
const ProcessAutomationPage = React.lazy(() => import('@/domains/workspace/pages/WorkspacePage'));

// Static Imports
import ApiLearningPage   from '@/domains/analytics/pages/IntegrationTrackingPage';
import { SignUp }        from '@/domains/admin/user/pages/SignUp';
import { LoginPage }     from '@/domains/admin/user/pages/LoginPage';
import SettingsPage      from '@/domains/admin/user/pages/SettingsPage';
import { LandingPage }   from '@/shared/pages/LandingPage';
import { PrivacyPolicyPage } from '@/domains/help-center/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/domains/help-center/pages/TermsOfServicePage';
import { PasswordResetPage } from '@/domains/admin/user/pages/PasswordResetPage';
import ResetPassword from '@/domains/admin/user/pages/ResetPassword';

/**
 * Main App Component - Simplified Architecture
 */
function App() {
  // Clean up any corrupted localStorage entries on app start
  React.useEffect(() => {
    try {
      cleanupCorruptedStorage();
    } catch (error: unknown) {
      console.warn('Failed to cleanup corrupted storage:', error);
    }
  }, []);

  return (
    <SystemContextProvider>
      <NotificationProvider>
        <OnboardingProvider>
          <FireCycleProvider>
            <ThemeProvider defaultTheme="system" defaultColor="green">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth/google-analytics-callback" element={<UnifiedCallback integrationSlug="google-analytics" />} />
                <Route path="/integrations/:integration/callback" element={<UnifiedCallback />} />
                <Route path="/integrations/microsoft/callback" element={<Microsoft365CallbackPage />} />
                <Route path="/integrations/hubspot/callback" element={<HubSpotCallbackPage />} />

                <Route path="/email-not-verified" element={<EmailNotVerified />} />
                <Route path="/help" element={<HelpLayout />} />
                <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/legal/terms" element={<TermsOfServicePage />} />
                <Route path="/password-reset" element={<PasswordResetPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Protected Routes - Simple Auth Guard */}
                <Route path="/home" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <WorkspacePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                {/* Test route to force onboarding */}
                <Route path="/test-onboarding" element={
                  <AppWithOnboarding>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Onboarding Test</h1>
                        <p className="text-muted-foreground">If you see this, onboarding didn't trigger</p>
                        <p className="text-sm text-muted-foreground mt-2">Check browser console for debug logs</p>
                      </div>
                    </div>
                  </AppWithOnboarding>
                } />
                
                <Route path="/dashboard" element={<Navigate to="/home" replace />} />
                
                <Route path="/workspace" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <WorkspacePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/workspace/inbox" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <WorkspaceInboxPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/workspace/calendar-unified" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <WorkspaceCalendarUnifiedPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/ai-hub" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <AIHubPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/chat" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <ChatPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/ai-capabilities" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <AICapabilitiesPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/ai-performance" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <AIPerformancePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/integrations" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <IntegrationsPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/integrations/api-learning" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <ApiLearningPage />
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/integrations/marketplace" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <IntegrationMarketplacePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/fire-cycle" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <FireCyclePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/settings" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <SettingsPage />
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/settings/profile" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <ProfilePage />
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/profile" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <ProfilePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/knowledge" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <KnowledgeHome />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />

                {/* Data & Analytics Routes */}
                <Route path="/analytics" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <AnalyticsPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/data-warehouse" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <DataWarehouseHome />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/integrations/data" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <IntegrationDataDashboard />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/integrations/hubspot" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <HubSpotDashboard />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/integrations/hubspot/dashboard" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <HubSpotDashboard />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                

                
                <Route path="/workspace/today" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <WorkspacePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/workspace/calendar" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <WorkspaceCalendarUnifiedPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/workspace/team" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <TeamManagementPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/workspace/customer-insights" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <CustomerInsightsPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />
                
                <Route path="/workspace/automation" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <ProcessAutomationPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />

                {/* Debug Route */}
                <Route path="/debug" element={
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <DebugPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                } />

                {/* Catch-all - redirect to login for unknown routes */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </ThemeProvider>
          </FireCycleProvider>
        </OnboardingProvider>
      </NotificationProvider>
    </SystemContextProvider>
  );
}

export default App;
