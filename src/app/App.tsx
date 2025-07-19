import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { ThemeProvider } from '@/shared/components/ui/theme-provider';
// Layout Components
import { UnifiedLayout } from '@/shared/components/layout/UnifiedLayout';
import { HelpLayout } from '@/shared/layouts/HelpLayout';
import { AppWithOnboarding } from '@/shared/components/layout/AppWithOnboarding';

// Auth Components
import { ProtectedRoute, PublicRoute } from '@/shared/components/auth/ProtectedRoute';

// Providers
import { NotificationProvider } from '@/core/hooks/NotificationContext';
import { SystemContextProvider } from '@/core/hooks/SystemContext';
import { OnboardingProvider } from '@/domains/admin/onboarding/hooks/OnboardingContext';
import { FireCycleProvider } from '@/core/fire-cycle/FireCycleProvider';

// Storage cleanup
import { cleanupCorruptedStorage } from '@/core/auth/secureStorage';

// Callback system
import { initializeCallbackSystem } from '@/shared/callbacks';

// Lazy‑loaded Pages
const AIHubPage         = React.lazy(() => import('@/domains/ai/pages/AIHubPage'));
const WorkspacePage     = React.lazy(() => import('@/domains/workspace/pages/WorkspacePage'));
const ChatPage          = React.lazy(() => import('@/domains/ai/pages/ChatPage'));
const AICapabilitiesPage = React.lazy(() => import('@/domains/ai/pages/AICapabilities'));
const AIPerformancePage = React.lazy(() => import('@/domains/ai/pages/AIPerformancePage'));
const IntegrationsPage  = React.lazy(() => import('@/domains/analytics/pages/IntegrationsPage'));
const FireCyclePage     = React.lazy(() => import('@/domains/analytics/pages/FireCyclePage'));
const ProfilePage       = React.lazy(() => import('@/domains/admin/user/pages/ProfilePage'));
const AuthCallback      = React.lazy(() => import('@/domains/admin/user/pages/AuthCallback'));
const EmailNotVerified  = React.lazy(() => import('@/domains/admin/user/pages/EmailNotVerified'));
const UnifiedCallback   = React.lazy(() => import('@/shared/pages/UnifiedCallbackPage'));
// const AssessmentPage    = React.lazy(() => import('@/domains/assessment/pages/AssessmentPage'));
// const KnowledgePage     = React.lazy(() => import('@/domains/knowledge/pages/KnowledgePage'));
const KnowledgeHome     = React.lazy(() => import('@/domains/knowledge/pages/Home'));

// Static Imports
import ApiLearningPage   from '@/domains/analytics/pages/IntegrationTrackingPage';
import { SignUp }        from '@/domains/admin/user/pages/SignUp';
import { LoginPage }     from '@/domains/admin/user/pages/LoginPage';
import SettingsPage      from '@/domains/admin/user/pages/SettingsPage';
import { LandingPage }   from '@/shared/pages/LandingPage';
import { PrivacyPolicyPage } from '@/domains/help-center/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from '@/domains/help-center/pages/TermsOfServicePage';

/**
 * Main App Component
 * 
 * Routes for the application including all sidebar navigation items
 */
function App() {
  const { user, session } = useAuth();
  const location = useLocation();
  
  // List of protected route prefixes
  const PROTECTED_ROUTE_PREFIXES = [
    '/dashboard', '/workspace', '/ai-hub', '/chat', '/ai-performance', '/business-setup', '/business-chat', '/analytics', '/data-warehouse', '/assessment', '/company-status', '/think', '/see', '/act', '/sales', '/finance', '/marketing', '/operations', '/support', '/hr', '/it', '/product', '/customer-success', '/legal', '/maturity', '/sales-performance', '/financial-operations', '/integrations', '/settings', '/profile', '/onboarding/company-profile', '/documents', '/admin', '/component/'
  ];

  // Clean up any corrupted localStorage entries on app start
  React.useEffect(() => {
    try {
      cleanupCorruptedStorage();
    } catch (error: unknown) {
      console.warn('Failed to cleanup corrupted storage:', error);
    }
  }, []);

  // Initialize callback system
  React.useEffect(() => {
    initializeCallbackSystem().catch(error => {
      console.error('Failed to initialize callback system:', error);
    });
  }, []);

  // Only start engines on protected routes
  React.useEffect(() => {
    if (
      user && session &&
      PROTECTED_ROUTE_PREFIXES.some(prefix => location.pathname.startsWith(prefix))
    ) {
      // Removed: nexusUnifiedBrain.startUnifiedAnalysis?.();
      // Removed: realTimeCrossDepartmentalSync.startRealTimeProcessing?.();
    }
  }, [user, session, location.pathname]);

  return (
    <>
      {/* Floating Capture Thought Button (FAB) */}
      {/* Global Thought Assistant Modal */}
      {/* Removed: <ThoughtAssistantWidget open={isOpen} onClose={close} /> */}
      <SystemContextProvider>
        <NotificationProvider>
          <OnboardingProvider>
            <ThemeProvider defaultTheme="system" defaultColor="green">
              <Routes>
                  {/* Public Routes - No Authentication Required */}
                  
                  {/* Landing Page - Public */}
                  <Route path="/" element={
                    <div className="min-h-screen bg-background">
                      {/* Simple Navigation for Public Pages */}
                      <nav className="bg-card shadow-sm border-b">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                          <div className="flex justify-between h-16">
                            <div className="flex items-center">
                              <Link to="/home" className="flex items-center">
                                <img 
                                  src="/Nexus/nexus-horizontal-160x48-transparent.png" 
                                  alt="Nexus by Marcoby" 
                                  className="h-8 w-auto"
                                />
                              </Link>
                            </div>
                            <div className="flex items-center space-x-8">
                              {/* Always show only public navigation for the landing page */}
                              <Link to="/pricing" className="text-foreground/90 hover:text-primary font-medium">
                                Pricing
                              </Link>
                              <Link to="/login" className="text-foreground/90 hover:text-primary font-medium">
                                Sign In
                              </Link>
                              <Link to="/signup" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                                Get Started
                              </Link>
                            </div>
                          </div>
                        </div>
                      </nav>
                      <main><LandingPage /></main>
                    </div>
                  } />

                  {/* Login/Signup Routes - Public but redirect authenticated users */}
                  <Route path="/login" element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  } />
                  
                  <Route path="/signup" element={
                    <PublicRoute>
                      <SignUp />
                    </PublicRoute>
                  } />

                  {/* Auth Callback Routes - Public */}
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/auth/google-analytics-callback" element={<UnifiedCallback integrationSlug="google-analytics" />} />
                  <Route path="/integrations/:integration/callback" element={<UnifiedCallback />} />
                  <Route path="/email-not-verified" element={<EmailNotVerified />} />

                  {/* Help Site - Public */}
                  <Route path="/help" element={<HelpLayout />} />

                  {/* Legal Routes - Public */}
                  <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/legal/terms" element={<TermsOfServicePage />} />

                  {/* Protected Routes - Require Authentication */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AppWithOnboarding>
                          <ThemeProvider defaultTheme="system" defaultColor="green">
                            <FireCycleProvider>
                              <Routes>
                              {/* Dashboard */}
                              <Route path="/dashboard" element={<Navigate to="/home" replace />} />
                              
                              {/* Workspace */}
                              <Route path="/workspace" element={
                                <UnifiedLayout>
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <WorkspacePage />
                                  </Suspense>
                                </UnifiedLayout>
                              } />
                              
                              {/* AI Hub */}
                              <Route path="/ai-hub" element={
                                <UnifiedLayout>
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <AIHubPage />
                                  </Suspense>
                                </UnifiedLayout>
                              } />
                              
                              {/* Chat */}
                              <Route path="/chat" element={
                                <UnifiedLayout>
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <ChatPage />
                                  </Suspense>
                                </UnifiedLayout>
                              } />
                              
                              {/* AI Capabilities */}
                              <Route path="/ai-capabilities" element={
                                <UnifiedLayout>
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <AICapabilitiesPage />
                                  </Suspense>
                                </UnifiedLayout>
                              } />
                              
                              {/* AI Performance */}
                              <Route path="/ai-performance" element={
                                <UnifiedLayout>
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <AIPerformancePage />
                                  </Suspense>
                                </UnifiedLayout>
                              } />
                              
                              {/* Integrations */}
                              <Route path="/integrations" element={
                                <UnifiedLayout>
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <IntegrationsPage />
                                  </Suspense>
                                </UnifiedLayout>
                              } />
                              
                              <Route path="/integrations/api-learning" element={
                                <UnifiedLayout>
                                  <ApiLearningPage />
                                </UnifiedLayout>
                              } />
                              
                              {/* Fire Cycle */}
                              <Route path="/fire-cycle" element={
                                <UnifiedLayout>
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <FireCyclePage />
                                  </Suspense>
                                </UnifiedLayout>
                              } />
                              
                              {/* Settings */}
                              <Route path="/settings" element={
                                <UnifiedLayout>
                                  <SettingsPage />
                                </UnifiedLayout>
                              } />
                              
                              <Route path="/settings/profile" element={
                                <UnifiedLayout>
                                  <ProfilePage />
                                </UnifiedLayout>
                              } />
                              
                              {/* Profile */}
                              <Route path="/profile" element={
                                <UnifiedLayout>
                                  <React.Suspense fallback={<div>Loading...</div>}>
                                    <ProfilePage />
                                  </React.Suspense>
                                </UnifiedLayout>
                              } />
                              
                              {/* Knowledge/Home */}
                              <Route path="/knowledge" element={
                                <UnifiedLayout>
                                  <React.Suspense fallback={<div>Loading...</div>}>
                                    <KnowledgeHome />
                                  </React.Suspense>
                                </UnifiedLayout>
                              } />
                              
                              <Route path="/home" element={
                                <UnifiedLayout>
                                  <KnowledgeHome />
                                </UnifiedLayout>
                              } />

                              {/* Catch-all for protected routes - redirect to home */}
                              <Route path="*" element={<Navigate to="/home" replace />} />
                            </Routes>
                          </FireCycleProvider>
                        </ThemeProvider>
                        </AppWithOnboarding>
                      </ProtectedRoute>
                    } />
                </Routes>
              </ThemeProvider>
            </OnboardingProvider>
          </NotificationProvider>
        </SystemContextProvider>
    </>
  );
}

export default App;
