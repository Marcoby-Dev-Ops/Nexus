import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthentikAuthProvider, useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { UserProvider } from '@/shared/contexts/UserContext';
import { CompanyProvider } from '@/shared/contexts/CompanyContext';
import { UserPreferencesProvider } from '@/shared/contexts/UserPreferencesContext';
import { postgres } from '@/lib/postgres';
import { callRPC } from '@/lib/api-client';
import { authentikAuthService } from '@/core/auth/authentikAuthServiceInstance';
import { logger } from '@/shared/utils/logger';

import { UnifiedLayout } from '@/shared/components/layout/UnifiedLayout';
import { useUnifiedPlaybook } from '@/shared/hooks/useUnifiedPlaybook';

import { PerformanceMonitor } from '@/components/dev/PerformanceMonitor';
import { useChatShortcut } from '@/shared/hooks/useChatShortcut';

// Import pages from the new structure
import { Dashboard } from '@/pages';
import { LandingPage } from '@/shared/pages/LandingPage';

// Import public pages
import SignupPage from '@/pages/auth/SignupPage';
import { PrivacyPolicyPage } from '@/pages/help-center/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/pages/help-center/TermsOfServicePage';
import { CookiePolicyPage } from '@/pages/help-center/CookiePolicyPage';
import { SecurityPage } from '@/pages/help-center/SecurityPage';
import Login from '@/pages/auth/Login';
import AuthTestPage from '@/pages/auth/AuthTestPage';
import Signup from '@/pages/auth/Signup';
// NexusOperatingSystemDemo removed during cleanup
import PricingPage from '@/pages/PricingPage';
import WorkspacePage from '@/pages/workspace/WorkspacePage';

// Import AI pages
import { 
  AICapabilities, 
  AIPerformancePage, 
  AIHubPage,
  AISettingsPage,
  AIModelPage,
  AIAgentPage,
  AIChatPage
} from '@/pages/ai';

// Import the correct ChatPage for business-aware conversations
import ChatPage from '@/pages/chat/ChatPage';

// Import Quantum pages
// QuantumBlockDetailPage removed during cleanup
import { QuantumBusinessService } from '@/services/business/QuantumBusinessService';
import { IdentityDashboardPage } from '@/pages/identity';

// Import CKB page
import CKBPage from '@/pages/ckb';
import { DocumentsPage } from '@/pages';
import BuildingBlocksPage from '@/pages/building-blocks/index';
import QuantumHomeDashboard from '@/components/dashboard/QuantumHomeDashboard';
import TicketPage from '@/pages/chat/TicketPage';
import { JourneyIntakePage } from '@/pages/journey/JourneyIntakePage';
// UnifiedFrameworkDemo removed during cleanup
// QuantumBlockStrengthenPage removed during cleanup
// QuantumIdentityPage removed during cleanup
import { QuantumLayout } from '@/shared/components/layout/QuantumLayout';
import { RequireAuth, RequireProfile, RequireQuantumAccess } from '@/shared/routes/guards';
import BusinessBodyPage from '@/pages/business-body/BusinessBodyPage';


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
  GoogleCallbackPage,
  HubSpotCallbackPage,
  IntegrationSettingsPage,
  IntegrationSetupPage,
  ApiLearning
} from '@/pages/integrations';
import DataPointMappingDashboard from '@/pages/integrations/DataPointMappingDashboard';
import GoogleAnalyticsCallbackPage from '@/pages/integrations/GoogleAnalyticsCallbackPage';

// Import Unified Client components
import UnifiedClientProfilesView from '@/components/integrations/UnifiedClientProfilesView';

// Import Admin pages
import { TenantManagementPage } from '@/pages/admin/TenantManagementPage';
// DebugPage removed during cleanup
import CompanySettings from '@/pages/admin/CompanySettings';
import ResetPassword from '@/pages/admin/ResetPassword';
import AccountSettings from '@/pages/admin/AccountSettings';
import BillingSettings from '@/pages/admin/BillingSettings';
import IntegrationsSettings from '@/pages/admin/IntegrationsSettings';
import AuthentikAuthCallback from '@/pages/admin/AuthentikAuthCallback';
import SecuritySettings from '@/pages/admin/SecuritySettings';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import WaitlistLanding from '@/pages/admin/WaitlistLanding';
import TeamSettings from '@/pages/admin/TeamSettings';
import SettingsPage from '@/pages/admin/SettingsPage';
import { Profile } from '@/pages/admin/Profile';
import LoginPage from '@/pages/admin/LoginPage';
import NotificationsSettings from '@/pages/admin/NotificationsSettings';
import { OnboardingChecklist } from '@/pages/admin/OnboardingChecklist';
import PasswordResetPage from '@/pages/admin/PasswordResetPage';
import { PricingPage as AdminPricingPage } from '@/pages/admin/PricingPage';
import EmailNotVerified from '@/pages/admin/EmailNotVerified';
import { AuthStatus } from '@/pages/admin/AuthStatus';
import { BillingDashboard } from '@/pages/admin/BillingDashboard';
import { BillingPage } from '@/pages/admin/BillingPage';
import AppearanceSettings from '@/pages/admin/AppearanceSettings';
import AssessmentPage from '@/pages/admin/AssessmentPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import ProfileSettings from '@/pages/admin/ProfileSettings';
import MaturityPage from '@/pages/maturity/MaturityPage';
import DataPrivacySettings from '@/pages/admin/DataPrivacySettings';
import AdvancedSettings from '@/pages/admin/AdvancedSettings';
import { ContinuousImprovementDashboard } from '@/pages/admin/ContinuousImprovementDashboard';

import { FeatureExplorer } from '@/pages/admin/FeatureExplorer';
import AIModelSettings from '@/pages/admin/AIModelSettings';
import { PolicyManagementPage } from '@/pages/admin/PolicyManagementPage';
import { AIUsageMonitoringPage } from '@/pages/admin/AIUsageMonitoringPage';

// Import Task/Workspace components
import UnifiedInbox from '@/components/tasks/UnifiedInbox';
import UnifiedCalendar from '@/components/tasks/UnifiedCalendar';
import { ActionCenter } from '@/components/tasks/ActionCenter';

// Import Analytics components
import DigestibleMetricsDashboard from '@/components/analytics/DigestibleMetricsDashboard';
import CrossPlatformInsightsEngine from '@/components/analytics/CrossPlatformInsightsEngine';
import BusinessHealthPage from '@/components/analytics/BusinessHealthPage';

// Import Department pages
import SalesPage from '@/pages/departments/SalesPage';
import FinancePage from '@/pages/departments/FinancePage';
import OperationsPage from '@/pages/departments/OperationsPage';
import MarketingPage from '@/pages/departments/MarketingPage';

// Import Automation components
import ProcessAutomationPage from '@/components/automation/ProcessAutomationPage';

// Lazy imports for code splitting
// CompanyProfilePage removed during cleanup

// Import Automation pages
import AutomationRecipesPage from '@/pages/automation/AutomationRecipesPage';
import { ActPage } from '@/pages/automation/ActPage';

// Import Help Center pages
import { UserGuidePage } from '@/pages/help-center/UserGuidePage';
import { DataUsagePage } from '@/pages/help-center/DataUsagePage';
import { SecurityCompliancePage } from '@/pages/help-center/SecurityCompliancePage';
import { ContactPage } from '@/pages/help-center/ContactPage';
import { FAQPage } from '@/pages/help-center/FAQPage';
import { DocumentationPage } from '@/pages/help-center/DocumentationPage';

// Import Organization pages
import { OrganizationsPage } from '@/pages/organizations/OrganizationsPage';
import { OrganizationDetailsPage } from '@/pages/organizations/[orgId]/OrganizationDetailsPage';
import { OrganizationSettingsPage } from '@/pages/organizations/[orgId]/OrganizationSettingsPage';
import { OrganizationMembersPage } from '@/pages/organizations/[orgId]/OrganizationMembersPage';
import { AboutPage } from '@/pages/help-center/AboutPage';

// Import Playbook Test Page
import PlaybookTestPage from '@/pages/PlaybookTestPage';

// Import Email pages
import EmailIntelligencePage from '@/pages/email/EmailIntelligencePage';

// Import FIRE Cycle components
import { FireCycleDashboard, FireCycleBusinessGoalsDashboard } from '@/components/fire-cycle';
// Demo pages removed during cleanup

// Import Purposeful Experience Page
import PurposefulExperiencePage from '@/pages/experience/PurposefulExperiencePage';

// Import Mobile App
import NexusMobileApp from '@/components/mobile/NexusMobileApp';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

// Wrapper component for ContinuousImprovementDashboard
const ContinuousImprovementWrapper = () => {
  const { user } = useAuthentikAuth();
  return <ContinuousImprovementDashboard userId={user?.id || ''} timeframe="week" />;
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthentikAuth();
  const [profileEnsured, setProfileEnsured] = React.useState(false);

  // Ensure user profile exists
  const ensureProfile = async () => {
    if (user?.id && !profileEnsured) {
      try {
        // Call RPC to ensure user profile exists
        const { error } = await callRPC('ensure_user_profile', { user_id: user.id });
        if (error) {
          logger.error('Failed to ensure user profile exists', { error });
        } else {
          setProfileEnsured(true);
        }
      } catch (error) {
        logger.error('Error ensuring user profile', { error });
      }
    }
  };

  React.useEffect(() => {
    ensureProfile();
  }, [user?.id]); // Remove profileEnsured from dependencies to prevent infinite loop

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
  const { user, loading } = useAuthentikAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root route component (shows landing page for non-authenticated, redirects authenticated to appropriate route)
const RootRoute = () => {
  const { user, loading } = useAuthentikAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
            // Redirect to dashboard - journey system will handle onboarding if needed
        return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
};

// Add authentication check component
const AuthCheck = () => {
  const { isAuthenticated, loading, initialized } = useAuthentikAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip auth check for public routes
    const publicRoutes = ['/', '/auth/callback', '/auth/test', '/auth/signup', '/admin/auth-callback', '/admin/auth-status', '/admin/email-not-verified', '/admin/waitlist', '/login', '/signup', '/privacy', '/terms', '/cookies', '/security', '/pricing'];
    const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));
    
    if (!loading && initialized && !isAuthenticated && !isPublicRoute) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, initialized, navigate, location.pathname]);

  return null;
};

function App() {
  // Enable chat shortcut (Ctrl/Cmd + K)
  useChatShortcut();

  return (
         <AuthentikAuthProvider>
       <UserProvider>
         <CompanyProvider>
           <UserPreferencesProvider>
           <div className="App">
           <AuthCheck />
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

          {/* Legal Routes */}
          <Route 
            path="/legal/privacy" 
            element={<PrivacyPolicyPage />} 
          />
          
          <Route 
            path="/legal/terms" 
            element={<TermsOfServicePage />} 
          />
          
          <Route 
            path="/legal/cookies" 
            element={<CookiePolicyPage />} 
          />
          
          <Route 
            path="/legal/security" 
            element={<SecurityPage />} 
          />
          
          {/* Demo route removed during cleanup */}
          
          <Route 
            path="/pricing" 
            element={<PricingPage />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={<Navigate to="/home" replace />} 
          />
          
          
          
          {/* Main home dashboard (after onboarding completion) */}
          <Route 
            path="/home"
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <QuantumHomeDashboard />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Unified framework demo route removed during cleanup */}
          
          <Route 
            path="/dashboard/home" 
            element={<Navigate to="/home" replace />} 
          />
          
          <Route 
            path="/building-blocks" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <BuildingBlocksPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Mobile App Route */}
          <Route 
            path="/mobile" 
            element={
              <ProtectedRoute>
                <NexusMobileApp 
                  businessId="demo-business-id"
                  userId="demo-user-id"
                />
              </ProtectedRoute>
            } 
          />
          


          
          {/* === CORE JOURNEY ROUTES === */}
          
          {/* Workspace routes */}
          <Route 
            path="/tasks/workspace" 
            element={
              <ProtectedRoute>
                {/* <UserMappingGuard> */}
                  <UnifiedLayout>
                    <WorkspacePage />
                  </UnifiedLayout>
                {/* </UserMappingGuard> */}
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/tasks/workspace/actions" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <div className="p-6">
                    <ActionCenter />
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
                  <UnifiedInbox />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/tasks/workspace/calendar" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <UnifiedCalendar />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/tasks/workspace/clients" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <ClientIntelligencePage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/ckb" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <CKBPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/documents" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <DocumentsPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* FIRE Cycle routes */}
          <Route 
            path="/business/fire-cycle" 
            element={
              <ProtectedRoute>
                {/* <UserMappingGuard> */}
                  <UnifiedLayout>
                    <FireCycleDashboard />
                  </UnifiedLayout>
                {/* </UserMappingGuard> */}
              </ProtectedRoute>
            } 
          />
          
          {/* Demo routes removed during cleanup */}
          
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
          
          <Route 
            path="/business/fire-cycle/goals" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">Business Goals & FIRE Framework</h1>
                    <p className="text-muted-foreground">Plan and execute business goals using the FIRE methodology</p>
                    <div className="mt-4">
                      <FireCycleBusinessGoalsDashboard />
                    </div>
                  </div>
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Purposeful Experience Page */}
          <Route 
            path="/experience/purposeful" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <PurposefulExperiencePage />
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
            path="/ai-agents-demo" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">AI Agents Demo</h1>
                    <p className="text-muted-foreground">Explore AI agent capabilities</p>
                    <div className="mt-6">
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                          AI Agents Demo component needs to be created.
                        </p>
                      </div>
                    </div>
                  </div>
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/automation/n8n" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">n8n Integration</h1>
                    <p className="text-muted-foreground">Advanced workflow automation with n8n</p>
                    <div className="mt-6">
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                          n8n Integration component needs to be created.
                        </p>
                      </div>
                    </div>
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
                  <IntegrationsPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Organization routes */}
          <Route 
            path="/organizations" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <OrganizationsPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/organizations/:orgId" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <OrganizationDetailsPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/organizations/:orgId/settings" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <OrganizationSettingsPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/organizations/:orgId/members" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <OrganizationMembersPage />
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
              path="/ticket/:ticketId" 
              element={
                <ProtectedRoute>
                  <UnifiedLayout>
                    <TicketPage />
                  </UnifiedLayout>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/journey-intake" 
              element={<Navigate to="/chat" replace />} 
            />
            
            {/* Legacy journey-intake with query parameters */}
            <Route 
              path="/journey-intake/:journey" 
              element={
                <ProtectedRoute>
                  <Navigate to="/chat" replace />
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
            path="/ai-performance/models" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <AIModelSettings />
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
                    <BusinessHealthPage />
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
                    <CrossPlatformInsightsEngine />
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
                    <DigestibleMetricsDashboard />
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
                  <IntegrationsPage />
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
            path="/integrations/google/callback" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <GoogleCallbackPage />
                </UnifiedLayout>
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/integrations/google-analytics/callback" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <GoogleAnalyticsCallbackPage />
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
            path="/integrations/client-profiles" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <UnifiedClientProfilesView />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/integrations/client-interactions" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">Client Interactions</h1>
                    <p className="text-muted-foreground">Track client interactions across platforms</p>
                    <div className="mt-6">
                      <UnifiedClientProfilesView />
                    </div>
                  </div>
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/integrations/client-alerts" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">Intelligence Alerts</h1>
                    <p className="text-muted-foreground">AI-generated client intelligence alerts</p>
                    <div className="mt-6">
                      <UnifiedClientProfilesView />
                    </div>
                  </div>
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
            path="/integrations/data-point-mapping" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <DataPointMappingDashboard />
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
          
          {/* Debug route removed during cleanup */}
          
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
                  <AdminPricingPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Admin company profile route removed during cleanup */}
          
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
                  <ContinuousImprovementWrapper />
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
          
          <Route 
            path="/admin/ai-usage" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <AIUsageMonitoringPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/policy-management" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <PolicyManagementPage />
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
                <SignupPage />
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
            path="/auth/callback" 
            element={
              <PublicRoute>
                <AuthentikAuthCallback />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/auth/test" 
            element={
              <PublicRoute>
                <AuthTestPage />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/playbook-test" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <PlaybookTestPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/auth/signup" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />
          <Route 
            path="/auth/signup-complete" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/admin/auth-callback" 
            element={
              <PublicRoute>
                <AuthentikAuthCallback />
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
            path="/help" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">Help Center</h1>
                    <p className="text-muted-foreground">Support and troubleshooting</p>
                    <div className="mt-6">
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                          Help Center component exists but needs to be imported and used.
                        </p>
                      </div>
                    </div>
                  </div>
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/help/contact" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <ContactPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/help/faq" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <FAQPage />
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/help/documentation" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <DocumentationPage />
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
                    <div className="mt-6">
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                          Features component needs to be created.
                        </p>
                      </div>
                    </div>
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
          
          <Route 
            path="/settings/preferences" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">Preferences</h1>
                    <p className="text-muted-foreground">Customize your experience</p>
                    <div className="mt-6">
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                          Preferences component needs to be created.
                        </p>
                      </div>
                    </div>
                  </div>
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/settings/security" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <SecuritySettings />
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
                    <div className="mt-6">
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                          Team Management component needs to be created.
                        </p>
                      </div>
                    </div>
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
                    <div className="mt-6">
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                          Customer Insights component needs to be created.
                        </p>
                      </div>
                    </div>
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
                    <ProcessAutomationPage />
                  </div>
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Business Department routes */}
          <Route 
            path="/sales" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <div className="p-6">
                    <SalesPage />
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
                    <FinancePage />
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
                    <OperationsPage />
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
                    <MarketingPage />
                  </div>
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Quantum Business Model routes - Now using Journey System */}
          <Route 
            path="/onboarding/quantum" 
            element={
              <RequireAuth>
                <UnifiedLayout>
                  <div className="p-6">
                    <Navigate to="/journey-intake?journey=quantum-building-blocks" replace />
                  </div>
                </UnifiedLayout>
              </RequireAuth>
            } 
          />
          
          {/* Quantum block detail route removed during cleanup */}
          
          {/* Quantum block strengthen route removed during cleanup */}
          
          {/* Identity routes */}
          <Route 
            path="/identity" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <React.Suspense fallback={<LoadingSpinner />}>
                    <IdentityDashboardPage />
                  </React.Suspense>
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          

          
          {/* Quantum identity profile route removed during cleanup */}
          
          {/* Quantum identity team route removed during cleanup */}
          
          {/* Quantum identity brand route removed during cleanup */}
          
          {/* Business Body Systems */}
          <Route 
            path="/business-body" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <React.Suspense fallback={<LoadingSpinner />}>
                    <BusinessBodyPage />
                  </React.Suspense>
                </UnifiedLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/maturity" 
            element={
              <ProtectedRoute>
                <UnifiedLayout>
                  <MaturityPage />
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
           </UserPreferencesProvider>
         </CompanyProvider>
       </UserProvider>
       <PerformanceMonitor />
     </AuthentikAuthProvider>
  );
}

export default App; 
