import React from 'react';
import { Routes, Route, Navigate, useParams, Outlet, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from 'next-themes';
import { Home, Brain, Building2, Users, TrendingUp, Target, Zap, Eye, Activity, BarChart3, ArrowRight } from 'lucide-react';

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

// Callback system
import { initializeCallbackSystem } from './lib/callbacks';

// Pages
import EnhancedDashboard from './components/dashboard/EnhancedDashboard';
import NotFoundPage from './pages/NotFoundPage';
import AIHubPage from './pages/AIHubPage';
import WorkspacePage from './pages/WorkspacePage';
import ChatPage from './pages/ChatPage';
import IntegrationTrackingPage from './pages/IntegrationTrackingPage';
import ComponentDetailPage from './pages/ComponentDetailPage';
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
import UnifiedCallbackPage from './pages/UnifiedCallbackPage';

// Business Intelligence Components
import { QuickBusinessSetup } from './components/business/QuickBusinessSetup';
import { BusinessIntelligentChat } from './components/ai/BusinessIntelligentChat';

// Marketing Landing Page
import MarketingLanding from './pages/MarketingLanding';

// Department Pages
import FinancialOperationsPage from './pages/departments/finance/FinancialOperationsPage';
import SalesPerformancePage from './pages/departments/sales/SalesPerformancePage';
// Removed duplicate analytics pages - now using UnifiedAnalyticsPage
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
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import UnifiedAnalyticsPage from '@/pages/analytics/UnifiedAnalyticsPage';
import { SeePage } from '@/pages/SeePage';
import { ThinkPage } from '@/pages/ThinkPage';
import { ActPage } from '@/pages/ActPage';

// Workspace Builder Components
import { WorkspaceBuilder } from '@/components/workspace/WorkspaceBuilder';
import { WorkspaceMarketplace } from '@/components/workspace/WorkspaceMarketplace';

// --- Dynamic Page Imports ---
// These are pages that can be loaded on demand.
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

// Billing
import { PricingPage } from './pages/billing/PricingPage';

// Documents
import DocumentCenter from './pages/DocumentCenter';

// Add this import
import { AIPerformancePage } from '@/pages/ai-performance/AIPerformancePage';

// Import demo components
import { TrinityBrainDemo } from './components/demo/TrinityBrainDemo';
import { CrossDepartmentalIntelligenceDemo } from './components/demo/CrossDepartmentalIntelligenceDemo';
import { UnifiedBrainDemo } from './components/demo/UnifiedBrainDemo';
import { RealTimeSyncDemo } from './components/demo/RealTimeSyncDemo';
import { UnifiedBrainMetricsDashboard } from './components/dashboard/UnifiedBrainMetricsDashboard';
import { AutomatedWorkflowDemo } from './components/demo/AutomatedWorkflowDemo';
import { NaturalLanguageInterface } from './components/interface/NaturalLanguageInterface';
import { DemoShowcase } from './components/demo/DemoShowcase';

// Innovator Components
import { InnovatorWelcome } from './components/entrepreneur/InnovatorWelcome';
import { VisualBusinessBuilder } from './components/entrepreneur/VisualBusinessBuilder';

// Alias for backward compatibility
const BrainDemo = TrinityBrainDemo;

// --- Static Page Imports ---
import { CompanyProfilePage } from './pages/onboarding/CompanyProfilePage';

/**
 * Main App Component
 * 
 * Routes for the application including all sidebar navigation items
 */
function App() {
  const { user, signOut } = useAuth();
  
  // Clean up any corrupted localStorage entries on app start
  React.useEffect(() => {
    try {
      cleanupCorruptedStorage();
    } catch (error) {
      console.warn('Failed to cleanup corrupted storage:', error);
    }
  }, []);

  // Initialize callback system
  React.useEffect(() => {
    initializeCallbackSystem().catch(error => {
      console.error('Failed to initialize callback system:', error);
    });
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SystemContextProvider>
      <NotificationProvider>
        <OnboardingProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Routes>
              {/* Public Routes - Simple Layout */}
              
              {/* Landing and Demo Pages - Simple Layout */}
              <Route path="/" element={
                <div className="min-h-screen bg-gray-50">
                  {/* Simple Navigation for Public Pages */}
                  <nav className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex justify-between h-16">
                        <div className="flex items-center">
                          <Link to="/" className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">N</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Nexus</span>
                          </Link>
                        </div>
                        <div className="flex items-center space-x-8">
                          {/* Show product navigation only if authenticated */}
                          {user ? (
                            <>
                              {/* Core Product Navigation */}
                              <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 font-medium">
                                Dashboard
                              </Link>
                              <Link to="/workspace" className="text-gray-700 hover:text-blue-600 font-medium">
                                Workspace
                              </Link>
                              <Link to="/ai-hub" className="text-gray-700 hover:text-blue-600 font-medium">
                                AI Hub
                              </Link>
                              <Link to="/chat" className="text-gray-700 hover:text-blue-600 font-medium">
                                AI Chat
                              </Link>
                              <Link to="/analytics" className="text-gray-700 hover:text-blue-600 font-medium">
                                Analytics
                              </Link>
                              <Link to="/integrations" className="text-gray-700 hover:text-blue-600 font-medium">
                                Integrations
                              </Link>
                              
                              {/* Settings */}
                              <Link to="/settings" className="text-gray-700 hover:text-blue-600 font-medium">
                                Settings
                              </Link>
                              
                              {/* User Menu */}
                              <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-600">
                                  {user.email}
                                </span>
                                <button
                                  onClick={handleSignOut}
                                  className="text-gray-700 hover:text-red-600 font-medium"
                                >
                                  Sign Out
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Public navigation for non-authenticated users */}
                              <Link to="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">
                                Pricing
                              </Link>
                              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">
                                Sign In
                              </Link>
                              <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                Get Started
                              </Link>
                            </>
                          )}
                          
                          {/* Marketing Demos - Always visible */}
                          <div className="relative group">
                            <button className="text-gray-500 hover:text-blue-500 font-medium flex items-center text-sm">
                              Marketing Demos
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border">
                              <div className="py-1">
                                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Vision Demos</div>
                                <Link to="/innovator" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                  🚀 Start Your Business
                                </Link>
                                <Link to="/visual-builder" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                  🎨 Visual Builder
                                </Link>
                                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Brain Demos</div>
                                <Link to="/brain-demo" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                  🧠 Trinity Brain
                                </Link>
                                <Link to="/unified-brain" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                  🎯 Unified Brain
                                </Link>
                                <Link to="/real-time-sync" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                  ⚡ Real-Time Sync
                                </Link>
                                <Link to="/workflow-optimization" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                  🔧 Workflow AI
                                </Link>
                                <Link to="/natural-language" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                  💬 Ask AI
                                </Link>
                                <Link to="/metrics" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                                  📊 Metrics
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </nav>

                  {/* Main Content */}
                  <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <HomePage />
                  </main>
                </div>
              } />
              
              {/* Demo Pages - Simple Layout */}
              <Route path="/innovator" element={
                <div className="min-h-screen bg-gray-50">
                  <nav className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex justify-between h-16">
                        <div className="flex items-center">
                          <Link to="/" className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">N</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Nexus</span>
                          </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">← Back to Home</Link>
                          {!user && (
                            <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                              Get Started
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </nav>
                  <main><InnovatorWelcome /></main>
                </div>
              } />
              
              {/* Demo Showcase - Simple Layout */}
              <Route path="/demos" element={<div className="min-h-screen"><nav className="bg-white shadow-sm border-b h-16 flex items-center px-6"><Link to="/" className="flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div><span className="text-xl font-bold text-gray-900">Nexus</span></Link><div className="ml-auto"><Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">← Back to Home</Link></div></nav><main><DemoShowcase /></main></div>} />
              
              {/* Other Demo Pages with Simple Layout */}
              <Route path="/visual-builder" element={<div className="min-h-screen"><nav className="bg-white shadow-sm border-b h-16 flex items-center px-6"><Link to="/" className="flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div><span className="text-xl font-bold text-gray-900">Nexus</span></Link><div className="ml-auto"><Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">← Back to Home</Link></div></nav><main><VisualBusinessBuilder /></main></div>} />
              <Route path="/brain-demo" element={<div className="min-h-screen"><nav className="bg-white shadow-sm border-b h-16 flex items-center px-6"><Link to="/" className="flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div><span className="text-xl font-bold text-gray-900">Nexus</span></Link><div className="ml-auto"><Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">← Back to Home</Link></div></nav><main><BrainDemo /></main></div>} />
              <Route path="/unified-brain" element={<div className="min-h-screen"><nav className="bg-white shadow-sm border-b h-16 flex items-center px-6"><Link to="/" className="flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div><span className="text-xl font-bold text-gray-900">Nexus</span></Link><div className="ml-auto"><Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">← Back to Home</Link></div></nav><main><UnifiedBrainDemo /></main></div>} />
              <Route path="/trinity-brain" element={<div className="min-h-screen"><nav className="bg-white shadow-sm border-b h-16 flex items-center px-6"><Link to="/" className="flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div><span className="text-xl font-bold text-gray-900">Nexus</span></Link><div className="ml-auto"><Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">← Back to Home</Link></div></nav><main><TrinityBrainDemo /></main></div>} />
              <Route path="/real-time-sync" element={<div className="min-h-screen"><nav className="bg-white shadow-sm border-b h-16 flex items-center px-6"><Link to="/" className="flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div><span className="text-xl font-bold text-gray-900">Nexus</span></Link><div className="ml-auto"><Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">← Back to Home</Link></div></nav><main><RealTimeSyncDemo /></main></div>} />
              <Route path="/workflow-optimization" element={<div className="min-h-screen"><nav className="bg-white shadow-sm border-b h-16 flex items-center px-6"><Link to="/" className="flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div><span className="text-xl font-bold text-gray-900">Nexus</span></Link><div className="ml-auto"><Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">← Back to Home</Link></div></nav><main><AutomatedWorkflowDemo /></main></div>} />
              <Route path="/natural-language" element={<div className="min-h-screen"><nav className="bg-white shadow-sm border-b h-16 flex items-center px-6"><Link to="/" className="flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div><span className="text-xl font-bold text-gray-900">Nexus</span></Link><div className="ml-auto"><Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">← Back to Home</Link></div></nav><main><NaturalLanguageInterface /></main></div>} />
              <Route path="/metrics" element={<div className="min-h-screen"><nav className="bg-white shadow-sm border-b h-16 flex items-center px-6"><Link to="/" className="flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div><span className="text-xl font-bold text-gray-900">Nexus</span></Link><div className="ml-auto"><Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">← Back to Home</Link></div></nav><main><UnifiedBrainMetricsDashboard /></main></div>} />
              
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
                  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <Routes>
                      {/* All protected routes go here, copy from previous implementation */}
                      <Route path="/dashboard" element={<ProtectedRoute><UnifiedLayout><EnhancedDashboard /></UnifiedLayout></ProtectedRoute>} />
                      <Route
                        path="/workspace"
                        element={
                          <ProtectedRoute>
                            <UnifiedLayout>
                              <WorkspacePage />
                            </UnifiedLayout>
                          </ProtectedRoute>
                        }
                      >
                        <Route path="builder" element={<ProtectedRoute><WorkspaceBuilder /></ProtectedRoute>} />
                        <Route path="marketplace" element={<ProtectedRoute><WorkspaceMarketplace /></ProtectedRoute>} />
                      </Route>
                      <Route path="/ai-hub" element={<ProtectedRoute><UnifiedLayout><AIHubPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/chat" element={<ProtectedRoute><UnifiedLayout><ChatPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/ai-performance" element={<ProtectedRoute><UnifiedLayout><AIPerformancePage /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Business Intelligence - Protected */}
                      <Route path="/business-setup" element={<ProtectedRoute><UnifiedLayout><QuickBusinessSetup /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/business-chat" element={<ProtectedRoute><UnifiedLayout><BusinessIntelligentChat /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Analytics & Data - Protected */}
                      <Route path="/analytics" element={<ProtectedRoute><UnifiedLayout><UnifiedAnalyticsPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/data-warehouse" element={<ProtectedRoute><UnifiedLayout><DataWarehouseHome /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/assessment" element={<ProtectedRoute><UnifiedLayout><AssessmentPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/company-status" element={<ProtectedRoute><UnifiedLayout><CompanyStatusPage /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Trinity Framework - Protected */}
                      <Route path="/think" element={<ProtectedRoute><UnifiedLayout><ThinkPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/see" element={<ProtectedRoute><UnifiedLayout><SeePage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/act" element={<ProtectedRoute><UnifiedLayout><ActPage /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Department Pages - Protected */}
                      <Route path="/sales" element={<ProtectedRoute><UnifiedLayout><SalesPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/finance" element={<ProtectedRoute><UnifiedLayout><FinancePage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/marketing" element={<ProtectedRoute><UnifiedLayout><MarketingPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/operations" element={<ProtectedRoute><UnifiedLayout><OperationsPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/support" element={<ProtectedRoute><UnifiedLayout><SupportPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/hr" element={<ProtectedRoute><UnifiedLayout><HRPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/it" element={<ProtectedRoute><UnifiedLayout><ITPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/product" element={<ProtectedRoute><UnifiedLayout><ProductPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/customer-success" element={<ProtectedRoute><UnifiedLayout><CustomerSuccessPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/legal" element={<ProtectedRoute><UnifiedLayout><LegalPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/maturity" element={<ProtectedRoute><UnifiedLayout><MaturityPage /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Department Performance Pages - Protected */}
                      <Route path="/sales-performance" element={<ProtectedRoute><UnifiedLayout><SalesPerformancePage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/financial-operations" element={<ProtectedRoute><UnifiedLayout><FinancialOperationsPage /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Integrations - Protected */}
                      <Route path="/integrations" element={<ProtectedRoute><UnifiedLayout><IntegrationTrackingPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/integrations/api-learning" element={<ProtectedRoute><UnifiedLayout><ApiLearningPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/integrations/client-intelligence" element={<ProtectedRoute><UnifiedLayout><ClientIntelligencePage /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Settings - Protected */}
                      <Route path="/settings" element={<ProtectedRoute><UnifiedLayout><SettingsPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/settings/profile" element={<ProtectedRoute><UnifiedLayout><ProfileSettings /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/settings/security" element={<ProtectedRoute><UnifiedLayout><SecuritySettings /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/settings/team" element={<ProtectedRoute><UnifiedLayout><TeamSettings /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/settings/billing" element={<ProtectedRoute><UnifiedLayout><BillingSettings /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Profile & Account - Protected */}
                      <Route path="/profile" element={<ProtectedRoute><UnifiedLayout><React.Suspense fallback={<div>Loading...</div>}><ProfilePage /></React.Suspense></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/onboarding/company-profile" element={<ProtectedRoute><UnifiedLayout><CompanyProfilePage /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Documents - Protected */}
                      <Route path="/documents" element={<ProtectedRoute><UnifiedLayout><DocumentCenter /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Authentication - Simple Layout */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignUpPage />} />
                      <Route path="/password-reset" element={<PasswordResetPage />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                      <Route path="/auth/google-analytics-callback" element={<UnifiedCallbackPage integrationSlug="google-analytics" />} />
                      <Route path="/integrations/:integration/callback" element={<UnifiedCallbackPage />} />
                      <Route path="/email-not-verified" element={<EmailNotVerified />} />
                      
                      {/* Public Pages - Simple Layout */}
                      <Route path="/pricing" element={<PricingPage />} />
                      
                      {/* Help Site - Tree Navigation Layout */}
                      <Route path="/help" element={<HelpLayout />}>
                        <Route index element={<UserGuidePage />} />
                        <Route path="user-guide" element={<UserGuidePage />} />
                        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="data-usage" element={<DataUsagePage />} />
                        <Route path="security-compliance" element={<SecurityCompliancePage />} />
                        <Route path="about" element={<AboutPage />} />
                      </Route>
                      
                      {/* Admin - Protected */}
                      <Route path="/admin" element={<ProtectedRoute><UnifiedLayout><AdminPage /></UnifiedLayout></ProtectedRoute>} />
                      <Route path="/admin/users" element={<ProtectedRoute><UnifiedLayout><UserManagementPage /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* Marketing */}
                      <Route path="/marketing-landing" element={<MarketingLanding />} />
                      
                      {/* Component Details - Protected */}
                      <Route path="/component/:id" element={<ProtectedRoute><UnifiedLayout><ComponentDetailPage /></UnifiedLayout></ProtectedRoute>} />
                      
                      {/* 404 */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </ThemeProvider>
                } />
            </Routes>
          </ThemeProvider>
        </OnboardingProvider>
      </NotificationProvider>
    </SystemContextProvider>
  );
}

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Turn Your Idea Into a 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}Thriving Business
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              <strong>No business degree required.</strong> Nexus gives you the knowledge and guidance of 
              seasoned entrepreneurs, making it possible for anyone with a great idea to build a successful business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                to="/innovator" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🚀 Start Your Business Journey
              </Link>
              <Link 
                to="/visual-builder" 
                className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
              >
                🎨 Try Visual Builder
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>No business experience needed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Step-by-step guidance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Plain English explanations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Nexus is Perfect for First-Time Entrepreneurs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We believe great ideas shouldn't be held back by lack of business knowledge. 
              Nexus levels the playing field.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Business Mentor</h3>
              <p className="text-gray-600">
                Like having a seasoned business expert by your side 24/7, guiding every decision 
                with 20+ years of entrepreneurial wisdom.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-green-100">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Built for Beginners</h3>
              <p className="text-gray-600">
                No confusing jargon or MBA-speak. Everything explained in plain English with 
                real-world examples you can understand and apply.
              </p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Step-by-Step Process</h3>
              <p className="text-gray-600">
                From idea to thriving business, we break everything down into simple, 
                manageable steps that anyone can follow.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Stories Preview */}
      <div className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Real People, Real Success Stories
            </h2>
            <p className="text-lg text-gray-600">
              Everyday people with great ideas, now running successful businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">SJ</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Sarah Johnson</h3>
                  <p className="text-sm text-gray-600">Former Teacher</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "I had zero business experience but a great idea for educational toys. 
                Nexus walked me through everything step by step."
              </p>
              <div className="text-sm font-medium text-green-600">
                💰 $180K revenue in first year
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">MR</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Mike Rodriguez</h3>
                  <p className="text-sm text-gray-600">Construction Worker</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Started a landscaping business with just my truck and Nexus guidance. 
                Now I have a team and steady income."
              </p>
              <div className="text-sm font-medium text-green-600">
                👥 Grew from 1 to 8 employees
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">AL</span>
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Alex Liu</h3>
                  <p className="text-sm text-gray-600">College Dropout</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                "Built a tech startup without any business knowledge. Nexus was like 
                having a business mentor available 24/7."
              </p>
              <div className="text-sm font-medium text-green-600">
                🚀 $50K monthly recurring revenue
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Brain Showcase */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powered by the Nexus Unified Business Brain
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Every action you take is analyzed by our AI brain, which provides expert-level 
              guidance based on 20+ years of business expertise across all industries.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sees Everything</h3>
                  <p className="text-gray-600">
                    The brain analyzes every action, decision, and data point to understand 
                    your business context and provide relevant guidance.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Thinks Like an Expert</h3>
                  <p className="text-gray-600">
                    Contains the knowledge of seasoned entrepreneurs across sales, marketing, 
                    finance, operations, and customer success.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Acts with Wisdom</h3>
                  <p className="text-gray-600">
                    Provides actionable recommendations tailored to your experience level, 
                    from complete beginner to seasoned professional.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Your Personal Business Brain
                </h3>
                <p className="text-gray-600 mb-6">
                  Experience the power of having expert business knowledge at your fingertips, 
                  democratizing entrepreneurship for everyone.
                </p>
                <Link 
                  to="/unified-brain" 
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  <span>See the Brain in Action</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Turn Your Idea Into Reality?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of innovators who've built successful businesses with Nexus. 
            No experience required - just bring your passion and great idea.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/innovator" 
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              🚀 Start Your Business Journey
            </Link>
            <Link 
              to="/visual-builder" 
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              🎨 Try Visual Builder
            </Link>
          </div>
          
          <p className="text-blue-100 mt-6 text-sm">
            ✨ Free to start • No credit card required • Takes 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
