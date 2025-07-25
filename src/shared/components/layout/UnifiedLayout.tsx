import React, { useState } from 'react';
import { useAuth } from '@/hooks/index';
import { useRedirectManager } from '@/shared/hooks/useRedirectManager.ts';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface UnifiedLayoutProps {
  children: React.ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, session, loading, initialized } = useAuth();
  const { isPublicRoute, redirectInProgress } = useRedirectManager();

  // For public routes, render children without auth context
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Debug logging - only in development and only for important state changes
  if (import.meta.env.DEV && !user && !session && initialized && !loading) {
    console.log('[UnifiedLayout] No authenticated user on protected route');
  }

  // Debug logging for loading state
  if (import.meta.env.DEV) {
    console.log('[UnifiedLayout] Loading state:', { loading, initialized, redirectInProgress, hasUser: !!user, hasSession: !!session });
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
          {import.meta.env.DEV && (
            <div className="text-xs text-muted-foreground">
              Debug: loading={loading.toString()}, initialized={initialized.toString()}, redirectInProgress={redirectInProgress.toString()}
            </div>
          )}
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