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
  // Changed to false by default for utility panel behavior
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  return (
    <HeaderProvider>
      <div className="h-full bg-background flex flex-col overflow-hidden">
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded"
        >
          Skip to main content
        </a>

        {/* Header - Sticky Top */}
        <Header
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          isSidebarOpen={sidebarOpen}
        />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Utility Panel (formerly Sidebar) */}
          <div className={`
             border-r bg-muted/10 transition-all duration-300 ease-in-out
             ${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full overflow-hidden opacity-0'}
          `}>
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Main content area */}
          <main id="main-content" role="main" className="flex-1 overflow-y-auto relative bg-background">
            {children}
          </main>
        </div>
      </div>
    </HeaderProvider>
  );
}; 
