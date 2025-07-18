import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { ThemeProvider } from '@/shared/components/ui/theme-provider';
import { Zap, Shield, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Layout Components
import { UnifiedLayout } from '@/shared/components/layout/UnifiedLayout';
import { HelpLayout } from '@/shared/layouts/HelpLayout';
import { Seo } from '@/shared/components/Seo';
import { AppWithOnboarding } from '@/shared/components/layout/AppWithOnboarding';

// Providers
import { NotificationProvider } from '@/core/hooks/NotificationContext';
import { SystemContextProvider } from '@/core/hooks/SystemContext';
import { OnboardingProvider } from '@/domains/admin/onboarding/hooks/OnboardingContext';

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
import SettingsPage      from '@/domains/admin/user/pages/SettingsPage';

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
            <ThemeProvider defaultTheme="system">
              <AppWithOnboarding>
                <Routes>
                  {/* Public Routes - Simple Layout */}
                  
                  {/* Landing and Demo Pages - Simple Layout */}
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
                      <main><HomePage /></main>
                    </div>
                  } />
                  {/* Add /login route here */}
                  <Route path="/login" element={<SignUp />} />
                  {/* Protected Routes - Wrapped in AuthProvider and other providers */}
                  {/*
                  PROTECTED ROUTES (require authentication):
                  - /dashboard
                  - /workspace
                  - /workspace/builder
                  - /workspace/marketplace
                  - /ai-hub
                  - /chat
                  - /ai-performance
                  - /business-setup
                  - /business-chat
                  - /analytics
                  - /data-warehouse
                  - /assessment
                  - /company-status
                  - /think
                  - /see
                  - /act
                  - /sales
                  - /finance
                  - /marketing
                  - /operations
                  - /support
                  - /hr
                  - /it
                  - /product
                  - /customer-success
                  - /legal
                  - /maturity
                  - /sales-performance
                  - /financial-operations
                  - /integrations
                  - /integrations/api-learning
                  - /integrations/client-intelligence
                  - /settings
                  - /settings/profile
                  - /settings/security
                  - /settings/team
                  - /settings/billing
                  - /profile
                  - /onboarding/company-profile
                  - /documents
                  - /admin
                  - /admin/users
                  - /component/:id
                */}
                  <Route
                    path="/*"
                    element={
                      <ThemeProvider defaultTheme="system">
                        <Routes>
                          {/* All protected routes go here, copy from previous implementation */}
                          <Route path="/dashboard" element={<Navigate to="/" replace />} />
                          <Route path="/workspace" element={<UnifiedLayout><Suspense fallback={<div>Loading...</div>}><WorkspacePage /></Suspense></UnifiedLayout>} />
                          <Route path="/ai-hub" element={<UnifiedLayout><Suspense fallback={<div>Loading...</div>}><AIHubPage /></Suspense></UnifiedLayout>} />
                          <Route path="/chat" element={<UnifiedLayout><Suspense fallback={<div>Loading...</div>}><ChatPage /></Suspense></UnifiedLayout>} />
                          <Route path="/ai-capabilities" element={<UnifiedLayout><Suspense fallback={<div>Loading...</div>}><AICapabilitiesPage /></Suspense></UnifiedLayout>} />
                          <Route path="/ai-performance" element={<UnifiedLayout><Suspense fallback={<div>Loading...</div>}><AIPerformancePage /></Suspense></UnifiedLayout>} />
                          <Route path="/integrations" element={<UnifiedLayout><Suspense fallback={<div>Loading...</div>}><IntegrationsPage /></Suspense></UnifiedLayout>} />
                          <Route path="/integrations/api-learning" element={<UnifiedLayout><ApiLearningPage /></UnifiedLayout>} />
                          <Route path="/settings" element={<UnifiedLayout><SettingsPage /></UnifiedLayout>} />
                          <Route path="/knowledge" element={<UnifiedLayout><React.Suspense fallback={<div>Loading...</div>}><KnowledgeHome /></React.Suspense></UnifiedLayout>} />
                          <Route path="/home" element={<UnifiedLayout><KnowledgeHome /></UnifiedLayout>} />
                          <Route path="/settings/profile" element={<UnifiedLayout><ProfilePage /></UnifiedLayout>} />
                          <Route path="/profile" element={<UnifiedLayout><React.Suspense fallback={<div>Loading...</div>}><ProfilePage /></React.Suspense></UnifiedLayout>} />
                          <Route path="/auth/callback" element={<AuthCallback />} />
                          <Route path="/auth/google-analytics-callback" element={<UnifiedCallback integrationSlug="google-analytics" />} />
                          <Route path="/integrations/:integration/callback" element={<UnifiedCallback />} />
                          <Route path="/email-not-verified" element={<EmailNotVerified />} />
                          {/* Help Site - Tree Navigation Layout */}
                          <Route path="/help" element={<HelpLayout />}></Route>
                        </Routes>
                      </ThemeProvider>
                    } />
                </Routes>
              </AppWithOnboarding>
            </ThemeProvider>
          </OnboardingProvider>
        </NotificationProvider>
      </SystemContextProvider>
    </>
  );
}

// --- HomePage: Story-Driven, Intriguing, Branded Landing ---
// NOTE: Replace image path as needed. Ready for copy-paste.

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Nexus – The Business Operating System | Marcoby"
        description="Nexus is the operating system for modern business—a unified, secure, and scalable platform to run your entire company."
        canonical="https://nexus.marcoby.com/"
        image="https://nexus.marcoby.com/og-image.png"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Marcoby',
          url: 'https://nexus.marcoby.com/',
          logo: 'https://nexus.marcoby.com/nexus-horizontal-160x48-transparent.png',
          sameAs: [
            'https://www.linkedin.com/company/marcoby',
            'https://twitter.com/marcobyhq'
          ]
        }}
      />
      {/* HERO: OS for Business */}
      <header className="min-h-[50vh] sm:min-h-[60vh] md:min-h-[65vh] lg:min-h-[70vh] flex-1 flex flex-col justify-center items-center text-center py-12 md:py-16 lg:py-20 px-4 sm:px-8 bg-background">
        <div className="w-full flex flex-col items-center" style={{ maxWidth: '700px' }}>
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight drop-shadow-sm"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            The Operating System<br />
            <span className="text-primary">for Modern Business</span>
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-6 font-light leading-relaxed"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.0, ease: "easeOut" }}
          >
            Nexus is a unified, modular platform—a collection of intelligent tools working together as your business operating system. <span className="text-primary font-medium">Productivity</span>, <span className="text-primary font-medium">Security</span>, and <span className="text-primary font-medium">Scalability</span> are built in.
          </motion.p>
          <motion.p
            className="text-base sm:text-lg text-muted-foreground mb-8 font-medium"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
          >
            Not just a tool—a system to run your entire business.
          </motion.p>
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 2.2, ease: "backOut" }}
          >
            <motion.a
              href="/signup"
              className="inline-block px-8 sm:px-10 py-3 sm:py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg sm:text-xl shadow-xl hover:bg-primary/90 hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/50 focus:ring-offset-2"
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
              aria-label="Get Started Free"
            >
              Get Started Free
            </motion.a>
            <motion.p
              className="text-sm text-muted-foreground mt-2 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.8 }}
            >
              No credit card. No chaos. All-in-one system.
            </motion.p>
          </motion.div>
        </div>
      </header>

      {/* WHAT IS NEXUS? */}
      <section className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4 text-foreground">What is Nexus?</h2>
        <p className="text-lg text-muted-foreground mb-4">
          Nexus is the business operating system—a foundation and a suite of integrated, intelligent tools for every department. It’s the system that connects your people, data, workflows, and AI, so your business runs smarter, faster, and safer.
        </p>
      </section>

      {/* WHY AN OPERATING SYSTEM? */}
      <section className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Why an Operating System?</h2>
        <p className="text-lg text-muted-foreground mb-4">
          Most tools solve one problem. Nexus is the system that brings everything together—eliminating silos, automating busywork, and giving you control and clarity as you scale.
        </p>
      </section>

      {/* PILLARS: PRODUCTIVITY, SECURITY, SCALABILITY */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Productivity</h3>
            <p className="text-muted-foreground text-sm">Automate workflows, unify communication, and surface insights—so your team can focus on what matters.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Security</h3>
            <p className="text-muted-foreground text-sm">Enterprise-grade security, compliance, and control—built in from the ground up.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <BarChart2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Scalability</h3>
            <p className="text-muted-foreground text-sm">From startup to enterprise, Nexus grows with you. Add tools, connect data, and scale without chaos.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: MODULAR SYSTEM */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold text-center mb-8 text-foreground">How Nexus Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="bg-card rounded-xl shadow p-6 flex flex-col items-center text-center">
            <h4 className="font-semibold text-lg mb-2">Modular & Unified</h4>
            <p className="text-muted-foreground text-sm">
              Start with what you need—add more as you grow. Every function, integration, and AI agent is designed to work together as one system.
            </p>
          </div>
          <div className="bg-card rounded-xl shadow p-6 flex flex-col items-center text-center">
            <h4 className="font-semibold text-lg mb-2">Cross-Departmental</h4>
            <p className="text-muted-foreground text-sm">
              Nexus connects sales, finance, operations, support, and more—so your whole business runs on one platform.
            </p>
          </div>
          <div className="bg-card rounded-xl shadow p-6 flex flex-col items-center text-center">
            <h4 className="font-semibold text-lg mb-2">AI-Native</h4>
            <p className="text-muted-foreground text-sm">
              Get actionable insights, recommendations, and automation from AI—spot trends, solve problems, and make smarter decisions, faster.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT: Mission and trust-building */}
      <section className="max-w-3xl mx-auto py-12 px-4 text-center border-t border-border mt-8">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Why Marcoby?</h2>
        <p className="text-muted-foreground text-lg mb-4">
          Marcoby builds systems for the bold—the founders, leaders, and doers who don’t have time for chaos. We obsess over security, reliability, and making your work effortless.<br className="hidden sm:inline" />So you can build, grow, and lead with clarity and confidence.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <span className="px-3 py-1 bg-primary/10 rounded-full">Security First</span>
          <span className="px-3 py-1 bg-primary/10 rounded-full">Customer Obsessed</span>
          <span className="px-3 py-1 bg-primary/10 rounded-full">Innovation Driven</span>
          <span className="px-3 py-1 bg-primary/10 rounded-full">Transparent & Reliable</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-6 text-center text-xs text-muted-foreground border-t border-border bg-background/80">
        &copy; {new Date().getFullYear()} Marcoby. All rights reserved. &mdash; Nexus Platform
      </footer>
    </div>
  );
};

export default App;
