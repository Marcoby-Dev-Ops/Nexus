import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/index';

import { UnifiedLayout } from '@/shared/components/layout/UnifiedLayout';

// Import pages from the new structure
import { Login, Dashboard } from '@/pages';
import { LandingPage } from '@/shared/pages/LandingPage';

// Import public pages
import SignupPage from '@/pages/admin/SignupPage';
import { PrivacyPolicyPage } from '@/pages/help-center/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/help-center/TermsOfServicePage';

// Import AI pages
import { 
  AICapabilities, 
  AIPerformancePage, 
  AIHubPage,
  ChatV2Page,
  ChatPage,
  AISettingsPage,
  AIModelPage,
  AIAgentPage,
  AIChatPage
} from '@/pages/ai';

// Import Analytics pages
import IntegrationsPage from '@/pages/analytics/IntegrationsPage';
import UnifiedAnalyticsPage from '@/pages/analytics/UnifiedAnalyticsPage';
import DataWarehouseHome from '@/pages/analytics/DataWarehouseHome';
import IntegrationsShowcase from '@/pages/analytics/IntegrationsShowcase';
import IntegrationTrackingPage from '@/pages/analytics/IntegrationTrackingPage';
import GoogleAnalyticsCallback from '@/pages/analytics/GoogleAnalyticsCallback';
import FireCyclePage from '@/pages/analytics/FireCyclePage';

// Import Integration pages
import { 
  HubSpotDashboard, 
  IntegrationMarketplacePage, 
  ClientIntelligencePage,
  HubSpotTest,
  Microsoft365CallbackPage,
  HubSpotCallbackPage,
  IntegrationSettingsPage,
  IntegrationSetupPage,
  IntegrationsDashboardPage,
  ApiLearning
} from '@/pages/integrations';

// Import Admin pages
import { TenantManagementPage } from '@/pages/admin/TenantManagementPage';
import DebugPage from '@/pages/admin/DebugPage';
import CompanySettings from '@/pages/admin/CompanySettings';
import ResetPassword from '@/pages/admin/ResetPassword';
import AccountSettings from '@/pages/admin/AccountSettings';
import BillingSettings from '@/pages/admin/BillingSettings';
import IntegrationsSettings from '@/pages/admin/IntegrationsSettings';
import AuthCallback from '@/pages/admin/AuthCallback';
import SecuritySettings from '@/pages/admin/SecuritySettings';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import WaitlistLanding from '@/pages/admin/WaitlistLanding';
import TeamSettings from '@/pages/admin/TeamSettings';
import SettingsPage from '@/pages/admin/SettingsPage';
import Profile from '@/pages/admin/Profile';
import LoginPage from '@/pages/admin/LoginPage';
import NotificationsSettings from '@/pages/admin/NotificationsSettings';
import { OnboardingChecklist } from '@/pages/admin/OnboardingChecklist';
import PasswordResetPage from '@/pages/admin/PasswordResetPage';
import { PricingPage } from '@/pages/admin/PricingPage';
import EmailNotVerified from '@/pages/admin/EmailNotVerified';
import { CompanyProfilePage } from '@/pages/admin/CompanyProfilePage';
import { AuthStatus } from '@/pages/admin/AuthStatus';
import { BillingDashboard } from '@/pages/admin/BillingDashboard';
import { BillingPage } from '@/pages/admin/BillingPage';
import AppearanceSettings from '@/pages/admin/AppearanceSettings';
import AssessmentPage from '@/pages/admin/AssessmentPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import ProfileSettings from '@/pages/admin/ProfileSettings';
import DataPrivacySettings from '@/pages/admin/DataPrivacySettings';
import AdvancedSettings from '@/pages/admin/AdvancedSettings';
import ContinuousImprovementDashboard from '@/pages/admin/ContinuousImprovementDashboard';
import { SignUp } from '@/pages/admin/SignUp';
import { FeatureExplorer } from '@/pages/admin/FeatureExplorer';
import AIModelSettings from '@/pages/admin/AIModelSettings';

// Import Automation pages
import AutomationRecipesPage from '@/pages/automation/AutomationRecipesPage';
import { ActPage } from '@/pages/automation/ActPage';

// Import Help Center pages
import { UserGuidePage } from '@/pages/help-center/UserGuidePage';
import { DataUsagePage } from '@/pages/help-center/DataUsagePage';
import { SecurityCompliancePage } from '@/pages/help-center/SecurityCompliancePage';
import { AboutPage } from '@/pages/help-center/AboutPage';

// Import Email pages
import EmailIntelligencePage from '@/pages/email/EmailIntelligencePage';

// Import FIRE Cycle components
import { FireCycleDashboard } from '@/components/fire-cycle';
import FireCycleEnhancedDemoPage from '@/pages/fire-cycle-enhanced-demo';
import FireCycleDemoPage from '@/pages/fire-cycle-demo';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public route component (only for non-authenticated users)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root route component (shows landing page for non-authenticated, redirects authenticated to dashboard)
const RootRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/privacy-policy" 
          element={<PrivacyPolicyPage />} 
        />
        
        <Route 
          path="/terms-of-service" 
          element={<TermsOfServicePage />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <Dashboard />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        


        
        {/* === CORE JOURNEY ROUTES === */}
        
        {/* Workspace routes */}
        <Route 
          path="/tasks/workspace" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">My Workspace</h1>
                  <p className="text-muted-foreground">Your personalized productivity hub</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/tasks/workspace/actions" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Action Center</h1>
                  <p className="text-muted-foreground">Manage tasks and priorities</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/tasks/workspace/inbox" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Unified Inbox</h1>
                  <p className="text-muted-foreground">All communications in one place</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/tasks/workspace/calendar" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Calendar</h1>
                  <p className="text-muted-foreground">Schedule and time management</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/tasks/workspace/today" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Today Dashboard</h1>
                  <p className="text-muted-foreground">Focus on what matters today</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* FIRE Cycle routes */}
        <Route 
          path="/business/fire-cycle" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <FireCycleDashboard />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/fire-cycle-enhanced-demo" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <FireCycleEnhancedDemoPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/fire-cycle-demo" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <FireCycleDemoPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/business/fire-cycle/focus" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Focus Phase</h1>
                  <p className="text-muted-foreground">What matters most right now?</p>
                  <div className="mt-4">
                    <FireCycleDashboard selectedPhase="focus" />
                  </div>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/business/fire-cycle/insight" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Insight Phase</h1>
                  <p className="text-muted-foreground">What are you learning?</p>
                  <div className="mt-4">
                    <FireCycleDashboard selectedPhase="insight" />
                  </div>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/business/fire-cycle/roadmap" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Roadmap Phase</h1>
                  <p className="text-muted-foreground">What's the plan?</p>
                  <div className="mt-4">
                    <FireCycleDashboard selectedPhase="roadmap" />
                  </div>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/business/fire-cycle/execute" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Execute Phase</h1>
                  <p className="text-muted-foreground">Take action and track progress</p>
                  <div className="mt-4">
                    <FireCycleDashboard selectedPhase="execute" />
                  </div>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Knowledge routes */}
        <Route 
          path="/integrations/knowledge" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Knowledge Enhancer</h1>
                  <p className="text-muted-foreground">AI-powered knowledge management</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/help-center/knowledge/center" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Knowledge Center</h1>
                  <p className="text-muted-foreground">Review truths and insights we're uncovering</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/help-center/knowledge/thoughts" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Thoughts & Ideas</h1>
                  <p className="text-muted-foreground">Capture and organize your thoughts</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/integrations" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Integration Hub</h1>
                  <p className="text-muted-foreground">Connect your business tools</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* === ADVANCED FEATURES ROUTES === */}
        
        {/* AI Hub routes */}
        <Route 
          path="/ai-hub" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AIHubPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <ChatPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/chat/v2" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <ChatV2Page />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ai-chat" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AIChatPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ai-capabilities" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AICapabilities />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ai-performance" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AIPerformancePage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ai-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AISettingsPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ai-model" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AIModelPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ai-agent" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AIAgentPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/email-intelligence" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <EmailIntelligencePage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Analytics routes */}
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <UnifiedAnalyticsPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics/unified" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <UnifiedAnalyticsPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics/data-warehouse" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <DataWarehouseHome />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics/integrations" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <IntegrationsPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics/showcase" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <IntegrationsShowcase />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics/tracking" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <IntegrationTrackingPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics/google-callback" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <GoogleAnalyticsCallback />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics/fire-cycle" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <FireCyclePage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics/business-health" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Business Health</h1>
                  <p className="text-muted-foreground">Monitor business performance</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics/cross-platform" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Cross-Platform Insights</h1>
                  <p className="text-muted-foreground">Unified data insights</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics/digestible-metrics" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Digestible Metrics</h1>
                  <p className="text-muted-foreground">Simplified business metrics</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Automation routes */}
        <Route 
          path="/automation" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AutomationRecipesPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/automation/recipes" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AutomationRecipesPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/automation/act" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <ActPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Integration routes */}
        <Route 
          path="/integrations" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <IntegrationsDashboardPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/integrations/hubspot" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <HubSpotDashboard />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/integrations/marketplace" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <IntegrationMarketplacePage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/integrations/client-intelligence" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <ClientIntelligencePage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/integrations/hubspot/test" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <HubSpotTest />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/integrations/hubspot/callback" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <HubSpotCallbackPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/integrations/microsoft365/callback" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <Microsoft365CallbackPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/integrations/settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <IntegrationSettingsPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/integrations/setup" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <IntegrationSetupPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/integrations/api-learning" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <ApiLearning />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AdminPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/tenant-management" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <TenantManagementPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/debug" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <DebugPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/company-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <CompanySettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/account-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AccountSettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/billing-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <BillingSettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/integrations-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <IntegrationsSettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/security-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <SecuritySettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/user-management" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <UserManagementPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/team-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <TeamSettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/profile" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <Profile />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/notifications-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <NotificationsSettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/onboarding-checklist" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <OnboardingChecklist />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/pricing" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <PricingPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/company-profile" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <CompanyProfilePage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/billing-dashboard" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <BillingDashboard />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/billing" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <BillingPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/appearance-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AppearanceSettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/assessment" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AssessmentPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/profile-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <ProfileSettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/data-privacy-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <DataPrivacySettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/advanced-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AdvancedSettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/continuous-improvement" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <ContinuousImprovementDashboard />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/feature-explorer" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <FeatureExplorer />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/ai-model-settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AIModelSettings />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Auth routes */}
        <Route 
          path="/admin/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/admin/signup" 
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/admin/reset-password" 
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/admin/password-reset" 
          element={
            <PublicRoute>
              <PasswordResetPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/admin/auth-callback" 
          element={
            <PublicRoute>
              <AuthCallback />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/admin/auth-status" 
          element={
            <PublicRoute>
              <AuthStatus />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/admin/email-not-verified" 
          element={
            <PublicRoute>
              <EmailNotVerified />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/admin/waitlist" 
          element={
            <PublicRoute>
              <WaitlistLanding />
            </PublicRoute>
          } 
        />
        
        {/* Help Center routes */}
        <Route 
          path="/help" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Help Center</h1>
                  <p className="text-muted-foreground">Support and troubleshooting</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/help/user-guide" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <UserGuidePage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/help/data-usage" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <DataUsagePage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/help/security-compliance" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <SecurityCompliancePage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/help/about" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <AboutPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/features" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Features</h1>
                  <p className="text-muted-foreground">Explore platform capabilities</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <SettingsPage />
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* === EXPERT FEATURES ROUTES === */}
        
        {/* Team & Operations routes */}
        <Route 
          path="/workspace/team" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Team Management</h1>
                  <p className="text-muted-foreground">Manage team performance and collaboration</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/workspace/customer-insights" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Customer Insights</h1>
                  <p className="text-muted-foreground">Analyze customer behavior and satisfaction</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/workspace/automation" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Process Automation</h1>
                  <p className="text-muted-foreground">Automate repetitive tasks and workflows</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Business Departments routes */}
        <Route 
          path="/sales" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Sales</h1>
                  <p className="text-muted-foreground">Sales performance and pipeline management</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/finance" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Finance</h1>
                  <p className="text-muted-foreground">Financial operations and reporting</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/operations" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Operations</h1>
                  <p className="text-muted-foreground">Operational efficiency and processes</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/marketing" 
          element={
            <ProtectedRoute>
              <UnifiedLayout>
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-4">Marketing</h1>
                  <p className="text-muted-foreground">Marketing analytics and campaigns</p>
                </div>
              </UnifiedLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Root route - landing page for non-authenticated users, dashboard for authenticated */}
        <Route 
          path="/" 
          element={<RootRoute />} 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App; 