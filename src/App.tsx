import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import { Login } from '@/pages/Login';
import { SignUp } from '@/pages/SignUp';
import { AuthCallback } from '@/pages/AuthCallback';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Settings } from '@/pages/Settings';
import Dashboard from '@/pages/Dashboard';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { AICapabilities } from './pages/AICapabilities';
import { AIDashboard } from './pages/AIDashboard';
import { AITransformation } from './pages/AITransformation';
import Nexus from './pages/Nexus';
import Profile from './pages/Profile';
import Integrations from './pages/Integrations';
import IntegrationsShowcase from './pages/IntegrationsShowcase';
import WaitlistLanding from './pages/WaitlistLanding';
import WaitlistDashboard from './pages/WaitlistDashboard';
import ChatPage from './pages/ChatPage';
import { BillingPage } from './pages/billing/BillingPage';

const SalesHome = lazy(() => import('@/pages/departments/sales/SalesHome'));
const FinanceHome = lazy(() => import('@/pages/departments/finance/FinanceHome'));
const OperationsHome = lazy(() => import('@/pages/departments/operations/OperationsHome'));
const Marketplace = lazy(() => import('@/marketplace/Marketplace'));
const DataWarehouseHome = lazy(() => import('@/datawarehouse/DataWarehouseHome'));
const AdminHome = lazy(() => import('@/components/dashboard/AdminHome'));

/**
 * @name App
 * @description The root component of the application, rendering the main dashboard and routes.
 * @returns {JSX.Element} The rendered App component.
 */
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<div className="p-8">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/nexus" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Standalone Waitlist Pages (No AppShell) */}
            <Route path="/waitlist" element={<WaitlistLanding />} />
            <Route path="/join" element={<WaitlistLanding />} />
            
            <Route element={<AppShell />}>
              <Route path="/nexus" element={<ProtectedRoute><Nexus /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
          <Route path="/integrations-showcase" element={<ProtectedRoute><IntegrationsShowcase /></ProtectedRoute>} />
          <Route path="/admin/waitlist" element={<ProtectedRoute><WaitlistDashboard /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/sales" element={<SalesHome />} />
              <Route path="/finance" element={<FinanceHome />} />
              <Route path="/operations" element={<OperationsHome />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/data-warehouse" element={<DataWarehouseHome />} />
              <Route path="/admin" element={<AdminHome />} />
              <Route path="/ai-capabilities" element={<AICapabilities />} />
              <Route path="/ai-dashboard" element={<AIDashboard />} />
              <Route path="/ai-transformation" element={<AITransformation />} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/nexus" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
