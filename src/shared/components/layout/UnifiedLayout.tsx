import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useZustandAuth } from '@/shared/hooks/useZustandAuth';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface UnifiedLayoutProps {
  children: React.ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const { user, session, loading, initialized } = useZustandAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Debug logging
  console.log('[UnifiedLayout] State:', {
    pathname: location.pathname,
    user: !!user,
    session: !!session,
    loading,
    initialized,
    userEmail: user?.email,
    sessionId: session?.access_token?.substring(0, 10)
  });

  // Handle authentication redirects in useEffect
  useEffect(() => {
    if (!loading && initialized && !user && !session && !isRedirecting) {
      console.log('[UnifiedLayout] No user or session, redirecting to login');
      setIsRedirecting(true);
      navigate('/login', { replace: true });
    }
  }, [user, session, loading, initialized, navigate, isRedirecting]);

  // Define public routes
  const publicRoutes = ['/', '/login', '/signup', '/reset-password', '/auth/callback'];

  // Memoize public routes check to prevent unnecessary recalculations
  const isPublicRoute = useMemo(() => {
    return publicRoutes.some(route => 
      location.pathname === route || 
      (route !== '/' && location.pathname.startsWith(route))
    );
  }, [location.pathname, publicRoutes]);
  
  console.log('[UnifiedLayout] Route check:', {
    pathname: location.pathname,
    publicRoutes,
    isPublicRoute
  });
  
  if (isPublicRoute) {
    console.log('[UnifiedLayout] Rendering public route without layout');
    return <>{children}</>;
  }

  // Show loading while auth is initializing
  if (loading || !initialized || isRedirecting) {
    console.log('[UnifiedLayout] Showing loading spinner - auth not ready or redirecting');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">
            {isRedirecting ? 'Redirecting to login...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Check authentication for protected routes
  if (!user || !session) {
    console.log('[UnifiedLayout] No user or session, showing loading while redirecting');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  console.log('[UnifiedLayout] Rendering layout with header and sidebar');
  return (
    <div className="min-h-screen bg-background">
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
            onThemePanelToggle={() => {}}
          />
          
          {/* Main content area */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}; 