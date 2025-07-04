import React, { lazy, Suspense, useState, useEffect } from 'react';
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
import { CentralizedAppsHub } from './components/dashboard/CentralizedAppsHub';


const SalesHome = lazy(() => import('@/pages/departments/sales/SalesHome'));
const FinanceHome = lazy(() => import('@/pages/departments/finance/FinanceHome'));
const OperationsHome = lazy(() => import('@/pages/departments/operations/OperationsHome'));
const Marketplace = lazy(() => import('@/marketplace/Marketplace'));
const DataWarehouseHome = lazy(() => import('@/datawarehouse/DataWarehouseHome'));
const AdminHome = lazy(() => import('@/components/dashboard/AdminHome'));

// Main App Content Component
const AppContent = () => {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <Routes>
        <Route path="/" element={<WaitlistLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Standalone Waitlist Pages (No AppShell) */}
        <Route path="/waitlist" element={<Navigate to="/" replace />} />
        <Route path="/join" element={<Navigate to="/" replace />} />
        
        {/* Chat Page - Outside AppShell for full-screen onboarding */}
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        
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
          <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
          <Route path="/centralized-apps" element={<ProtectedRoute><CentralizedAppsHub /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

/**
 * @name AppWithOnboarding
 * @description The main app component - onboarding is now handled in ChatPage
 * @returns {JSX.Element} The rendered App component.
 */
function AppWithOnboarding() {
  return (
    <Router>
      {/* Main App Content - Chat page now handles onboarding internally */}
      <AppContent />
    </Router>
  );
}

/**
 * @name App
 * @description The root component
 * @returns {JSX.Element} The rendered App component.
 */
function App() {
  return (
    <ErrorBoundary>
      <AppWithOnboarding />
    </ErrorBoundary>
  );
}

export default App;
