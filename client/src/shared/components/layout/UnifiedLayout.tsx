import React, { useState } from 'react';
import { useAuth } from '@/hooks/index';
import { useRedirectManager } from '@/shared/hooks/useRedirectManager';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { HeaderProvider } from '@/shared/hooks/useHeaderContext';

interface UnifiedLayoutProps {
  children: React.ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Changed to true for large screens
  const { user, session, loading, initialized } = useAuth();
  const { isPublicRoute, redirectInProgress } = useRedirectManager();

  // For public routes, render children without auth context
  if (isPublicRoute()) {
    return <>{children}</>;
  }

  // Show loading while auth is initializing or redirecting
  if (loading || !initialized || redirectInProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">
            {redirectInProgress ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Check authentication for protected routes
  if (!user || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <HeaderProvider>
      <div className="min-h-screen bg-background">
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded"
        >
          Skip to main content
        </a>
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
          />
          
          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header 
              onSidebarToggle={() => setSidebarOpen(true)}
            />
            
            {/* Main content area - Full width responsive */}
            <main id="main-content" role="main" className="flex-1 overflow-y-auto">
              <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pt-8 pb-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </HeaderProvider>
  );
}; 
