import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

// Layout Components
import AppShell from './components/layout/AppShell';

// Providers
import { NotificationProvider } from './contexts/NotificationContext';
import { SupabaseProvider } from './lib/SupabaseProvider';

// Storage cleanup
import { cleanupCorruptedStorage } from './lib/security/secureStorage';

// Pages
import Dashboard from './pages/Dashboard';
import NotFoundPage from './pages/NotFoundPage';
import AIHubPage from './pages/AIHubPage';
import WorkspacePage from './pages/WorkspacePage';
import ChatPage from './pages/ChatPage';
import UnifiedInboxPage from './pages/UnifiedInboxPage';
import SettingsPage from './pages/settings/SettingsPage';
import SettingsIntegrationsPage from './pages/settings/IntegrationsPage';
import Integrations from './pages/Integrations';
import ProfileSettings from './pages/settings/ProfileSettings';
import SecuritySettings from './pages/settings/SecuritySettings';
import { Login } from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';
import EmailNotVerified from './pages/EmailNotVerified';

// Department Pages
import FinancialOperationsPage from './pages/departments/finance/FinancialOperationsPage';
import SalesPerformancePage from './pages/departments/sales/SalesPerformancePage';
import MarketingAnalyticsPage from './pages/departments/marketing/MarketingAnalyticsPage';
import SupportAnalyticsPage from './pages/departments/support/SupportAnalyticsPage';
import MaturityAnalyticsPage from './pages/departments/maturity/MaturityAnalyticsPage';
import AnalyticsDashboardPage from './pages/departments/operations/AnalyticsDashboardPage';
import DepartmentHomePage from './pages/departments/DepartmentHomePage';
import { OperationsDashboard } from './domains/operations';

// Analytics Pages
import BusinessHealthDetail from './pages/analytics/BusinessHealthDetail';

// Data Warehouse
import DataWarehouseHome from './pages/analytics/DataWarehouseHome';

// Marketplace
import Marketplace from './marketplace/Marketplace';

// Import at the top of the file
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// ---------------------------------------------------------------------------
// Legacy Route Redirect
// ---------------------------------------------------------------------------
const LegacyDeptRedirect: React.FC = () => {
  const { departmentId } = useParams();
  if (!departmentId) return <Navigate to="/" replace />;
  return <Navigate to={`/${departmentId}`} replace />;
};

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
    <SupabaseProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/email-not-verified" element={<EmailNotVerified />} />
            
            {/* Protected App Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }>
              {/* Core Routes */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/inbox" element={<UnifiedInboxPage />} />
              
              {/* Department Routes */}
              <Route path="/operations" element={<OperationsDashboard />} />
              <Route path="/sales" element={<DepartmentHomePage />} />
              <Route path="/finance" element={<DepartmentHomePage />} />
              <Route path="/support" element={<DepartmentHomePage />} />
              <Route path="/marketing" element={<DepartmentHomePage />} />
              <Route path="/maturity" element={<DepartmentHomePage />} />

              {/* Deep-dive analytics sub-routes */}
              <Route path="/finance/operations" element={<FinancialOperationsPage />} />
              <Route path="/sales/performance" element={<SalesPerformancePage />} />
              <Route path="/operations/analytics" element={<AnalyticsDashboardPage />} />
              <Route path="/marketing/analytics" element={<MarketingAnalyticsPage />} />
              <Route path="/support/analytics" element={<SupportAnalyticsPage />} />
              <Route path="/maturity/analytics" element={<MaturityAnalyticsPage />} />

              {/* Legacy /departments/* redirects → new top-level paths */}
              <Route path="/departments/:departmentId/*" element={<LegacyDeptRedirect />} />
              
              {/* Analytics Routes */}
              <Route path="/analytics" element={<DataWarehouseHome />} />
              
              {/* AI Routes */}
              <Route path="/ai-hub" element={<AIHubPage />} />
              <Route path="/chat" element={<ChatPage />} />
              
              {/* Analytics Routes */}
              <Route path="/analytics/business-health" element={<BusinessHealthDetail />} />
              <Route path="/analytics/business-health/:categoryId" element={<BusinessHealthDetail />} />
              
              {/* Marketplace Routes */}
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/integrations" element={<Integrations />} />
              
              {/* Settings Routes */}
              <Route path="/settings" element={<SettingsPage />}>
                <Route index element={<Navigate to="profile" replace />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="security" element={<SecuritySettings />} />
                <Route path="integrations" element={<SettingsIntegrationsPage />} />
              </Route>
              
              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </SupabaseProvider>
  );
}

export default App;
