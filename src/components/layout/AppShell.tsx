import { useState } from 'react';
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getRouteLabel } from '@/routes';
import Sidebar from './Sidebar';
import Header from './Header';
import { QuickChatTrigger } from '@/components/ai/QuickChatTrigger';
import { useAuth } from '@/contexts/AuthContext';

const AppShell = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  // Generate breadcrumbs based on current route
  const generateBreadcrumbs = () => {
    const segments = location.pathname.split('/').filter(Boolean);

    // Build cumulative path for each segment to look up label
    const crumbs = segments.map((_, idx) => {
      const href = '/' + segments.slice(0, idx + 1).join('/');
      const label = getRouteLabel(href) ?? segments[idx];
      return { label, href };
    });

    return [{ label: 'Home', href: '/dashboard' }, ...crumbs];
  };

  const getPageTitle = () => {
    const label = getRouteLabel(location.pathname);
    return label ?? 'Welcome to NEXUS';
  };

  return (
    <div className="flex h-screen bg-muted/40">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex flex-col">
        <Header 
          pageTitle={getPageTitle()}
          breadcrumbs={generateBreadcrumbs()}
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
        />
        <main className="flex-1 overflow-y-auto pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* <DebugOnboardingTrigger /> */}
      <QuickChatTrigger />
    </div>
  );
};

export default AppShell; 