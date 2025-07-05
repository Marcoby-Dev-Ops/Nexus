import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';

// Layout Components
import { UnifiedLayout } from './components/layout/UnifiedLayout';

// Providers
import { NotificationProvider } from './contexts/NotificationContext';
import { MicrosoftGraphProvider } from './lib/core/providers/MicrosoftGraphProvider';
import { SystemContextProvider } from './contexts/SystemContext';
import { OnboardingProvider } from './contexts/OnboardingContext';

// Storage cleanup
import { cleanupCorruptedStorage } from './lib/security/secureStorage';

// Pages
import EnhancedDashboard from './components/dashboard/EnhancedDashboard';
import NotFoundPage from './pages/NotFoundPage';
import AIHubPage from './pages/AIHubPage';
import WorkspacePage from './pages/WorkspacePage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfileSettings from './pages/settings/ProfileSettings';
import SecuritySettings from './pages/settings/SecuritySettings';
import TeamSettings from './pages/settings/TeamSettings';
import { BillingSettings } from './pages/settings/BillingSettings';
import { Login } from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';
import EmailNotVerified from './pages/EmailNotVerified';
import GoogleAnalyticsCallback from './pages/GoogleAnalyticsCallback';
import GoogleWorkspaceCallback from './pages/GoogleWorkspaceCallback';
import NinjaRmmCallback from './pages/NinjaRmmCallback';
import Microsoft365Callback from './pages/Microsoft365Callback';

// Business Intelligence Components
import { QuickBusinessSetup } from './components/business/QuickBusinessSetup';
import { BusinessIntelligentChat } from './components/ai/BusinessIntelligentChat';

// Marketing Landing Page
import MarketingLanding from './pages/MarketingLanding';

// Department Pages
import FinancialOperationsPage from './pages/departments/finance/FinancialOperationsPage';
import SalesPerformancePage from './pages/departments/sales/SalesPerformancePage';
import MarketingAnalyticsPage from './pages/departments/marketing/MarketingAnalyticsPage';
import SupportAnalyticsPage from './pages/departments/support/SupportAnalyticsPage';
import MaturityAnalyticsPage from './pages/departments/maturity/MaturityAnalyticsPage';
import AnalyticsDashboardPage from './pages/departments/operations/AnalyticsDashboardPage';
import DepartmentHomePage from './pages/departments/DepartmentHomePage';
import OperationsPage from './pages/departments/operations/OperationsPage';

// Analytics Pages
import AssessmentPage from './pages/AssessmentPage';
import CompanyStatusPage from './pages/CompanyStatusPage';

// Data Warehouse
import DataWarehouseHome from './pages/analytics/DataWarehouseHome';

// API Learning System
import ApiLearningPage from './pages/integrations/api-learning';

// Client Intelligence
import ClientIntelligencePage from './pages/integrations/ClientIntelligencePage';

// Billing
import { PricingPage } from './pages/billing/PricingPage';

// Documents
import DocumentCenter from './pages/DocumentCenter';

// Help & User Guide
import UserGuidePage from './pages/UserGuidePage';

// Import at the top of the file
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import UnifiedAnalyticsPage from '@/pages/analytics/UnifiedAnalyticsPage';

// Redirect Components
const LegacyDeptRedirect: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  if (!departmentId) return <Navigate to="/" replace />;
  return <Navigate to={`/${departmentId}`} replace />;
};

const AppPathRedirect: React.FC = () => {
  const path = window.location.pathname.replace(/^\/app/, '') || '/';
  return <Navigate to={path} replace />;
};

// --- Static Page Imports ---
import { CompanyProfilePage } from './pages/onboarding/CompanyProfilePage';

// --- Dynamic Page Imports ---
// These are pages that can be loaded on demand.
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

/**
 * Main App Component
 * 
 * Routes for the application including all sidebar navigation items
 */
function App() {
  // Clean up any corrupted localStorage entries on app start
  React.useEffect(() => {
    try {
      cleanupCorruptedStorage();
    } catch (error) {
      console.warn('Failed to cleanup corrupted storage:', error);
    }
  }, []);

  return (
    <MicrosoftGraphProvider>
      <SystemContextProvider>
        <NotificationProvider>
          <OnboardingProvider>
            <Routes>
              {/* Public Marketing Landing Page */}
              <Route path="/" element={<MarketingLanding />} />
              
              {/* Public Marketing Pages */}
              <Route path="/pricing" element={<PricingPage />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/integrations/google-analytics/callback" element={<GoogleAnalyticsCallback />} />
              <Route path="/integrations/google-workspace/callback" element={<GoogleWorkspaceCallback />} />
              <Route path="/integrations/ninjarmm/callback" element={<NinjaRmmCallback />} />
              <Route path="/microsoft365/callback" element={<Microsoft365Callback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/email-not-verified" element={<EmailNotVerified />} />
              
              {/* Protected App Routes (now at root) */}
              <Route element={
                <ProtectedRoute>
                  <UnifiedLayout><Outlet /></UnifiedLayout>
                </ProtectedRoute>
              }>
                {/* Core Routes */}
                <Route path="/dashboard" element={<EnhancedDashboard />} />
                <Route path="/company-status" element={<CompanyStatusPage />} />
                <Route path="/workspace" element={<WorkspacePage />} />
                <Route path="/documents" element={<DocumentCenter />} />
                <Route path="/user-guide" element={<UserGuidePage />} />
                <Route path="/assessment" element={<AssessmentPage />} />
                
                {/* Department Routes - Standardized Structure */}
                <Route path="/operations" element={<OperationsPage />} />
                <Route path="/operations/analytics" element={<AnalyticsDashboardPage />} />
                
                <Route path="/sales" element={<DepartmentHomePage />} />
                <Route path="/sales/performance" element={<SalesPerformancePage />} />
                
                <Route path="/finance" element={<DepartmentHomePage />} />
                <Route path="/finance/operations" element={<FinancialOperationsPage />} />
                
                <Route path="/marketing" element={<DepartmentHomePage />} />
                <Route path="/marketing/analytics" element={<MarketingAnalyticsPage />} />
                
                <Route path="/support" element={<DepartmentHomePage />} />
                <Route path="/support/analytics" element={<SupportAnalyticsPage />} />
                
                <Route path="/maturity" element={<DepartmentHomePage />} />
                <Route path="/maturity/analytics" element={<MaturityAnalyticsPage />} />
                
                <Route path="/hr" element={<DepartmentHomePage />} />
                <Route path="/it" element={<DepartmentHomePage />} />
                <Route path="/product" element={<DepartmentHomePage />} />
                <Route path="/customer-success" element={<DepartmentHomePage />} />
                <Route path="/legal" element={<DepartmentHomePage />} />

                {/* Analytics Routes - Consolidated Structure */}
                <Route path="/analytics" element={<DataWarehouseHome />} />
                <Route path="/analytics/unified" element={<UnifiedAnalyticsPage />} />
                
                {/* AI Routes */}
                <Route path="/ai-hub" element={<AIHubPage />} />
                <Route path="/chat" element={<ChatPage />} />
                
                {/* Business Intelligence Routes */}
                <Route path="/business/setup" element={<QuickBusinessSetup />} />
                <Route path="/business/advisor" element={<BusinessIntelligentChat />} />
                
                {/* Settings Routes */}
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* Onboarding Routes */}
                <Route path="/onboarding/company-profile" element={<CompanyProfilePage />} />
                
                {/* Settings & Profile */}
                <Route path="/profile" element={<ProfilePage />} />
                
                {/* 404 Route */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Legacy route redirects - consolidated */}
              <Route path="/app/*" element={<AppPathRedirect />} />
              <Route path="/departments/:departmentId/*" element={<LegacyDeptRedirect />} />
              <Route path="/api-learning" element={<Navigate to="/integrations/api-learning" replace />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </OnboardingProvider>
        </NotificationProvider>
      </SystemContextProvider>
    </MicrosoftGraphProvider>
  );
}

export default App;
