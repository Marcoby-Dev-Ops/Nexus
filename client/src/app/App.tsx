import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthentikAuthProvider } from '@/shared/contexts/AuthentikAuthContext';
import { UserProvider } from '@/shared/contexts/UserContext';
import { CompanyProvider } from '@/shared/contexts/CompanyContext';
import { UserPreferencesProvider } from '@/shared/contexts/UserPreferencesContext';
import { clearAuthConflicts, hasAuthConflicts } from '@/shared/auth/clearAuthConflicts';
import { ToastProvider } from '@/shared/ui/components/Toast';

import { UnifiedLayout } from '@/shared/components/layout/UnifiedLayout';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { PublicRoute } from '@/shared/components/PublicRoute';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

// Core pages - only what we need for foundation
import { PrivacyPage } from '@/shared/pages/PrivacyPage';
import { TermsPage } from '@/shared/pages/TermsPage';
// ...existing code...
import Login from '@/pages/auth/Login';
import ProfilePage from '@/pages/auth/ProfilePage';
import AuthentikAuthCallback from '@/pages/admin/AuthentikAuthCallback';
import NotificationsSettings from '@/pages/admin/NotificationsSettings';
import SettingsPage from '@/pages/admin/SettingsPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import AuthDebug from '@/pages/auth/AuthDebug';
import JourneysPage from '@/pages/journey/JourneysPage';
import BusinessIdentityJourneyPage from '@/pages/journey/BusinessIdentityJourneyPage';
import KnowledgePage from '@/pages/knowledge/KnowledgePage';
import ChatPage from '@/pages/chat/ChatPage';
import AuditPage from '@/pages/audit/AuditPage';
import CoolifyOpsPage from '@/pages/operations/CoolifyOpsPage';
import AtomModelPage from '@/pages/AtomModelPage';
import UnifiedInboxPage from '@/pages/email/UnifiedInboxPage';
import EmailIntelligencePage from '@/pages/email/EmailIntelligencePage';
import AIAgentPage from '@/pages/ai/AIAgentPage';
import AISettingsPage from '@/pages/ai/AISettingsPage';
import AIModelSettings from '@/pages/admin/AIModelSettings';
import DashboardPage from '@/pages/dashboard/DashboardPage';



// Integrations pages
import IntegrationMarketplacePage from '@/pages/integrations/IntegrationMarketplacePage';
import TestOAuthPage from '../pages/integrations/TestOAuthPage';
import { OAuthCallbackPage } from '../pages/integrations/OAuthCallbackPage';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/pricing" element={<Navigate to="/chat" replace />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
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
        element={<Navigate to="https://nexus.marcoby.com/signup" replace />}
      />

      {/* Auth callback routes - must be public */}
      <Route path="/admin/auth-callback" element={<AuthentikAuthCallback />} />
      <Route path="/auth/callback" element={<AuthentikAuthCallback />} />

      {/* Debug route - public for troubleshooting */}
      <Route path="/auth/debug" element={<AuthDebug />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsSettings />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Settings routes */}
      <Route
        path="/settings/:section?"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Knowledge - What Nexus knows about you */}
      <Route
        path="/knowledge"
        element={
          <ProtectedRoute>
            <KnowledgePage />
          </ProtectedRoute>
        }
      />

      {/* Journey routes */}
      <Route
        path="/journey-management"
        element={
          <ProtectedRoute>
            <JourneysPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journey/business-identity/:journeyId?"
        element={
          <ProtectedRoute>
            <BusinessIdentityJourneyPage />
          </ProtectedRoute>
        }
      />



      {/* AI Chat route */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      {/* AI & Specialist Management */}
      <Route
        path="/ai-agent"
        element={
          <ProtectedRoute>
            <AIAgentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-settings"
        element={
          <ProtectedRoute>
            <AISettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/ai-model-settings"
        element={
          <ProtectedRoute>
            <AIModelSettings />
          </ProtectedRoute>
        }
      />

      {/* Audit & Transparency */}
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditPage />
          </ProtectedRoute>
        }
      />

      {/* Integrations routes */}
      <Route
        path="/integrations"
        element={
          <ProtectedRoute>
            <IntegrationMarketplacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations/manage"
        element={
          <ProtectedRoute>
            <IntegrationMarketplacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations/marketplace"
        element={
          <ProtectedRoute>
            <IntegrationMarketplacePage />
          </ProtectedRoute>
        }
      />

      {/* Ops */}
      <Route
        path="/operations/coolify"
        element={
          <ProtectedRoute>
            <CoolifyOpsPage />
          </ProtectedRoute>
        }
      />

      {/* Nexus Atom Model (Registry visualization) */}
      <Route
        path="/atom-model"
        element={
          <ProtectedRoute>
            <AtomModelPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations/test-oauth"
        element={
          <ProtectedRoute>
            <TestOAuthPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations/oauth/callback"
        element={
          <ProtectedRoute>
            <OAuthCallbackPage />
          </ProtectedRoute>
        }
      />

      {/* Email workspace routes */}
      <Route
        path="/tasks/workspace/inbox"
        element={
          <ProtectedRoute>
            <UnifiedInboxPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/email-intelligence"
        element={
          <ProtectedRoute>
            <EmailIntelligencePage />
          </ProtectedRoute>
        }
      />

      {/* Redirect all other routes to chat */}
      <Route
        path="*"
        element={<Navigate to="/chat" replace />}
      />
    </Routes>
  );
}

function App() {
  // Clear any MSAL conflicts on app initialization (removed useEffect to fix hooks issue)
  // TODO: Move this to a different initialization approach
  if (typeof window !== 'undefined') {
    if (hasAuthConflicts()) {
      clearAuthConflicts();
    }
  }

  return (
    <ToastProvider>
      <AuthentikAuthProvider>
        <UserProvider>
          <CompanyProvider>
            <UserPreferencesProvider>
              <ErrorBoundary fallback={(
                <div className="min-h-screen flex items-center justify-center bg-background">
                  <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    <p className="text-muted-foreground">Something went wrong. Please try again.</p>
                  </div>
                </div>
              )}>
                <UnifiedLayout>
                  <Suspense fallback={<LoadingSpinner />}>
                    <AppRoutes />
                  </Suspense>
                </UnifiedLayout>
              </ErrorBoundary>
            </UserPreferencesProvider>
          </CompanyProvider>
        </UserProvider>
      </AuthentikAuthProvider>
    </ToastProvider>
  );
}

export default App;
