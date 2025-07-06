import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';

// Layout Components
import { UnifiedLayout } from './components/layout/UnifiedLayout';
import { HelpLayout } from './layouts/HelpLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Providers
import { NotificationProvider } from './contexts/NotificationContext';
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
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { PasswordResetPage } from './pages/PasswordResetPage';
import AuthCallback from './pages/AuthCallback';
import EmailNotVerified from './pages/EmailNotVerified';
import GoogleAnalyticsCallback from './pages/GoogleAnalyticsCallback';

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
import OperationsPage from './pages/departments/operations/OperationsPage';
import SalesPage from './pages/departments/sales/SalesPage';
import FinancePage from './pages/departments/finance/FinancePage';
import MarketingPage from './pages/departments/marketing/MarketingPage';
import SupportPage from './pages/departments/support/SupportPage';
import MaturityPage from './pages/departments/maturity/MaturityPage';
import HRPage from './pages/departments/hr/HRPage';
import ITPage from './pages/departments/it/ITPage';
import ProductPage from './pages/departments/product/ProductPage';
import CustomerSuccessPage from './pages/departments/customer-success/CustomerSuccessPage';
import LegalPage from './pages/departments/legal/LegalPage';

// Analytics Pages
import AssessmentPage from './pages/AssessmentPage';
import CompanyStatusPage from './pages/CompanyStatusPage';

// Data Warehouse
import DataWarehouseHome from './pages/analytics/DataWarehouseHome';

// API Learning System
import ApiLearningPage from './pages/integrations/api-learning';

// Client Intelligence
import ClientIntelligencePage from './pages/integrations/ClientIntelligencePage';

// Help & User Guide
import { UserGuidePage } from './pages/help/UserGuidePage';
import { PrivacyPolicyPage } from './pages/help/PrivacyPolicyPage';
import { DataUsagePage } from './pages/help/DataUsagePage';
import { SecurityCompliancePage } from './pages/help/SecurityCompliancePage';
import { AboutPage } from './pages/help/AboutPage';
import { AdminPage } from './pages/admin/AdminPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';

// Import at the top of the file
// import { ProtectedRoute } from './components/auth/ProtectedRoute';

import UnifiedAnalyticsPage from '@/pages/analytics/UnifiedAnalyticsPage';
import { SeePage } from '@/pages/SeePage';
import { ThinkPage } from '@/pages/ThinkPage';
import { ActPage } from '@/pages/ActPage';

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

// Billing
import { PricingPage } from './pages/billing/PricingPage';

// Documents
import DocumentCenter from './pages/DocumentCenter';

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
    <SystemContextProvider>
      <NotificationProvider>
        <OnboardingProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Routes>
              {/* Public Marketing Landing Page */}
              <Route path="/" element={<MarketingLanding />} />
              
              {/* Public Marketing Pages */}
              <Route path="/pricing" element={<PricingPage />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/integrations/google-analytics/callback" element={<GoogleAnalyticsCallback />} />
              <Route path="/password-reset" element={<PasswordResetPage />} />
              <Route path="/email-not-verified" element={<EmailNotVerified />} />
              
              {/* Help Center Routes (Publicly Accessible) */}
              <Route path="/help" element={<HelpLayout />}>
                <Route index element={<Navigate to="/help/user-guide" replace />} />
                <Route path="user-guide" element={<UserGuidePage />} />
                <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="data-usage" element={<DataUsagePage />} />
                <Route path="security-compliance" element={<SecurityCompliancePage />} />
                <Route path="about" element={<AboutPage />} />
              </Route>
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminPage />} />
                <Route path="users" element={<UserManagementPage />} />
              </Route>
              
              {/* Protected App Routes (now at root) */}
              <Route element={<UnifiedLayout><Outlet /></UnifiedLayout>}>
                {/* Core Routes */}
                <Route path="/dashboard" element={<EnhancedDashboard />} />
                <Route path="/see" element={<SeePage />} />
                <Route path="/think" element={<ThinkPage />} />
                <Route path="/act" element={<ActPage />} />
                <Route path="/company-status" element={<CompanyStatusPage />} />
                <Route path="/workspace" element={<WorkspacePage />} />
                <Route path="/documents" element={<DocumentCenter />} />
                <Route path="/assessment" element={<AssessmentPage />} />
                
                {/* Department Routes - Standardized Structure */}
                <Route path="/operations" element={<OperationsPage />} />
                <Route path="/operations/analytics" element={<AnalyticsDashboardPage />} />
                
                <Route path="/sales" element={<SalesPage />} />
                <Route path="/sales/performance" element={<SalesPerformancePage />} />
                
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/finance/operations" element={<FinancialOperationsPage />} />
                
                <Route path="/marketing" element={<MarketingPage />} />
                <Route path="/marketing/analytics" element={<MarketingAnalyticsPage />} />
                
                <Route path="/support" element={<SupportPage />} />
                <Route path="/support/analytics" element={<SupportAnalyticsPage />} />
                
                <Route path="/maturity" element={<MaturityPage />} />
                <Route path="/maturity/analytics" element={<MaturityAnalyticsPage />} />
                
                <Route path="/hr" element={<HRPage />} />
                <Route path="/it" element={<ITPage />} />
                <Route path="/product" element={<ProductPage />} />
                <Route path="/customer-success" element={<CustomerSuccessPage />} />
                <Route path="/legal" element={<LegalPage />} />

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
          </ThemeProvider>
        </OnboardingProvider>
      </NotificationProvider>
    </SystemContextProvider>
  );
}

export default App;
