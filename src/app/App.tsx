import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/shared/components/ui/theme-provider';

// Import auth components
import { RequireAuth } from '@/shared/components/auth/RequireAuth';
import { PublicOnly } from '@/shared/components/auth/PublicOnly';

// Import pages
import { LandingPage } from '@/shared/pages/LandingPage';
import LoginPage from '@/domains/admin/user/pages/LoginPage';
import SignupPage from '@/domains/admin/user/pages/SignupPage';
import AuthCallback from '@/domains/admin/user/pages/AuthCallback';
import UnifiedCallback from '@/shared/pages/UnifiedCallbackPage';
import Microsoft365CallbackPage from '@/domains/integrations/pages/Microsoft365CallbackPage';
import HubSpotCallbackPage from '@/domains/integrations/pages/HubSpotCallbackPage';
import EmailNotVerified from '@/domains/admin/user/pages/EmailNotVerified';
import { FeatureDiscovery } from '@/shared/components/layout/FeatureDiscovery';
import { PrivacyPolicyPage } from '@/domains/help-center/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/domains/help-center/pages/TermsOfServicePage';
import PasswordResetPage from '@/domains/admin/user/pages/PasswordResetPage';
import ResetPassword from '@/domains/admin/user/pages/ResetPassword';

// Import protected pages
import { HomePage } from '@/domains/dashboard/home/pages/HomePage';
import SettingsPage from '@/domains/admin/user/pages/SettingsPage';
import ProfilePage from '@/domains/admin/user/pages/Profile';
import { AdminPage } from '@/domains/admin/pages/AdminPage';

// Import components
import { AppWithOnboarding } from '@/shared/components/layout/AppWithOnboarding';
import { UnifiedLayout } from '@/shared/components/layout/UnifiedLayout';
import { AuthProvider } from '@/core/auth/AuthProvider';
import { DataProvider } from '@/shared/contexts/DataContext';
import { NotificationProvider } from '@/core/hooks/NotificationContext';

/**
 * Main App Component - Microsoft-Style Layered Architecture
 * 
 * This follows Microsoft's enterprise pattern:
 * 1. AuthProvider wraps the entire app
 * 2. DataProvider wraps protected routes for reliable data fetching
 * 3. Public routes use PublicOnly wrapper
 * 4. Protected routes use RequireAuth wrapper
 */
function App() {
  return (
    <div className="min-h-screen">
      <ThemeProvider defaultTheme="system" defaultColor="green">
        <AuthProvider>
          <NotificationProvider>
            <Routes>
            {/* Public Routes - Redirect authenticated users */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={
              <PublicOnly>
                <LoginPage />
              </PublicOnly>
            } />
            <Route path="/signup" element={
              <PublicOnly>
                <SignupPage />
              </PublicOnly>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/google-analytics-callback" element={<UnifiedCallback integrationSlug="google-analytics" />} />
            <Route path="/integrations/:integration/callback" element={<UnifiedCallback />} />
            <Route path="/integrations/microsoft/callback" element={<Microsoft365CallbackPage />} />
            <Route path="/integrations/hubspot/callback" element={<HubSpotCallbackPage />} />

            <Route path="/email-not-verified" element={<EmailNotVerified />} />
            <Route path="/features" element={
              <Suspense fallback={<div>Loading...</div>}>
                <FeatureDiscovery />
              </Suspense>
            } />
            <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/legal/terms" element={<TermsOfServicePage />} />
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes - Require authentication with DataProvider */}
            <Route path="/dashboard" element={
              <RequireAuth>
                <DataProvider>
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <HomePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                </DataProvider>
              </RequireAuth>
            } />

            <Route path="/dashboard/home" element={
              <RequireAuth>
                <DataProvider>
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <HomePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                </DataProvider>
              </RequireAuth>
            } />

            <Route path="/settings" element={
              <RequireAuth>
                <DataProvider>
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <SettingsPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                </DataProvider>
              </RequireAuth>
            } />

            <Route path="/profile" element={
              <RequireAuth>
                <DataProvider>
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <ProfilePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                </DataProvider>
              </RequireAuth>
            } />

            <Route path="/admin" element={
              <RequireAuth>
                <DataProvider>
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <AdminPage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                </DataProvider>
              </RequireAuth>
            } />

            <Route path="/home" element={
              <RequireAuth>
                <DataProvider>
                  <AppWithOnboarding>
                    <UnifiedLayout>
                      <Suspense fallback={<div>Loading...</div>}>
                        <HomePage />
                      </Suspense>
                    </UnifiedLayout>
                  </AppWithOnboarding>
                </DataProvider>
              </RequireAuth>
            } />

            {/* Catch-all - redirect to login for unknown routes */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App; 