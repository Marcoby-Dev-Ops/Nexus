import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/index';
import { useRedirectManager } from '@/shared/hooks/useRedirectManager';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { HeaderProvider } from '@/shared/hooks/useHeaderContext';
import { useUserPreferences } from '@/shared/hooks/useUserPreferences';
import { useIsMobile } from '@/lib/hooks/use-mobile';

interface UnifiedLayoutProps {
  children: React.ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const { preferences, loading: preferencesLoading, updatePreferences } = useUserPreferences();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { loading, initialized } = useAuth();
  const { isPublicRoute, redirectInProgress } = useRedirectManager();
  const isChatRoute = location.pathname === '/chat';

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      return;
    }

    if (preferencesLoading) return;
    setSidebarOpen(!(preferences?.sidebar_collapsed ?? false));
  }, [isMobile, preferencesLoading, preferences?.sidebar_collapsed]);

  const handleSidebarToggle = () => {
    setSidebarOpen((previous) => {
      const next = !previous;
      if (!isMobile) {
        void updatePreferences({ sidebar_collapsed: !next });
      }
      return next;
    });
  };

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
      <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden supports-[height:100dvh]:h-[100dvh]">
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded"
        >
          Skip to main content
        </a>

        {/* Header - Sticky Top */}
        <Header
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={sidebarOpen}
        />

        <div className="relative flex-1 min-h-0 overflow-hidden">
          {/* Utility Panel (formerly Sidebar) - overlays content */}
          <div className={`
             absolute inset-y-0 left-0 z-30 border-r bg-background transition-all duration-300 ease-in-out
             ${sidebarOpen ? 'w-[23rem] xl:w-[24rem] translate-x-0 opacity-100' : 'w-0 -translate-x-full overflow-hidden opacity-0'}
          `}>
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Main content area */}
          <main
            id="main-content"
            role="main"
            className={`h-full min-h-0 relative bg-background ${isChatRoute ? 'overflow-hidden' : 'overflow-y-auto'}`}
          >
            {children}
          </main>
        </div>
      </div>
    </HeaderProvider>
  );
}; 
