import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout Components
import AppShell from './components/layout/AppShell';

// Providers
import { NotificationProvider } from './contexts/NotificationContext';

// Pages
import Dashboard from './pages/Dashboard';
import NotFoundPage from './pages/NotFoundPage';
import AIHubPage from './pages/AIHubPage';
import WorkspacePage from './pages/WorkspacePage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/settings/SettingsPage';
import IntegrationsPage from './pages/settings/IntegrationsPage';
import { Login } from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';

// Department Pages
import FinancialOperationsPage from './pages/departments/finance/FinancialOperationsPage';
import SalesPerformancePage from './pages/departments/sales/SalesPerformancePage';
import AnalyticsDashboardPage from './pages/departments/operations/AnalyticsDashboardPage';

// Analytics Pages
import BusinessHealthDetail from './pages/analytics/BusinessHealthDetail';

// Data Warehouse
import DataWarehouseHome from './datawarehouse/DataWarehouseHome';

// Marketplace
import Marketplace from './marketplace/Marketplace';

// Import at the top of the file
import { ProtectedRoute } from './components/auth/ProtectedRoute';

/**
 * Main App Component
 * 
 * Routes for the application including all sidebar navigation items
 */
function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
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
            
            {/* Department Routes */}
            <Route path="/departments/finance/operations" element={<FinancialOperationsPage />} />
            <Route path="/departments/sales/performance" element={<SalesPerformancePage />} />
            <Route path="/departments/operations/analytics" element={<AnalyticsDashboardPage />} />
            <Route path="/data-warehouse" element={<DataWarehouseHome />} />
            
            {/* AI Routes */}
            <Route path="/ai-hub" element={<AIHubPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/analytics" element={<AnalyticsDashboardPage />} />
            
            {/* Analytics Routes */}
            <Route path="/analytics/business-health" element={<BusinessHealthDetail />} />
            <Route path="/analytics/business-health/:categoryId" element={<BusinessHealthDetail />} />
            
            {/* Marketplace Routes */}
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            
            {/* Admin Routes */}
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;
