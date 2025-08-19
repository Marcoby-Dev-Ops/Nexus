import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { TenantsPage } from '@/pages/TenantsPage';
import { UsersPage } from '@/pages/UsersPage';
import { AIUsagePage } from '@/pages/AIUsagePage';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { BillingPage } from '@/pages/BillingPage';
import { SystemHealthPage } from '@/pages/SystemHealthPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="ai-usage" element={<AIUsagePage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="system-health" element={<SystemHealthPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
